"""
SmartAttend AI / CampusAI - Attendance & Call Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class StudentAttendanceMark(BaseModel):
    student_id: str
    student_name: str
    roll_number: str
    status: str = Field(..., description="'present', 'absent', or 'late'")
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    preferred_language: Optional[str] = "en"
    preferred_form_of_address: Optional[str] = "Mr."
    remarks: Optional[str] = None


class AttendanceSessionCreate(BaseModel):
    subject_code: str
    subject_name: str
    department: str
    year: int
    semester: int
    section: str = "A"
    session_date: str # YYYY-MM-DD
    session_slot: str # e.g. "09:00 - 10:00 AM"
    faculty_id: Optional[str] = "usr-fac-01"
    faculty_name: Optional[str] = "Prof. Ananya Sundaram"


class AttendanceBatchMark(BaseModel):
    session_id: str
    records: List[StudentAttendanceMark]


class AttendanceFinalizeRequest(BaseModel):
    session_id: str
    records: List[StudentAttendanceMark]


class AttendanceSessionResponse(BaseModel):
    id: str
    university_id: str
    faculty_id: str
    faculty_name: str
    subject_code: str
    subject_name: str
    department: str
    year: int
    semester: int
    section: str
    session_date: str
    session_slot: str
    status: str
    total_students: int
    present_count: int
    absent_count: int
    late_count: int
    created_at: datetime
    finalized_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AICallLogResponse(BaseModel):
    id: str
    university_id: str
    session_id: str
    student_id: str
    student_name: str
    roll_number: str
    subject_name: str
    session_date: str
    session_slot: str
    parent_name: str
    parent_phone: str
    language: str
    form_of_address: str
    call_status: str
    duration_seconds: int
    reason_category: Optional[str] = None
    parent_statement: Optional[str] = None
    staff_transfer_requested: bool
    dialogue_transcript: str
    call_initiated_at: datetime
    call_completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
