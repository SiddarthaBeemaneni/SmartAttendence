"""
SmartAttend AI / CampusAI - Institutions Router (All India Higher Education Directory)

Endpoints:
- GET /api/institutions/search
- GET /api/institutions/types
- GET /api/institutions/states
- GET /api/institutions/affiliating-universities
- GET /api/institutions/{institution_id}
- POST /api/institutions/request-addition
- GET /api/admin/institutions/pending
- POST /api/admin/institutions/approve
- POST /api/admin/institutions/reject
- POST /api/admin/institutions/import
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
import math

from app.database import get_db
from app.models.institution import Institution, InstitutionAdditionRequest, DirectoryImportLog
from app.schemas.institution import (
    InstitutionResponse,
    InstitutionSearchResponse,
    InstitutionTypeInfo,
    StateInfo,
    InstitutionAdditionCreate,
    InstitutionAdditionResponse,
    InstitutionApprovalRequest,
    InstitutionRejectionRequest,
    DirectoryImportRequest,
)
from app.services.institution_service import (
    search_institutions,
    get_institution_by_id,
    get_affiliating_universities,
    get_institution_types_with_counts,
    get_states_with_counts,
    request_institution_addition,
    approve_institution_request,
    reject_institution_request,
    import_institutions_dataset,
)
from app.routers.auth import oauth2_scheme
from app.utils.security import verify_token

router = APIRouter(prefix="/api/institutions", tags=["Institutions Directory"])
admin_router = APIRouter(prefix="/api/admin/institutions", tags=["Admin Institutions Management"])


def get_current_admin_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Verifies that the requester has administrative privileges."""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    role = payload.get("role", "")
    if role not in ["admin", "superadmin", "university_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this resource.",
        )
    return payload


# ========================================================
# 1. PUBLIC DIRECTORY SEARCH & LOOKUP
# ========================================================

@router.get("/search", response_model=InstitutionSearchResponse)
def search_directory(
    q: Optional[str] = Query(None, description="Search by institution name, AISHE code, or city"),
    institution_type: Optional[str] = Query(None, description="Filter by official category"),
    state: Optional[str] = Query(None, description="Filter by State or Union Territory"),
    district: Optional[str] = Query(None, description="Filter by District"),
    is_autonomous: Optional[bool] = Query(None, description="Filter autonomous colleges"),
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Search across recognized universities, autonomous colleges, and affiliated institutions.
    Covers all 36 Indian States and UTs with server-side pagination.
    """
    total, items = search_institutions(
        db=db,
        query=q,
        institution_type=institution_type,
        state=state,
        district=district,
        is_autonomous=is_autonomous,
        page=page,
        limit=limit,
    )
    total_pages = math.ceil(total / limit) if total > 0 else 1

    return InstitutionSearchResponse(
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        items=[InstitutionResponse.model_validate(item.to_dict()) for item in items],
    )


@router.get("/types", response_model=List[InstitutionTypeInfo])
def get_types(db: Session = Depends(get_db)):
    """List the 8 official institution categories with current directory counts."""
    types_data = get_institution_types_with_counts(db)
    return [InstitutionTypeInfo(**t) for t in types_data]


@router.get("/states", response_model=List[StateInfo])
def get_states(db: Session = Depends(get_db)):
    """List all 36 Indian States and Union Territories with current institution counts."""
    states_data = get_states_with_counts(db)
    return [StateInfo(**s) for s in states_data]


@router.get("/affiliating-universities", response_model=List[InstitutionResponse])
def get_affiliating_univs(
    state: Optional[str] = Query(None, description="Filter by State"),
    q: Optional[str] = Query(None, description="Search by university name"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List universities that can act as affiliating bodies for autonomous and affiliated colleges."""
    univs = get_affiliating_universities(db=db, state=state, query=q, limit=limit)
    return [InstitutionResponse.model_validate(u.to_dict()) for u in univs]


@router.get("/{institution_id}", response_model=InstitutionResponse)
def get_institution(institution_id: str, db: Session = Depends(get_db)):
    """Retrieve complete verified details of a specific institution."""
    inst = get_institution_by_id(db, institution_id)
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution with ID '{institution_id}' not found.",
        )
    return InstitutionResponse.model_validate(inst.to_dict())


@router.get("/{institution_id}/affiliating-universities", response_model=List[InstitutionResponse])
def get_institution_affiliating_univs(institution_id: str, db: Session = Depends(get_db)):
    """Retrieve affiliating university suggestions for an institution's state."""
    inst = get_institution_by_id(db, institution_id)
    state = inst.state if inst else None
    univs = get_affiliating_universities(db=db, state=state, limit=30)
    return [InstitutionResponse.model_validate(u.to_dict()) for u in univs]


# ========================================================
# 2. CAN'T FIND INSTITUTION? REQUEST ADDITION
# ========================================================

@router.post("/request-addition", response_model=InstitutionAdditionResponse, status_code=status.HTTP_201_CREATED)
def submit_addition_request(
    data: InstitutionAdditionCreate,
    db: Session = Depends(get_db),
):
    """
    Submit a request to add an institution not found in the official directory.
    Stores request as pending audit; does NOT mark automatically verified.
    """
    # Check if institution already exists with same name or AISHE code
    if data.aishe_code:
        existing = db.query(Institution).filter(Institution.aishe_code == data.aishe_code.strip()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An institution with AISHE code '{data.aishe_code}' already exists: {existing.official_name}",
            )

    req = request_institution_addition(db, data.model_dump())
    return InstitutionAdditionResponse(
        id=req.id,
        official_name=req.official_name,
        institution_type=req.institution_type,
        state=req.state,
        district=req.district,
        status=req.status,
        message="Institution addition request submitted successfully. It will be reviewed by an administrator before approval.",
        created_at=req.created_at.isoformat() if req.created_at else None,
    )


# ========================================================
# 3. ADMINISTRATOR AUDIT & MANAGEMENT ENDPOINTS
# ========================================================

@admin_router.get("/pending")
def list_pending_requests(
    user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Administrator: List all pending institution addition requests."""
    pending = db.query(InstitutionAdditionRequest).filter(InstitutionAdditionRequest.status == "pending").all()
    return [p.to_dict() for p in pending]


@admin_router.post("/approve", response_model=InstitutionResponse)
def approve_request(
    payload: InstitutionApprovalRequest,
    user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Administrator: Approve a pending institution request and add to verified directory."""
    admin_name = user.get("name", "System Administrator")
    try:
        inst = approve_institution_request(
            db=db,
            request_id=payload.request_id,
            admin_name=admin_name,
            aishe_code=payload.aishe_code,
            ugc_reference=payload.ugc_reference,
            admin_notes=payload.admin_notes,
        )
        return InstitutionResponse.model_validate(inst.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@admin_router.post("/reject")
def reject_request(
    payload: InstitutionRejectionRequest,
    user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Administrator: Reject an unverified institution request with explanation."""
    admin_name = user.get("name", "System Administrator")
    try:
        req = reject_institution_request(
            db=db,
            request_id=payload.request_id,
            admin_name=admin_name,
            reason=payload.reason,
        )
        return {"message": "Request rejected successfully.", "request_id": req.id, "status": req.status}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@admin_router.post("/import")
def import_dataset(
    payload: DirectoryImportRequest,
    user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Administrator: Bulk import verified institutions dataset with duplicate prevention."""
    admin_name = user.get("name", "System Administrator")
    log = import_institutions_dataset(
        db=db,
        source_name=payload.source_name,
        records=payload.institutions,
        performed_by=admin_name,
    )
    return log.to_dict()
