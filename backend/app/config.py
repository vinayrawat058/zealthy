import os
from datetime import timedelta


class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'zealthy.db')}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get(
        "JWT_SECRET_KEY",
        "zealthy-dev-secret-change-me-in-production-32b",
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    SEED_DATA_PATH = os.path.join(BASE_DIR, "data", "data.json")
