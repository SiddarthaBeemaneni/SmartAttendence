"""
SmartAttend AI / CampusAI - University Registration Schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class SendOTPRequest(BaseModel):
    email: EmailStr


class SendOTPResponse(BaseModel):
    status: str
    message: str
    email: str
    # Included in debug/dev for seamless testing
    debug_otp: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=8)


class VerifyOTPResponse(BaseModel):
    status: str
    verified: bool
    message: str


class UniversityRegisterRequest(BaseModel):
    university_name: str = Field(..., min_length=3, max_length=150)
    official_email: EmailStr
    contact_number: str = Field(..., min_length=8, max_length=20)
    address: str = Field(..., min_length=5, max_length=300)
    admin_name: str = Field(..., min_length=2, max_length=100)
    admin_email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    confirm_password: str = Field(..., min_length=6, max_length=100)
    otp: Optional[str] = None


class UniversityRegisterResponse(BaseModel):
    status: str
    message: str
    university_id: str
    university_name: str
    admin_email: str
    registration_status: str  # 'pending_approval' | 'approved'
    submitted_at: str
    requires_approval: bool = True
