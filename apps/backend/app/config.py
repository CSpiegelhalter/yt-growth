# app/config.py
from typing import Literal
from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # v2 way to load .env locally; in Docker, compose injects env so this is harmless
    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")
    # core
    DATABASE_URL: str = "postgresql+psycopg://yt:yt@db:5432/yt"

    # google oauth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: SecretStr
    OAUTH_REDIRECT_URI: str

    # auth (dev helper until Cognito wired)
    DEV_MODE: bool = True
    DEV_USER_ID: str = "dev-user-1"

    # billing / stripe
    STRIPE_WEBHOOK_SECRET: str | None = None
    DEFAULT_PLAN: Literal["basic","pro","team"] = "basic"

    # where to send users after Google callback
    FRONTEND_AFTER_LINK_URL: str = "http://localhost:3000/channels"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _strip_quotes(cls, v: str) -> str:
        # Handle cases where .env/compose injects quotes or trailing spaces
        if isinstance(v, str):
            v = v.strip().strip('"').strip("'")
        return v

settings = Settings()

# simple, opinionated limits (override later with DB-driven limits)
PLAN_LIMITS = {"basic": 1, "pro": 5, "team": 20}
