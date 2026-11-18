"""
SmartAttend AI / CampusAI - College Verification & Search Router

Implements:
- POST /api/college/verify: Verifies whether the college exists and is officially accredited.
  If not found: rejects with "College not found. Please enter a valid registered college."
- GET /api/college/search: Live autocomplete search across verified college directory.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List

from app.database import get_db
from app.models.college import College
from app.schemas.college import (
    CollegeVerifyRequest,
    CollegeVerifyResponse,
    CollegeResponse,
    CollegeSearchResponse,
)

router = APIRouter(prefix="/api/college", tags=["College Verification"])


@router.post("/verify", response_model=CollegeVerifyResponse)
def verify_college(req: CollegeVerifyRequest, db: Session = Depends(get_db)):
    """
    Verify whether the entered college actually exists in official accredited records.
    Prevents unauthorized or fake college registrations.
    """
    college_id = req.college_id.strip() if req.college_id else None
    college_code = req.college_code.strip() if req.college_code else None
    college_name = req.college_name.strip() if req.college_name else None

    if not college_id and not college_code and not college_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="College name, code, or identifier is required for verification.",
        )

    query = db.query(College)

    # 1. Exact match by college_id
    if college_id:
        college = query.filter(College.college_id == college_id).first()
        if college:
            if college.verification_status != "verified":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This institution's accreditation is currently pending or suspended.",
                )
            return CollegeVerifyResponse(
                status="verified",
                message=f"Verified: {college.college_name} is an active, accredited institution.",
                college=CollegeResponse.model_validate(college),
            )

    # 2. Exact match by college_code
    if college_code:
        college = query.filter(func.lower(College.college_code) == college_code.lower()).first()
        if college:
            if college.verification_status != "verified":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This institution's accreditation is currently pending or suspended.",
                )
            return CollegeVerifyResponse(
                status="verified",
                message=f"Verified: {college.college_name} is an active, accredited institution.",
                college=CollegeResponse.model_validate(college),
            )

    # 3. Match by college_name (case-insensitive exact or strong prefix match)
    if college_name:
        # Check exact or trimmed case-insensitive
        college = query.filter(func.lower(College.college_name) == college_name.lower()).first()
        if not college:
            # Also check if user entered common variations or code
            college = query.filter(
                or_(
                    func.lower(College.college_name).ilike(f"%{college_name.lower()}%"),
                    func.lower(College.college_code).ilike(f"%{college_name.lower()}%"),
                )
            ).first()

        if college:
            if college.verification_status != "verified":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This institution's accreditation is currently pending or suspended.",
                )
            return CollegeVerifyResponse(
                status="verified",
                message=f"Verified: {college.college_name} is an active, accredited institution.",
                college=CollegeResponse.model_validate(college),
            )

    # Strict rejection per requirement 1:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="College not found. Please enter a valid registered college.",
    )


@router.get("/search", response_model=CollegeSearchResponse)
def search_colleges(
    q: str = Query("", min_length=0, description="Search term for college name or code"),
    state: Optional[str] = Query(None, description="Filter by state"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Search suggestions across recognized colleges to prevent spelling mistakes.
    """
    query = db.query(College).filter(College.verification_status == "verified")

    search_term = q.strip().lower()
    if search_term:
        query = query.filter(
            or_(
                func.lower(College.college_name).ilike(f"%{search_term}%"),
                func.lower(College.college_code).ilike(f"%{search_term}%"),
                func.lower(College.location).ilike(f"%{search_term}%"),
            )
        )

    if state:
        query = query.filter(func.lower(College.state) == state.strip().lower())

    colleges = query.order_by(College.college_name.asc()).limit(limit).all()

    return CollegeSearchResponse(
        total=len(colleges),
        colleges=[CollegeResponse.model_validate(c) for c in colleges],
    )
