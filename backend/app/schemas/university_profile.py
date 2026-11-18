"""
SmartAttend AI / CampusAI - University Profile Schemas
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class UniversityProfileUpdate(BaseModel):
    name: str
    official_email: EmailStr
    contact_number: str
    address: str
    website: Optional[str] = None
    logo_url: Optional[str] = None  # Data URL or image link


class UniversityProfileResponse(BaseModel):
    id: str
    name: str
    official_email: str
    contact_number: str
    address: str
    website: Optional[str] = None
    logo_url: Optional[str] = None
    admin_name: str
    admin_email: str
    profile_completed: bool
    registration_status: str

    class Config:
        from_attributes = True
