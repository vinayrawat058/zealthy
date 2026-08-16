from flask import Blueprint

from .admin import admin_bp
from .auth import auth_bp
from .meta import meta_bp
from .portal import portal_bp


def register_blueprints(app):
    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(portal_bp)
    app.register_blueprint(meta_bp)
