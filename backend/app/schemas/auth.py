"""
SmartAttend AI / CampusAI - Authentication & Registration Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=6, max_length=100)
    college_id: Optional[str] = Field(None, description="Verified college ID")
    institution_id: Optional[str] = Field(None, description="Verified All-India institution ID")
    verification_token: Optional[str] = None
    role: Optional[str] = "admin"


class RegisterResponse(BaseModel):
    status: str
    message: str
    user_id: str
    full_name: str
    email: str
    college_id: str
    account_status: str
