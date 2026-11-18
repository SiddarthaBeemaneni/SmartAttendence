"""
SmartAttend AI / CampusAI - User Model

Tracks registered users with hashed passwords, verified colleges,
email verification flags, and account status.
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from datetime import datetime, timezone
from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(String(50), primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    college_id = Column(String(50), ForeignKey("colleges.college_id"), nullable=True, index=True)
    role = Column(String(50), default="admin", nullable=False)  # admin, faculty, student, parent
    email_verified = Column(Boolean, default=False, nullable=False)
    account_status = Column(String(50), default="active", nullable=False)  # active, unverified, suspended
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "full_name": self.full_name,
            "email": self.email,
            "college_id": self.college_id,
            "role": self.role,
            "email_verified": self.email_verified,
            "account_status": self.account_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
