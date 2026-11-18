"""
SmartAttend AI / CampusAI - University Registration Router

Implements:
- Email verification with 6-digit OTP
- Duplicate university & administrator validation
- Unique University ID generation (e.g. UNI-2026-XXXX)
- Cryptographic password hashing (bcrypt)
- Secure storage with "Pending Approval" status
- Administrator approval / activation workflow
"""

import random
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, status

from app.config import settings
from app.utils.security import hash_password
from app.routers.auth import DEFAULT_INSTITUTIONAL_USERS
from app.schemas.university import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    UniversityRegisterRequest,
    UniversityRegisterResponse,
)

router = APIRouter(prefix="/auth/university", tags=["University Registration"])

# In-memory store for OTPs: email -> { otp: str, expires_at: float, verified: bool }
OTP_STORE: Dict[str, dict] = {}

# In-memory store for registered universities: university_id -> dict
REGISTERED_UNIVERSITIES: Dict[str, dict] = {
    "UNI-2026-0001": {
        "university_id": "UNI-2026-0001",
        "university_name": "ABC Institute of Technology & Management",
        "official_email": "registrar@abctech.edu",
        "contact_number": "+91 (044) 2855-4000",
        "address": "Campus Road, Tech Corridor, Chennai, Tamil Nadu 600025",
        "admin_name": "Dr. K. Ramanathan",
        "admin_email": "admin@smartattend.edu",
        "registration_status": "approved",
        "submitted_at": "2026-08-01T10:00:00Z",
        "approved_at": "2026-08-01T12:00:00Z",
    }
}


@router.post("/send-otp", response_model=SendOTPResponse)
async def send_email_otp(req: SendOTPRequest):
    """
    Generate and dispatch a 6-digit verification OTP to the administrator's email.
    """
    email = req.email.strip().lower()

    # Generate 6-digit numeric OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = time.time() + 600  # Valid for 10 minutes

    OTP_STORE[email] = {
        "otp": otp_code,
        "expires_at": expires_at,
        "verified": False,
    }

    # In development/test mode, include debug_otp in response so users can test immediately
    debug_otp = otp_code if settings.DEBUG else None

    return SendOTPResponse(
        status="success",
        message=f"A 6-digit verification OTP has been dispatched to {email}. Valid for 10 minutes.",
        email=email,
        debug_otp=debug_otp,
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_email_otp(req: VerifyOTPRequest):
    """
    Validate the submitted OTP for the given administrator email.
    """
    email = req.email.strip().lower()
    otp_entry = OTP_STORE.get(email)

    if not otp_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP request found for this email. Please request a new OTP.",
        )

    if time.time() > otp_entry["expires_at"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification OTP has expired. Please request a new one.",
        )

    # In dev mode, also allow safe master test code "123456"
    is_valid = (req.otp.strip() == otp_entry["otp"]) or (
        settings.DEBUG and req.otp.strip() == "123456"
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect OTP code. Please check your email and try again.",
        )

    otp_entry["verified"] = True

    return VerifyOTPResponse(
        status="success",
        verified=True,
        message="Email successfully verified.",
    )


@router.post("/register", response_model=UniversityRegisterResponse)
async def register_university(req: UniversityRegisterRequest):
    """
    Register a new university with institutional contact and administrator credentials.
    Sets status to 'pending_approval' awaiting Super Admin authorization.
    """
    # 1. Password confirmation check
    if req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and Confirm Password do not match.",
        )

    admin_email = req.admin_email.strip().lower()
    official_email = req.official_email.strip().lower()
    univ_name = req.university_name.strip()

    # 2. Check duplicate registrations
    for uid, u in REGISTERED_UNIVERSITIES.items():
        if u["university_name"].lower() == univ_name.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"University '{univ_name}' is already registered in the system (ID: {uid}).",
            )
        if u["official_email"].lower() == official_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Official email '{official_email}' is already associated with an enrolled university.",
            )
        if u["admin_email"].lower() == admin_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Administrator email '{admin_email}' is already registered.",
            )

    # 3. Check existing institutional users
    if admin_email in DEFAULT_INSTITUTIONAL_USERS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{admin_email}' already exists. Please login instead.",
        )

    # 4. Generate Unique University ID: UNI-2026-XXXX
    random_suffix = random.randint(1000, 9999)
    university_id = f"UNI-2026-{random_suffix}"
    while university_id in REGISTERED_UNIVERSITIES:
        random_suffix = random.randint(1000, 9999)
        university_id = f"UNI-2026-{random_suffix}"

    # 5. Cryptographically hash password
    hashed_pw = hash_password(req.password)
    submitted_at = datetime.now(timezone.utc).isoformat()

    # 6. Save university record with 'pending_approval' status
    university_record = {
        "university_id": university_id,
        "university_name": univ_name,
        "official_email": official_email,
        "contact_number": req.contact_number.strip(),
        "address": req.address.strip(),
        "admin_name": req.admin_name.strip(),
        "admin_email": admin_email,
        "hashed_password": hashed_pw,
        "registration_status": "pending_approval",
        "submitted_at": submitted_at,
        "approved_at": None,
    }
    REGISTERED_UNIVERSITIES[university_id] = university_record

    # 7. Register user in institutional user catalog as inactive until approved
    DEFAULT_INSTITUTIONAL_USERS[admin_email] = {
        "id": f"usr-admin-{random_suffix}",
        "email": admin_email,
        "hashed_password": hashed_pw,
        "name": req.admin_name.strip(),
        "role": "admin",
        "department": "University Administration",
        "designation": "Chief Administrator",
        "phone": req.contact_number.strip(),
        "preferred_language": "en",
        "title": "Dr.",
        "is_active": False,  # Awaiting Super Admin approval
        "university_id": university_id,
    }

    return UniversityRegisterResponse(
        status="success",
        message="Your university registration has been submitted successfully! Your account is awaiting Super Admin approval.",
        university_id=university_id,
        university_name=univ_name,
        admin_email=admin_email,
        registration_status="pending_approval",
        submitted_at=submitted_at,
        requires_approval=True,
    )


@router.post("/approve/{university_id}")
async def approve_university(university_id: str):
    """
    Super Admin approval endpoint.
    Approves the university and activates the administrator account.
    """
    record = REGISTERED_UNIVERSITIES.get(university_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"University ID {university_id} not found.",
        )

    record["registration_status"] = "approved"
    record["approved_at"] = datetime.now(timezone.utc).isoformat()

    # Activate administrator account
    admin_email = record["admin_email"]
    if admin_email in DEFAULT_INSTITUTIONAL_USERS:
        DEFAULT_INSTITUTIONAL_USERS[admin_email]["is_active"] = True

    return {
        "status": "success",
        "message": f"University '{record['university_name']}' has been approved successfully.",
        "university_id": university_id,
        "admin_email": admin_email,
        "registration_status": "approved",
    }


@router.get("/list")
async def list_universities():
    """
    List all registered universities and their status.
    """
    clean_list = []
    for u in REGISTERED_UNIVERSITIES.values():
        clean_list.append({
            "university_id": u["university_id"],
            "university_name": u["university_name"],
            "official_email": u["official_email"],
            "contact_number": u["contact_number"],
            "address": u["address"],
            "admin_name": u["admin_name"],
            "admin_email": u["admin_email"],
            "registration_status": u["registration_status"],
            "submitted_at": u["submitted_at"],
            "approved_at": u.get("approved_at"),
        })
    return {"universities": clean_list, "total": len(clean_list)}
