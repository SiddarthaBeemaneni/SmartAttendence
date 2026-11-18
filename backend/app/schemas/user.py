"""
SmartAttend AI - User Schemas for Authentication & Profile
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    status: str
    email: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str  # 'admin', 'faculty', 'student', 'parent'
    university_id: Optional[str] = "UNI-2026-0001"
    department: Optional[str] = None
    designation: Optional[str] = None
    roll_number: Optional[str] = None
    employee_id: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: str = "en"
    title: str = "Mr."
    is_active: bool = True

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
