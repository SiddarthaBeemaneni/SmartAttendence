"""
SmartAttend AI / CampusAI - Email Validation & OTP Router

Implements:
- POST /api/email/validate: Strict format and DNS MX record verification.
- POST /api/email/send-otp: 6-digit cryptographic OTP generation, rate limiting, and Zoho ZeptoMail dispatch.
- POST /api/email/verify-otp: Backend OTP verification with 5-minute expiry and attempt limit.
"""

import hashlib
import hmac
import secrets
import time
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.config import settings
from app.models.otp import EmailOTP
from app.models.user import User
from app.models.college import College
from app.services.email_verifier import verify_email_full, validate_email_syntax
from app.services.zeptomail import send_zeptomail_otp
from app.schemas.email_verification import (
    EmailValidateRequest,
    EmailValidateResponse,
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
)

router = APIRouter(prefix="/api/email", tags=["Email Verification"])


def hash_otp(email: str, otp_code: str) -> str:
    """Computes a SHA-256 HMAC for the OTP code bound to the email address and secret key."""
    key = settings.SECRET_KEY.encode("utf-8")
    message = f"{email.lower().strip()}:{otp_code}".encode("utf-8")
    return hmac.new(key, message, hashlib.sha256).hexdigest()


def generate_verification_token(email: str) -> str:
    """Generates an HMAC verification token proving the email was verified."""
    key = settings.SECRET_KEY.encode("utf-8")
    timestamp = int(time.time())
    signature = hmac.new(key, f"verified:{email.lower().strip()}:{timestamp}".encode("utf-8"), hashlib.sha256).hexdigest()
    return f"v1.{timestamp}.{signature[:32]}"


@router.post("/validate", response_model=EmailValidateResponse)
def validate_email_endpoint(req: EmailValidateRequest, db: Session = Depends(get_db)):
    """
    Validate email address format and real-time DNS MX records.
    Also confirms whether the email is already registered.
    """
    email = req.email.strip().lower()

    # 1. Full syntax and MX record check
    is_valid, msg, domain = verify_email_full(email)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    # 2. Duplicate registration check
    existing_user = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_user and existing_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this institutional email address already exists. Please log in instead.",
        )

    return EmailValidateResponse(
        valid=True,
        email=email,
        domain=domain,
        has_mx=True,
        message=f"Email address and DNS MX records verified for '{domain}'.",
    )


@router.post("/send-otp", response_model=SendOTPResponse)
async def send_otp_endpoint(req: SendOTPRequest, db: Session = Depends(get_db)):
    """
    Generates a secure 6-digit OTP, applies rate limiting, and dispatches via Zoho ZeptoMail.
    """
    email = req.email.strip().lower()

    # 1. Validate syntax and MX records
    is_valid, msg, domain = verify_email_full(email)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    # 2. Check duplicate verified user
    existing_user = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_user and existing_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email address is already registered. Please log in directly.",
        )

    # 3. Rate limiting checks:
    now_utc = datetime.now(timezone.utc)
    cooldown_cutoff = now_utc - timedelta(seconds=45)
    recent_otp = (
        db.query(EmailOTP)
        .filter(EmailOTP.email == email, EmailOTP.created_at >= cooldown_cutoff)
        .order_by(EmailOTP.created_at.desc())
        .first()
    )
    if recent_otp:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait 45 seconds before requesting another verification OTP.",
        )

    # Rate limiting: max 5 requests per 15 minutes window
    window_cutoff = now_utc - timedelta(minutes=15)
    total_in_window = (
        db.query(EmailOTP)
        .filter(EmailOTP.email == email, EmailOTP.created_at >= window_cutoff)
        .count()
    )
    if total_in_window >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests for this email address. Please wait 15 minutes before trying again.",
        )

    # 4. Find college name if college_id provided
    college_name = "Registered College"
    if req.college_id:
        college = db.query(College).filter(College.college_id == req.college_id).first()
        if college:
            college_name = college.college_name

    # 5. Generate cryptographically secure 6-digit numeric OTP
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    hashed_value = hash_otp(email, otp_code)
    otp_id = f"otp-{secrets.token_hex(8)}"
    expires_at = now_utc + timedelta(minutes=5)

    # 6. Save to database
    db_otp = EmailOTP(
        otp_id=otp_id,
        email=email,
        otp_hash=hashed_value,
        expires_at=expires_at,
        verified=False,
        attempts=0,
        created_at=now_utc,
    )
    db.add(db_otp)
    db.commit()

    # 7. Dispatch via Zoho ZeptoMail
    recipient_name = req.name or "Administrator"
    await send_zeptomail_otp(
        recipient_email=email,
        otp_code=otp_code,
        recipient_name=recipient_name,
        college_name=college_name,
    )

    debug_otp = otp_code if settings.DEBUG else None

    return SendOTPResponse(
        status="sent",
        message=f"A 6-digit verification code has been dispatched to {email}. Valid for 5 minutes.",
        email=email,
        expires_in_seconds=300,
        debug_otp=debug_otp,
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp_endpoint(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verifies the submitted 6-digit OTP against cryptographic hash.
    Enforces 5-minute expiration and max attempt limits.
    """
    email = req.email.strip().lower()
    submitted_otp = req.otp.strip()

    if len(submitted_otp) != 6 or not submitted_otp.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP must be a 6-digit numeric code.",
        )

    # Find the latest unverified OTP for this email
    latest_otp = (
        db.query(EmailOTP)
        .filter(EmailOTP.email == email, EmailOTP.verified == False)
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if not latest_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP request found for this email address. Please request a new OTP.",
        )

    # Check attempt limit
    if latest_otp.attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new OTP.",
        )

    # Check expiration (5 minutes)
    now_utc = datetime.now(timezone.utc)
    # Ensure timezone comparison compatibility
    exp_time = latest_otp.expires_at
    if exp_time.tzinfo is None:
        exp_time = exp_time.replace(tzinfo=timezone.utc)

    if now_utc > exp_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification OTP has expired. Please request a new code.",
        )

    # Increment attempts
    latest_otp.attempts += 1
    db.commit()

    # Compare cryptographic hash
    expected_hash = hash_otp(email, submitted_otp)
    if not hmac.compare_digest(latest_otp.otp_hash, expected_hash):
        remaining = 5 - latest_otp.attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect verification code. Please check your email and try again ({remaining} attempts remaining).",
        )

    # Mark as verified
    latest_otp.verified = True
    db.commit()

    # Generate verification token
    verification_token = generate_verification_token(email)

    return VerifyOTPResponse(
        status="verified",
        message="Institutional email address successfully verified.",
        email=email,
        verification_token=verification_token,
    )
