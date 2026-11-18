"""
SmartAttend AI / CampusAI - Student Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class StudentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    roll_number: str = Field(..., min_length=2, max_length=50)
    department: str = Field(..., min_length=2, max_length=100)
    year: int = Field(..., ge=1, le=6)
    semester: int = Field(..., ge=1, le=12)
    section: str = Field(..., min_length=1, max_length=20)
    parent_name: str = Field(..., min_length=2, max_length=150)
    parent_phone: str = Field(..., min_length=8, max_length=50)
    preferred_language: str = Field(default="en")  # 'ta','en','te','hi','ml','kn'
    preferred_form_of_address: str = Field(default="Mr.")
    consent_given: bool = True
    phone_verified: bool = True


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    roll_number: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    preferred_language: Optional[str] = None
    preferred_form_of_address: Optional[str] = None
    consent_given: Optional[bool] = None
    status: Optional[str] = None


class StudentResponse(BaseModel):
    id: str
    university_id: str
    name: str
    roll_number: str
    department: str
    year: int
    semester: int
    section: str
    parent_name: str
    parent_phone: str
    preferred_language: str
    preferred_form_of_address: str
    attendance_percentage: float
    consent_given: bool
    phone_verified: bool
    status: str

    class Config:
        from_attributes = True


class BulkPreviewRow(BaseModel):
    row_number: int
    name: str
    roll_number: str
    department: str
    year: int
    semester: int
    section: str
    parent_name: str
    parent_phone: str
    preferred_language: str
    preferred_form_of_address: str
    is_valid: bool
    is_duplicate: bool
    errors: List[str] = []


class BulkPreviewResponse(BaseModel):
    total_records: int
    valid_count: int
    invalid_count: int
    duplicate_count: int
    records: List[BulkPreviewRow]


class BulkImportRequest(BaseModel):
    records: List[StudentCreate]


class BulkImportResponse(BaseModel):
    status: str
    imported_count: int
    skipped_count: int
    message: str
