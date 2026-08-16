from datetime import datetime, timedelta, timezone

from dateutil.relativedelta import relativedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from ..models import ROLE_PATIENT, User
from ..utils.schedule import expand_appointments, expand_prescription_refills

portal_bp = Blueprint("portal", __name__, url_prefix="/api/portal")


def _current_patient():
    claims = get_jwt()
    if claims.get("role") != ROLE_PATIENT:
        return None
    user_id = int(get_jwt_identity())
    return User.query.filter_by(id=user_id, role=ROLE_PATIENT).first()


@portal_bp.get("/me")
@jwt_required()
def portal_summary():
    """Patient dashboard: basic info + next-7-days appointments & refills."""
    user = _current_patient()
    if not user:
        return jsonify({"error": "Patient access required"}), 403

    now = datetime.now(timezone.utc)
    week_end = now + timedelta(days=7)

    upcoming_appts = expand_appointments(
        user.appointments, start=now, end=week_end
    )
    upcoming_refills = expand_prescription_refills(
        user.prescriptions,
        start=now.date(),
        end=week_end.date(),
    )

    return jsonify(
        {
            "patient": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
            },
            "appointments_next_7_days": upcoming_appts,
            "refills_next_7_days": upcoming_refills,
        }
    )


@portal_bp.get("/appointments")
@jwt_required()
def portal_appointments():
    """Full upcoming appointment schedule (up to 3 months)."""
    user = _current_patient()
    if not user:
        return jsonify({"error": "Patient access required"}), 403

    now = datetime.now(timezone.utc)
    end = now + relativedelta(months=3)
    occurrences = expand_appointments(user.appointments, start=now, end=end)
    return jsonify(
        {
            "patient_id": user.id,
            "from": now.isoformat(),
            "to": end.isoformat(),
            "appointments": occurrences,
        }
    )


@portal_bp.get("/prescriptions")
@jwt_required()
def portal_prescriptions():
    """All current prescriptions plus refill schedule out to 3 months."""
    user = _current_patient()
    if not user:
        return jsonify({"error": "Patient access required"}), 403

    today = datetime.now(timezone.utc).date()
    end = today + relativedelta(months=3)
    refills = expand_prescription_refills(
        user.prescriptions, start=today, end=end
    )
    return jsonify(
        {
            "patient_id": user.id,
            "from": today.isoformat(),
            "to": end.isoformat(),
            "prescriptions": [p.to_dict() for p in user.prescriptions],
            "refill_schedule": refills,
        }
    )
