import json
from datetime import datetime
from pathlib import Path

from dateutil import parser as date_parser
from sqlalchemy import inspect, text

from .extensions import db
from .models import ROLE_ADMIN, ROLE_PATIENT, Appointment, AppMeta, Prescription, User

DEFAULT_ADMIN_EMAIL = "doctor@zealthy.com"
DEFAULT_ADMIN_PASSWORD = "Doctor123!"
DEFAULT_ADMIN_NAME = "Dr Zealthy"


def ensure_schema() -> None:
    """Add newer columns to existing SQLite DBs without wiping data."""
    inspector = inspect(db.engine)
    if "users" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("users")}
    if "role" not in columns:
        db.session.execute(
            text(
                "ALTER TABLE users ADD COLUMN role VARCHAR(20) "
                f"NOT NULL DEFAULT '{ROLE_PATIENT}'"
            )
        )
        db.session.commit()


def ensure_admin_user() -> None:
    admin = User.query.filter_by(email=DEFAULT_ADMIN_EMAIL).first()
    if admin:
        if admin.role != ROLE_ADMIN:
            admin.role = ROLE_ADMIN
            db.session.commit()
        return

    admin = User(
        name=DEFAULT_ADMIN_NAME,
        email=DEFAULT_ADMIN_EMAIL,
        role=ROLE_ADMIN,
    )
    admin.set_password(DEFAULT_ADMIN_PASSWORD)
    db.session.add(admin)
    db.session.commit()


def seed_database(seed_path: str) -> None:
    """Load initial patients from data.json if no patients exist yet."""
    ensure_schema()

    # Prefer role filter; fall back if an old DB is mid-migration.
    try:
        has_patients = (
            User.query.filter_by(role=ROLE_PATIENT).first() is not None
        )
    except Exception:
        db.session.rollback()
        ensure_schema()
        has_patients = User.query.first() is not None

    if has_patients:
        ensure_admin_user()
        return

    path = Path(seed_path)
    if not path.exists():
        raise FileNotFoundError(f"Seed file not found: {seed_path}")

    with path.open(encoding="utf-8") as f:
        payload = json.load(f)

    for user_data in payload.get("users", []):
        user = User(
            id=user_data["id"],
            name=user_data["name"],
            email=user_data["email"],
            role=ROLE_PATIENT,
        )
        user.set_password(user_data["password"])
        db.session.add(user)

        for appt in user_data.get("appointments", []):
            dt = date_parser.isoparse(appt["datetime"])
            db.session.add(
                Appointment(
                    id=appt["id"],
                    user_id=user_data["id"],
                    provider=appt["provider"],
                    datetime=dt,
                    repeat=appt.get("repeat", "none"),
                    ends_on=None,
                )
            )

        for rx in user_data.get("prescriptions", []):
            refill_on = datetime.strptime(rx["refill_on"], "%Y-%m-%d").date()
            db.session.add(
                Prescription(
                    id=rx["id"],
                    user_id=user_data["id"],
                    medication=rx["medication"],
                    dosage=rx["dosage"],
                    quantity=rx["quantity"],
                    refill_on=refill_on,
                    refill_schedule=rx.get("refill_schedule", "monthly"),
                )
            )

    if not AppMeta.query.filter_by(key="medications").first():
        db.session.add(
            AppMeta(key="medications", value=payload.get("medications", []))
        )
    if not AppMeta.query.filter_by(key="dosages").first():
        db.session.add(
            AppMeta(key="dosages", value=payload.get("dosages", []))
        )

    db.session.commit()
    ensure_admin_user()
