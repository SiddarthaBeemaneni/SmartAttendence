"""
SmartAttend AI / CampusAI - Email Validation & OTP Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional


class EmailValidateRequest(BaseModel):
    email: str


class EmailValidateResponse(BaseModel):
    valid: bool
    email: str
    domain: Optional[str] = None
    has_mx: bool
    message: str


class SendOTPRequest(BaseModel):
    email: str
    college_id: Optional[str] = None
    name: Optional[str] = None


class SendOTPResponse(BaseModel):
    status: str
    message: str
    email: str
    expires_in_seconds: int = 300
    debug_otp: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit numeric OTP")


class VerifyOTPResponse(BaseModel):
    status: str
    message: str
    email: str
    verification_token: str
