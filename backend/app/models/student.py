"""
SmartAttend AI / CampusAI - Student Model (Multi-Tenant Isolated)
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, UniqueConstraint, Index
from datetime import datetime, timezone
from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(String(50), primary_key=True, index=True)
    university_id = Column(String(50), nullable=False, index=True)

    # Student Details
    name = Column(String(150), nullable=False)
    roll_number = Column(String(50), nullable=False, index=True)
    department = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False, default=1)
    semester = Column(Integer, nullable=False, default=1)
    section = Column(String(20), nullable=False, default="A")

    # Parent / Guardian Details
    parent_name = Column(String(150), nullable=False)
    parent_phone = Column(String(50), nullable=False)
    parent_relationship = Column(String(50), nullable=True, default="Parent")  # 'Father', 'Mother', 'Guardian'
    preferred_language = Column(String(10), nullable=False, default="en")  # 'ta','en','te','hi','ml','kn'
    preferred_form_of_address = Column(String(20), nullable=False, default="Mr.")  # 'Mr.', 'Mrs.', 'Dr.', etc.

    # Attendance & Calling Compliance (Default False - must be explicitly consented & verified)
    attendance_percentage = Column(Float, default=100.0)
    consent_given = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    status = Column(String(20), default="active")

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Tenant-level uniqueness constraint: Roll number must be unique within each university
    __table_args__ = (
        UniqueConstraint("university_id", "roll_number", name="uq_university_student_roll"),
        Index("idx_univ_dept", "university_id", "department"),
    )
