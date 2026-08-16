from flask import Flask

from .config import Config
from .extensions import cors, db, jwt
from .routes import register_blueprints
from .seed import ensure_admin_user, ensure_schema, seed_database


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    register_blueprints(app)

    with app.app_context():
        from . import models  # noqa: F401

        db.create_all()
        ensure_schema()
        seed_database(app.config["SEED_DATA_PATH"])
        ensure_admin_user()

    @app.get("/")
    def index():
        return {
            "name": "Zealthy API",
            "docs": "See README for endpoint list",
            "health": "/api/health",
        }

    return app
