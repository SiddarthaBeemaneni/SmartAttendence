"""
SmartAttend AI / CampusAI - Institution Schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class InstitutionResponse(BaseModel):
    id: str
    official_name: str
    institution_type: str
    state: str
    district: str
    city: Optional[str] = None
    address: Optional[str] = None
    aishe_code: Optional[str] = None
    ugc_reference: Optional[str] = None
    recognition_status: str
    autonomous_status: bool = False
    autonomous_validity: Optional[str] = None
    affiliating_university_id: Optional[str] = None
    affiliating_university_name: Optional[str] = None
    official_website: Optional[str] = None
    source: str
    last_verified_at: Optional[str] = None

    class Config:
        from_attributes = True


class InstitutionSearchResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    items: List[InstitutionResponse]


class InstitutionTypeInfo(BaseModel):
    code: str
    name: str
    category: str  # "University", "College", "Other"
    description: str
    count: int = 0


class StateInfo(BaseModel):
    state: str
    institution_count: int = 0


class InstitutionAdditionCreate(BaseModel):
    official_name: str = Field(..., min_length=3, max_length=255)
    institution_type: str
    state: str
    district: str
    city: Optional[str] = None
    address: Optional[str] = None
    official_website: Optional[str] = None
    aishe_code: Optional[str] = None
    ugc_reference: Optional[str] = None
    affiliating_university: Optional[str] = None
    official_email: EmailStr
    applicant_name: str = Field(..., min_length=2, max_length=150)


class InstitutionAdditionResponse(BaseModel):
    id: str
    official_name: str
    institution_type: str
    state: str
    district: str
    status: str
    message: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class InstitutionApprovalRequest(BaseModel):
    request_id: str
    aishe_code: Optional[str] = None
    ugc_reference: Optional[str] = None
    admin_notes: Optional[str] = None


class InstitutionRejectionRequest(BaseModel):
    request_id: str
    reason: str


class DirectoryImportRequest(BaseModel):
    source_name: str
    institutions: List[dict]
