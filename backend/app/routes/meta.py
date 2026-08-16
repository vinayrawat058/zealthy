from flask import Blueprint, jsonify

from ..models import AppMeta

meta_bp = Blueprint("meta", __name__, url_prefix="/api")


@meta_bp.get("/medications")
def list_medications():
    row = AppMeta.query.filter_by(key="medications").first()
    return jsonify(row.value if row else [])


@meta_bp.get("/dosages")
def list_dosages():
    row = AppMeta.query.filter_by(key="dosages").first()
    return jsonify(row.value if row else [])


@meta_bp.get("/health")
def health():
    return jsonify({"status": "ok"})
