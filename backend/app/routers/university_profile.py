"""
SmartAttend AI / CampusAI - University Profile Setup Router

Provides endpoints for:
- GET /api/university/profile (Inspect profile, check if setup is complete)
- PUT /api/university/profile (Update name, email, phone, address, website, logo)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.university import University
from app.routers.auth import oauth2_scheme
from app.utils.security import verify_token
from app.schemas.university_profile import (
    UniversityProfileUpdate,
    UniversityProfileResponse,
)

router = APIRouter(prefix="/api/university", tags=["University Profile"])


def get_current_tenant_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Validate token and extract tenant university_id."""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


@router.get("/profile", response_model=UniversityProfileResponse)
def get_university_profile(
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    Get the university profile for the authenticated administrator's institution.
    """
    university_id = user.get("university_id", "UNI-2026-0001")
    univ = db.query(University).filter(University.id == university_id).first()

    if not univ:
        # Initialize default university record if not yet created in database
        univ = University(
            id=university_id,
            name="ABC Institute of Technology & Management",
            official_email="registrar@abctech.edu",
            contact_number="+91 (044) 2855-4000",
            address="Campus Road, Tech Corridor, Chennai, Tamil Nadu 600025",
            website="https://abctech.edu",
            logo_url=None,
            admin_name=user.get("name", "Chief Administrator"),
            admin_email=user.get("sub", "admin@smartattend.edu"),
            profile_completed=False,
            registration_status="approved",
        )
        db.add(univ)
        db.commit()
        db.refresh(univ)

    return univ


@router.put("/profile", response_model=UniversityProfileResponse)
def update_university_profile(
    profile_data: UniversityProfileUpdate,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    Update institutional profile details and mark profile_completed = True.
    """
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only University Administrators can modify institutional profiles.",
        )

    university_id = user.get("university_id", "UNI-2026-0001")
    univ = db.query(University).filter(University.id == university_id).first()

    if not univ:
        univ = University(
            id=university_id,
            name=profile_data.name.strip(),
            official_email=profile_data.official_email.strip().lower(),
            contact_number=profile_data.contact_number.strip(),
            address=profile_data.address.strip(),
            website=profile_data.website.strip() if profile_data.website else None,
            logo_url=profile_data.logo_url,
            admin_name=user.get("name", "Chief Administrator"),
            admin_email=user.get("sub", "admin@smartattend.edu"),
            profile_completed=True,
            registration_status="approved",
        )
        db.add(univ)
    else:
        univ.name = profile_data.name.strip()
        univ.official_email = profile_data.official_email.strip().lower()
        univ.contact_number = profile_data.contact_number.strip()
        univ.address = profile_data.address.strip()
        univ.website = profile_data.website.strip() if profile_data.website else None
        if profile_data.logo_url is not None:
            univ.logo_url = profile_data.logo_url
        univ.profile_completed = True

    db.commit()
    db.refresh(univ)
    return univ
