"""
SmartAttend AI / CampusAI - Subject / Course Management Router (Tenant Isolated)
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.attendance import Subject
from app.routers.auth import oauth2_scheme
from app.utils.security import verify_token

router = APIRouter(prefix="/api/subjects", tags=["Subject Management"])


def get_current_tenant_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


class SubjectCreate(BaseModel):
    code: str
    name: str
    department: str
    semester: int = 1
    credits: int = 3
    faculty_name: Optional[str] = None


class SubjectResponse(BaseModel):
    id: str
    university_id: str
    code: str
    name: str
    department: str
    semester: int
    credits: int
    faculty_name: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    department: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """List all accredited subjects belonging to the authenticated college tenant."""
    univ_id = user.get("university_id", "UNI-2026-0001")
    query = db.query(Subject).filter(Subject.university_id == univ_id)
    if department and department != "All":
        query = query.filter(Subject.department == department)
    if semester:
        query = query.filter(Subject.semester == semester)
    subjects = query.order_by(Subject.code.asc()).all()

    # If college has no subjects seeded yet, seed defaults so faculty can mark attendance right away
    if len(subjects) == 0:
        default_subs = [
            Subject(
                id=f"sub-{uuid.uuid4().hex[:8]}",
                university_id=univ_id,
                code="CS8501",
                name="Theory of Computation",
                department="Computer Science & Engineering",
                semester=5,
                credits=4,
                faculty_name="Prof. Ananya Sundaram",
            ),
            Subject(
                id=f"sub-{uuid.uuid4().hex[:8]}",
                university_id=univ_id,
                code="CS8591",
                name="Computer Networks",
                department="Computer Science & Engineering",
                semester=5,
                credits=3,
                faculty_name="Prof. Ananya Sundaram",
            ),
            Subject(
                id=f"sub-{uuid.uuid4().hex[:8]}",
                university_id=univ_id,
                code="CS8592",
                name="Object Oriented Analysis and Design",
                department="Computer Science & Engineering",
                semester=5,
                credits=3,
                faculty_name="Prof. Ananya Sundaram",
            ),
        ]
        for s in default_subs:
            db.add(s)
        db.commit()
        subjects = default_subs

    return subjects


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    data: SubjectCreate,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """Add a new subject course code to the college curriculum."""
    univ_id = user.get("university_id", "UNI-2026-0001")
    existing = (
        db.query(Subject)
        .filter(Subject.university_id == univ_id, Subject.code == data.code.strip().upper())
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Subject code '{data.code}' already exists in your college catalog.",
        )

    new_sub = Subject(
        id=f"sub-{uuid.uuid4().hex[:8]}",
        university_id=univ_id,
        code=data.code.strip().upper(),
        name=data.name.strip(),
        department=data.department.strip(),
        semester=data.semester,
        credits=data.credits,
        faculty_name=data.faculty_name.strip() if data.faculty_name else None,
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub
