from datetime import datetime

from dateutil import parser as date_parser
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, verify_jwt_in_request

from ..extensions import db
from ..models import ROLE_PATIENT, Appointment, Prescription, User

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.before_request
def require_admin():
    verify_jwt_in_request()
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Doctor access required"}), 403


def _parse_date(value: str | None):
    if not value:
        return None
    return datetime.strptime(value[:10], "%Y-%m-%d").date()


def _parse_datetime(value: str):
    return date_parser.isoparse(value)


def _get_patient_or_404(patient_id: int) -> User:
    user = User.query.filter_by(id=patient_id, role=ROLE_PATIENT).first_or_404()
    return user


# ---------- Patients ----------


@admin_bp.get("/patients")
def list_patients():
    patients = User.query.filter_by(role=ROLE_PATIENT).order_by(User.id).all()
    return jsonify([p.to_dict() for p in patients])


@admin_bp.post("/patients")
def create_patient():
    data = request.get_json(silent=True) or {}
    required = ("name", "email", "password")
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    if User.query.filter_by(email=data["email"].strip().lower()).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        name=data["name"].strip(),
        email=data["email"].strip().lower(),
        role=ROLE_PATIENT,
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict(include_details=True)), 201


@admin_bp.get("/patients/<int:patient_id>")
def get_patient(patient_id: int):
    user = _get_patient_or_404(patient_id)
    return jsonify(user.to_dict(include_details=True))


@admin_bp.put("/patients/<int:patient_id>")
def update_patient(patient_id: int):
    user = _get_patient_or_404(patient_id)
    data = request.get_json(silent=True) or {}

    if "name" in data and data["name"]:
        user.name = data["name"].strip()

    if "email" in data and data["email"]:
        email = data["email"].strip().lower()
        existing = User.query.filter(User.email == email, User.id != user.id).first()
        if existing:
            return jsonify({"error": "Email already registered"}), 409
        user.email = email

    if data.get("password"):
        user.set_password(data["password"])

    db.session.commit()
    return jsonify(user.to_dict(include_details=True))


# ---------- Appointments ----------


@admin_bp.get("/patients/<int:patient_id>/appointments")
def list_patient_appointments(patient_id: int):
    _get_patient_or_404(patient_id)
    appts = (
        Appointment.query.filter_by(user_id=patient_id)
        .order_by(Appointment.datetime)
        .all()
    )
    return jsonify([a.to_dict() for a in appts])


@admin_bp.post("/patients/<int:patient_id>/appointments")
def create_appointment(patient_id: int):
    _get_patient_or_404(patient_id)
    data = request.get_json(silent=True) or {}

    if not data.get("provider") or not data.get("datetime"):
        return jsonify({"error": "provider and datetime are required"}), 400

    appt = Appointment(
        user_id=patient_id,
        provider=data["provider"].strip(),
        datetime=_parse_datetime(data["datetime"]),
        repeat=(data.get("repeat") or "none").lower(),
        ends_on=_parse_date(data.get("ends_on")),
    )
    db.session.add(appt)
    db.session.commit()
    return jsonify(appt.to_dict()), 201


@admin_bp.put("/appointments/<int:appointment_id>")
def update_appointment(appointment_id: int):
    appt = Appointment.query.get_or_404(appointment_id)
    data = request.get_json(silent=True) or {}

    if "provider" in data and data["provider"]:
        appt.provider = data["provider"].strip()
    if "datetime" in data and data["datetime"]:
        appt.datetime = _parse_datetime(data["datetime"])
    if "repeat" in data and data["repeat"] is not None:
        appt.repeat = data["repeat"].lower()
    if "ends_on" in data:
        appt.ends_on = _parse_date(data["ends_on"])

    db.session.commit()
    return jsonify(appt.to_dict())


@admin_bp.delete("/appointments/<int:appointment_id>")
def delete_appointment(appointment_id: int):
    appt = Appointment.query.get_or_404(appointment_id)
    db.session.delete(appt)
    db.session.commit()
    return jsonify({"message": "Appointment deleted"}), 200


# ---------- Prescriptions ----------


@admin_bp.get("/patients/<int:patient_id>/prescriptions")
def list_patient_prescriptions(patient_id: int):
    _get_patient_or_404(patient_id)
    rxs = (
        Prescription.query.filter_by(user_id=patient_id)
        .order_by(Prescription.refill_on)
        .all()
    )
    return jsonify([p.to_dict() for p in rxs])


@admin_bp.post("/patients/<int:patient_id>/prescriptions")
def create_prescription(patient_id: int):
    _get_patient_or_404(patient_id)
    data = request.get_json(silent=True) or {}

    required = ("medication", "dosage", "refill_on")
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    rx = Prescription(
        user_id=patient_id,
        medication=data["medication"].strip(),
        dosage=data["dosage"].strip(),
        quantity=int(data.get("quantity") or 1),
        refill_on=_parse_date(data["refill_on"]),
        refill_schedule=(data.get("refill_schedule") or "monthly").lower(),
    )
    db.session.add(rx)
    db.session.commit()
    return jsonify(rx.to_dict()), 201


@admin_bp.put("/prescriptions/<int:prescription_id>")
def update_prescription(prescription_id: int):
    rx = Prescription.query.get_or_404(prescription_id)
    data = request.get_json(silent=True) or {}

    if "medication" in data and data["medication"]:
        rx.medication = data["medication"].strip()
    if "dosage" in data and data["dosage"]:
        rx.dosage = data["dosage"].strip()
    if "quantity" in data and data["quantity"] is not None:
        rx.quantity = int(data["quantity"])
    if "refill_on" in data and data["refill_on"]:
        rx.refill_on = _parse_date(data["refill_on"])
    if "refill_schedule" in data and data["refill_schedule"]:
        rx.refill_schedule = data["refill_schedule"].lower()

    db.session.commit()
    return jsonify(rx.to_dict())


@admin_bp.delete("/prescriptions/<int:prescription_id>")
def delete_prescription(prescription_id: int):
    rx = Prescription.query.get_or_404(prescription_id)
    db.session.delete(rx)
    db.session.commit()
    return jsonify({"message": "Prescription deleted"}), 200
