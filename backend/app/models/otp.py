"""
SmartAttend AI / CampusAI - Email OTP Verification Model

Tracks secure, hashed 6-digit OTPs with strict 5-minute expiration,
attempt counters, and verification flags.
"""

from sqlalchemy import Column, String, Boolean, Integer, DateTime
from datetime import datetime, timezone
from app.database import Base


class EmailOTP(Base):
    __tablename__ = "email_otps"

    otp_id = Column(String(50), primary_key=True, index=True)
    email = Column(String(150), nullable=False, index=True)
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "otp_id": self.otp_id,
            "email": self.email,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "verified": self.verified,
            "attempts": self.attempts,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
