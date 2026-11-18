"""
SmartAttend AI / CampusAI - Recognized Colleges Model

Stores verified and recognized institutions from official records (AICTE / UGC).
"""

from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime, timezone
from app.database import Base


class College(Base):
    __tablename__ = "colleges"

    college_id = Column(String(50), primary_key=True, index=True)
    college_name = Column(String(250), nullable=False, index=True)
    college_code = Column(String(50), unique=True, nullable=False, index=True)
    location = Column(String(150), nullable=False)
    state = Column(String(100), nullable=False, index=True)
    affiliation = Column(String(200), nullable=False)
    verification_status = Column(String(50), default="verified", nullable=False)  # "verified", "pending", "rejected"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "college_id": self.college_id,
            "college_name": self.college_name,
            "college_code": self.college_code,
            "location": self.location,
            "state": self.state,
            "affiliation": self.affiliation,
            "verification_status": self.verification_status,
        }
