"""
SmartAttend AI - Application Configuration

This file reads settings from environment variables (.env file).
It uses pydantic-settings to automatically load and validate config values.

WHY: We never hardcode passwords, API keys, or database URLs in our code.
     Instead, we store them in a .env file that is NOT committed to git.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    How it works:
    - Each field below maps to an environment variable with the same name.
    - pydantic-settings automatically reads from the .env file.
    - If a required variable is missing, the app won't start (which is good — 
      it prevents running with broken config).
    """

    # Database connection string
    # Format: postgresql://username:password@host:port/database_name
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/smartattend"

    # JWT (JSON Web Token) settings for authentication
    # SECRET_KEY: A random string used to sign tokens. Change this in production!
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    # ALGORITHM: The encryption algorithm for JWT tokens
    ALGORITHM: str = "HS256"
    # How long a login token stays valid (in minutes)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Application settings
    APP_NAME: str = "SmartAttend AI"
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:5173"

    # Calling Mode: 'simulation' (default, requires zero credentials) or 'live'
    CALL_MODE: str = "simulation"

    # AI Services
    SARVAM_API_KEY: Optional[str] = None
    SARVAM_API_URL: Optional[str] = "https://api.sarvam.ai"
    LLM_API_KEY: Optional[str] = None
    LLM_API_URL: Optional[str] = None

    # Telephony
    EXOTEL_API_KEY: Optional[str] = None
    EXOTEL_API_TOKEN: Optional[str] = None
    EXOTEL_SID: Optional[str] = None
    EXOTEL_SUBDOMAIN: Optional[str] = "api.exotel.com"
    EXOTEL_CALLER_ID: Optional[str] = None
    EXOTEL_WEBHOOK_SECRET: Optional[str] = None

    # Background Queue / Redis (optional - resilient thread-pool fallback used if absent)
    REDIS_URL: Optional[str] = None

    def validate_calling_config(self) -> None:
        """Validate live-mode configuration at startup."""
        if self.CALL_MODE == "live":
            missing = []
            if not self.EXOTEL_API_KEY: missing.append("EXOTEL_API_KEY")
            if not self.EXOTEL_API_TOKEN: missing.append("EXOTEL_API_TOKEN")
            if not self.EXOTEL_SID: missing.append("EXOTEL_SID")
            if not self.EXOTEL_CALLER_ID: missing.append("EXOTEL_CALLER_ID")
            if not self.SARVAM_API_KEY: missing.append("SARVAM_API_KEY")
            if missing:
                raise RuntimeError(
                    f"FATAL: CALL_MODE is set to 'live' but required credentials are missing: {', '.join(missing)}. "
                    "Either set CALL_MODE=simulation in .env or configure all provider credentials."
                )

    # Zoho ZeptoMail Configuration
    ZEPTOMAIL_API_KEY: Optional[str] = None
    ZEPTOMAIL_API_URL: str = "https://api.zeptomail.in/v1.1/email"
    ZEPTOMAIL_BOUNCE_ADDRESS: Optional[str] = None
    ZEPTOMAIL_FROM_EMAIL: str = "noreply@smartattend.edu"
    ZEPTOMAIL_FROM_NAME: str = "SmartAttend AI - College Verification"

    class Config:
        # Tell pydantic-settings to look for a .env file in the backend directory
        env_file = ".env"
        # Allow extra fields in .env without errors
        extra = "ignore"


# Create a single settings instance that the whole app will use
# Usage: from app.config import settings
settings = Settings()
