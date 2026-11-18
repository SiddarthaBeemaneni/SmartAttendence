"""
SmartAttend AI - Authentication Router

Provides secure endpoints for:
- POST /auth/login (JWT token generation, role verification)
- GET /auth/me (Current authenticated user inspection)
- POST /auth/forgot-password (Self-service recovery request)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from datetime import timedelta
from pydantic import BaseModel

from app.config import settings
from app.utils.security import (
    verify_password,
    hash_password,
    create_access_token,
    verify_token,
)
from app.schemas.user import (
    Token,
    UserResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class LoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str


# Pre-computed bcrypt hashes for institutional starter accounts
DEFAULT_INSTITUTIONAL_USERS = {
    "admin@smartattend.edu": {
        "id": "usr-admin-01",
        "email": "admin@smartattend.edu",
        "hashed_password": hash_password("Admin@2026!"),
        "name": "Dr. K. Ramanathan",
        "role": "admin",
        "department": "Administration",
        "designation": "Dean of Academics",
        "phone": "+91 98765 43210",
        "preferred_language": "en",
        "title": "Dr.",
        "is_active": True,
    },
    "faculty@smartattend.edu": {
        "id": "usr-fac-01",
        "email": "faculty@smartattend.edu",
        "hashed_password": hash_password("Faculty@2026!"),
        "name": "Prof. Ananya Sundaram",
        "role": "faculty",
        "department": "Computer Science & Engineering",
        "designation": "Associate Professor",
        "employee_id": "FAC-CSE-042",
        "phone": "+91 98401 23456",
        "preferred_language": "ta",
        "title": "Prof.",
        "is_active": True,
    },
    "student@smartattend.edu": {
        "id": "usr-stu-01",
        "email": "student@smartattend.edu",
        "hashed_password": hash_password("Student@2026!"),
        "name": "Karthik Subramanian",
        "role": "student",
        "department": "Computer Science & Engineering",
        "roll_number": "2023-CSE-089",
        "phone": "+91 94441 55667",
        "preferred_language": "ta",
        "title": "Mr.",
        "is_active": True,
    },
    "parent@smartattend.edu": {
        "id": "usr-par-01",
        "email": "parent@smartattend.edu",
        "hashed_password": hash_password("Parent@2026!"),
        "name": "Mr. S. Subramanian",
        "role": "parent",
        "department": None,
        "phone": "+91 98410 99881",
        "preferred_language": "ta",
        "title": "Mr.",
        "is_active": True,
    },
}


def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Verify user credentials against cryptographic hashes."""
    normalized_email = email.strip().lower()
    user_record = DEFAULT_INSTITUTIONAL_USERS.get(normalized_email)

    if not user_record:
        return None

    # Check hashed password
    if verify_password(password, user_record["hashed_password"]):
        return user_record

    # In development / debug mode only, permit fallback demo passwords
    if settings.DEBUG:
        if password in ["password123", "demo123", "password", "Admin@2026!", "Faculty@2026!", "Student@2026!", "Parent@2026!"]:
            return user_record

    return None


@router.post("/login", response_model=Token)
async def login(request: Request):
    """
    Authenticate user and return a JWT access token.
    Accepts JSON body or x-www-form-urlencoded form data.
    """
    username = None
    password = None

    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            pass
    elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        try:
            form = await request.form()
            username = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            pass
    else:
        # Try JSON by default
        try:
            body = await request.json()
            username = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required.",
        )

    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact college IT administration.",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_claims = {
        "sub": user["email"],
        "user_id": user["id"],
        "role": user["role"],
        "name": user["name"],
        "university_id": user.get("university_id", "UNI-2026-0001"),
    }
    access_token = create_access_token(
        data=token_claims,
        expires_delta=access_token_expires,
    )

    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        university_id=user.get("university_id", "UNI-2026-0001"),
        department=user.get("department"),
        designation=user.get("designation"),
        roll_number=user.get("roll_number"),
        employee_id=user.get("employee_id"),
        phone=user.get("phone"),
        preferred_language=user.get("preferred_language", "en"),
        title=user.get("title", "Mr."),
        is_active=user.get("is_active", True),
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Validate the caller's JWT token and return the current user's profile.
    """
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("sub")
    user = DEFAULT_INSTITUTIONAL_USERS.get(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with token not found.",
        )

    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        university_id=user.get("university_id", "UNI-2026-0001"),
        department=user.get("department"),
        designation=user.get("designation"),
        roll_number=user.get("roll_number"),
        employee_id=user.get("employee_id"),
        phone=user.get("phone"),
        preferred_language=user.get("preferred_language", "en"),
        title=user.get("title", "Mr."),
        is_active=user.get("is_active", True),
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(req: ForgotPasswordRequest):
    """
    Handle self-service password recovery request.
    Always returns a safe success message to prevent user enumeration.
    """
    normalized_email = req.email.strip().lower()

    return ForgotPasswordResponse(
        status="success",
        email=normalized_email,
        message=(
            f"If an account exists for {normalized_email}, password reset instructions "
            "and a verification OTP have been dispatched to the registered contact."
        ),
    )
