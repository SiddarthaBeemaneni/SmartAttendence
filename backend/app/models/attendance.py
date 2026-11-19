"""
SmartAttend AI / CampusAI - Attendance & AI Parent Calling Models
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    Index,
)
from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(50), primary_key=True, default=lambda: f"sub-{uuid.uuid4().hex[:8]}")
    university_id = Column(String(50), nullable=False, index=True)
    code = Column(String(20), nullable=False)
    name = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False)
    semester = Column(Integer, default=1)
    credits = Column(Integer, default=3)
    faculty_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(String(50), primary_key=True, default=lambda: f"sess-{uuid.uuid4().hex[:10]}")
    university_id = Column(String(50), nullable=False, index=True)
    faculty_id = Column(String(50), nullable=False)
    faculty_name = Column(String(100), nullable=False)
    subject_code = Column(String(20), nullable=False)
    subject_name = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False)
    year = Column(Integer, default=1)
    semester = Column(Integer, default=1)
    section = Column(String(10), default="A")
    session_date = Column(String(20), nullable=False) # YYYY-MM-DD
    session_slot = Column(String(50), nullable=False) # e.g. "09:00 - 10:00 AM"
    status = Column(String(20), default="draft") # draft, finalized
    total_students = Column(Integer, default=0)
    present_count = Column(Integer, default=0)
    absent_count = Column(Integer, default=0)
    late_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    finalized_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_session_univ_date", "university_id", "session_date"),
    )


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(String(50), primary_key=True, default=lambda: f"rec-{uuid.uuid4().hex[:10]}")
    session_id = Column(String(50), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(50), nullable=False, index=True)
    student_name = Column(String(100), nullable=False)
    roll_number = Column(String(50), nullable=False)
    status = Column(String(20), default="present") # present, absent, late
    parent_name = Column(String(100), nullable=True)
    parent_phone = Column(String(30), nullable=True)
    preferred_language = Column(String(10), default="en")
    preferred_form_of_address = Column(String(20), default="Mr.")
    remarks = Column(String(255), nullable=True)
    marked_at = Column(DateTime, default=datetime.utcnow)


class AICallLog(Base):
    __tablename__ = "ai_call_logs"

    id = Column(String(50), primary_key=True, default=lambda: f"call-{uuid.uuid4().hex[:10]}")
    job_id = Column(String(50), unique=True, nullable=True, index=True)
    university_id = Column(String(50), nullable=False, index=True)
    college_id = Column(String(50), nullable=True, index=True)  # alias for university_id
    session_id = Column(String(50), nullable=False, index=True)
    student_id = Column(String(50), nullable=False, index=True)
    student_name = Column(String(100), nullable=False)
    roll_number = Column(String(50), nullable=False)
    parent_id = Column(String(50), nullable=True)
    attendance_record_id = Column(String(50), nullable=True, index=True)
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)

    subject_name = Column(String(200), nullable=False)
    session_date = Column(String(20), nullable=False)
    session_slot = Column(String(50), nullable=False)
    parent_name = Column(String(100), nullable=False)
    parent_phone = Column(String(30), nullable=False)
    language = Column(String(10), default="en") # en, ta, te, hi, ml, kn
    preferred_language = Column(String(10), default="en")
    form_of_address = Column(String(20), default="Mr.") # Mr., Mrs., Dr., etc.

    # Calling State & Provider Tracking
    call_mode = Column(String(20), default="simulation") # "simulation" | "live"
    call_status = Column(String(30), default="queued") # queued, initiated, ringing, in_progress, completed, busy, no_answer, failed, wrong_number, no_consent, unverified_parent
    provider_call_id = Column(String(100), nullable=True)
    attempt_count = Column(Integer, default=1)
    max_attempts = Column(Integer, default=3)
    duration_seconds = Column(Integer, default=0)

    # Conversational AI Outcome
    parent_verified = Column(Boolean, default=False)
    reason_category = Column(String(50), nullable=True) # Medical / Sick, Emergency, Transport, Personal, Unaware, Other
    ai_classification = Column(String(50), nullable=True) # alias for reason_category
    parent_statement = Column(Text, nullable=True)
    actual_absence_reason = Column(Text, nullable=True) # alias for parent_statement
    staff_transfer_requested = Column(Boolean, default=False)
    dialogue_transcript = Column(Text, nullable=False) # JSON encoded dialogue turns
    transcript = Column(Text, nullable=True) # alias for dialogue_transcript
    audio_url = Column(String(255), nullable=True)
    failure_reason = Column(String(255), nullable=True)

    call_initiated_at = Column(DateTime, default=datetime.utcnow)
    call_start_time = Column(DateTime, nullable=True)
    call_completed_at = Column(DateTime, nullable=True)
    call_end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_call_univ_status", "university_id", "call_status"),
        Index("idx_call_job", "job_id"),
        Index("idx_call_idempotency", "idempotency_key"),
    )
