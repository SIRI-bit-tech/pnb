import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(..., validation_alias="DATABASE_URL")

    # Authentication (Stytch & BetterAuth)
    STYTCH_PROJECT_ID: str = Field("", validation_alias="STYTCH_PROJECT_ID")
    STYTCH_SECRET: str = Field("", validation_alias="STYTCH_SECRET")
    BETTER_AUTH_SECRET: str = Field("", validation_alias="BETTER_AUTH_SECRET")

    # Real-time
    ABLY_API_KEY: str = Field("", validation_alias="ABLY_API_KEY")

    # Market Data
    FINNHUB_API_KEY: str = Field("", validation_alias="FINNHUB_API_KEY")

    # Security
    PEPPER_KEY: str = Field("default-secret-pepper-do-not-use-in-production", validation_alias="PEPPER_KEY")
    ADMIN_REGISTRATION_CODE: str = Field("ADMIN2026", validation_alias="ADMIN_REGISTRATION_CODE")


    # UploadThing Config
    UPLOADTHING_TOKEN: str = Field("", validation_alias="UPLOADTHING_TOKEN")
    UPLOADTHING_SECRET: str = Field("", validation_alias="UPLOADTHING_SECRET")

    # Resend (Email OTP & Transactional)
    RESEND_API_KEY: str = Field("", validation_alias="RESEND_API_KEY")
    RESEND_FROM_EMAIL: str = Field("Prescott National Bank <noreply@prescottnational.com>", validation_alias="RESEND_FROM_EMAIL")
    SUPPORT_EMAIL: str = Field("support@prescottnational.com", validation_alias="SUPPORT_EMAIL")
    CONTACT_RECEIVER_EMAIL: str = Field("", validation_alias="CONTACT_RECEIVER_EMAIL")
    APP_URL: str = Field("https://prescottnational.com", validation_alias="APP_URL")

    # RapidAPI
    RAPIDAPI_KEY: str = Field("", validation_alias="RAPIDAPI_KEY")

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def async_database_url(self) -> str:
        """
        Adapts Neon/Postgres DATABASE_URL to SQLAlchemy asyncpg format.
        Strips query parameters (e.g. sslmode) and converts postgresql:// to postgresql+asyncpg://
        """
        url = self.DATABASE_URL
        if "?" in url:
            url = url.split("?")[0]
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

@lru_cache
def get_settings() -> Settings:
    return Settings()
