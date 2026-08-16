from datetime import date

from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db

ROLE_PATIENT = "patient"
ROLE_ADMIN = "admin"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=ROLE_PATIENT, index=True)

    appointments = db.relationship(
        "Appointment",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    prescriptions = db.relationship(
        "Prescription",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def is_admin(self) -> bool:
        return self.role == ROLE_ADMIN

    @property
    def is_patient(self) -> bool:
        return self.role == ROLE_PATIENT

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_details: bool = False) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "appointment_count": len(self.appointments),
            "prescription_count": len(self.prescriptions),
        }
        if include_details:
            data["appointments"] = [a.to_dict() for a in self.appointments]
            data["prescriptions"] = [p.to_dict() for p in self.prescriptions]
        return data


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    provider = db.Column(db.String(120), nullable=False)
    datetime = db.Column(db.DateTime(timezone=True), nullable=False)
    repeat = db.Column(db.String(20), nullable=False, default="none")
    ends_on = db.Column(db.Date, nullable=True)

    user = db.relationship("User", back_populates="appointments")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "provider": self.provider,
            "datetime": self.datetime.isoformat() if self.datetime else None,
            "repeat": self.repeat,
            "ends_on": self.ends_on.isoformat() if self.ends_on else None,
        }


class Prescription(db.Model):
    __tablename__ = "prescriptions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    medication = db.Column(db.String(120), nullable=False)
    dosage = db.Column(db.String(40), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    refill_on = db.Column(db.Date, nullable=False)
    refill_schedule = db.Column(db.String(20), nullable=False, default="monthly")

    user = db.relationship("User", back_populates="prescriptions")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "medication": self.medication,
            "dosage": self.dosage,
            "quantity": self.quantity,
            "refill_on": self.refill_on.isoformat() if isinstance(self.refill_on, date) else self.refill_on,
            "refill_schedule": self.refill_schedule,
        }


class AppMeta(db.Model):
    """Stores reference lists (medications / dosages) from seed data."""

    __tablename__ = "app_meta"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.JSON, nullable=False)
