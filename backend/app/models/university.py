"""
SmartAttend AI / CampusAI - University Model (Tenant Isolation)
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime
from datetime import datetime, timezone
from app.database import Base


class University(Base):
    __tablename__ = "universities"

    id = Column(String(50), primary_key=True, index=True)  # e.g. UNI-2026-0001
    name = Column(String(200), nullable=False)
    official_email = Column(String(150), unique=True, nullable=False, index=True)
    contact_number = Column(String(50), nullable=False)
    address = Column(Text, nullable=False)
    website = Column(String(200), nullable=True)
    logo_url = Column(Text, nullable=True)  # base64 data url or image link
    admin_name = Column(String(100), nullable=False)
    admin_email = Column(String(150), nullable=False)
    profile_completed = Column(Boolean, default=False)
    registration_status = Column(String(50), default="approved")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
