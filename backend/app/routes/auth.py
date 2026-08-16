from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token

from ..extensions import db
from ..models import ROLE_ADMIN, ROLE_PATIENT, User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _token_response(user: User):
    token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "email": user.email,
            "name": user.name,
            "role": user.role,
        },
    )
    return jsonify(
        {
            "access_token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            },
        }
    )


@auth_bp.post("/register")
def register():
    """Public patient signup only — cannot create doctor/admin accounts."""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    # Always patient — ignore any role field sent by the client
    user = User(name=name, email=email, role=ROLE_PATIENT)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Account created successfully",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                },
            }
        ),
        201,
    )


@auth_bp.post("/login")
def login():
    """Patient portal login — doctors cannot use this endpoint."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    if user.role != ROLE_PATIENT:
        return jsonify({"error": "Use the doctor login for staff accounts"}), 403

    return _token_response(user)


@auth_bp.post("/admin/login")
def admin_login():
    """Doctor / mini-EMR login — patients cannot use this endpoint."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    if user.role != ROLE_ADMIN:
        return jsonify({"error": "Doctor credentials required"}), 403

    return _token_response(user)
