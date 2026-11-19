"""
SmartAttend AI / CampusAI - Institution Directory Service

Handles:
- Loading official UGC/AISHE seed data into database
- Search with filters (name/code, type, state, district, autonomous status)
- Pagination
- Affiliating universities lookup
- Requesting addition of new institutions (audited pending verification)
- Admin approval & rejection
- Dataset import (CSV / JSON) with duplicate prevention
- Synchronizing with legacy colleges table for backward compatibility
"""

import logging
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, and_
from datetime import datetime, timezone
import uuid
import re

from app.models.institution import (
    Institution,
    InstitutionAdditionRequest,
    DirectoryImportLog,
    INSTITUTION_TYPES,
    INDIAN_STATES_AND_UTS,
)
from app.models.college import College
from app.models.all_india_institutions_data import OFFICIAL_INSTITUTIONS_DATA

logger = logging.getLogger("smartattend.institution")


def normalize_name(name: str) -> str:
    """Normalize institution name for flexible matching (lowercase, strip extra spaces & punctuation)."""
    return re.sub(r"[^\w\s]", "", name.lower()).strip()


def seed_institutions_directory(db: Session) -> int:
    """
    Seeds the authoritative All India institutions directory if empty or missing entries.
    Also syncs with `colleges` table for backward compatibility.
    """
    added_count = 0
    for item in OFFICIAL_INSTITUTIONS_DATA:
        existing = db.query(Institution).filter(
            or_(
                Institution.id == item["id"],
                and_(
                    Institution.aishe_code.isnot(None),
                    Institution.aishe_code == item.get("aishe_code"),
                ),
            )
        ).first()

        if not existing:
            norm = normalize_name(item["official_name"])
            inst = Institution(
                id=item["id"],
                official_name=item["official_name"],
                normalized_name=norm,
                institution_type=item["institution_type"],
                state=item["state"],
                district=item["district"],
                city=item.get("city", item["district"]),
                address=item.get("address"),
                aishe_code=item.get("aishe_code"),
                ugc_reference=item.get("ugc_reference"),
                recognition_status=item.get("recognition_status", "verified"),
                autonomous_status=item.get("autonomous_status", False),
                autonomous_validity=item.get("autonomous_validity"),
                affiliating_university_id=item.get("affiliating_university_id"),
                affiliating_university_name=item.get("affiliating_university_name"),
                official_website=item.get("official_website"),
                source=item.get("source", "UGC & AISHE Official Directory"),
                last_verified_at=datetime.now(timezone.utc),
            )
            db.add(inst)
            added_count += 1

            # Sync with legacy College table for backward compatibility
            existing_college = db.query(College).filter(College.college_id == item["id"]).first()
            if not existing_college:
                col = College(
                    college_id=item["id"],
                    college_name=item["official_name"],
                    college_code=item.get("aishe_code") or f"CODE-{item['id']}",
                    location=f"{item.get('city') or item['district']}",
                    state=item["state"],
                    affiliation=item.get("affiliating_university_name") or item["institution_type"],
                    verification_status=item.get("recognition_status", "verified"),
                )
                db.add(col)

    if added_count > 0:
        db.commit()
        logger.info(f"Seeded {added_count} official institutions into directory.")
    return added_count


def search_institutions(
    db: Session,
    query: Optional[str] = None,
    institution_type: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    is_autonomous: Optional[bool] = None,
    page: int = 1,
    limit: int = 15,
) -> Tuple[int, List[Institution]]:
    """
    Server-side paginated search with multiple filters and partial/fuzzy matching.
    """
    q_db = db.query(Institution).filter(Institution.recognition_status == "verified")

    # Search term (name, normalized name, AISHE code, city/district)
    if query and query.strip():
        term = query.strip().lower()
        norm_term = normalize_name(term)
        q_db = q_db.filter(
            or_(
                func.lower(Institution.official_name).ilike(f"%{term}%"),
                func.lower(Institution.normalized_name).ilike(f"%{norm_term}%"),
                func.lower(Institution.aishe_code) == term,
                func.lower(Institution.aishe_code).ilike(f"%{term}%"),
                func.lower(Institution.district).ilike(f"%{term}%"),
                func.lower(Institution.city).ilike(f"%{term}%"),
                func.lower(Institution.affiliating_university_name).ilike(f"%{term}%"),
            )
        )

    # Filter by State
    if state and state.strip() and state.strip().lower() != "all":
        q_db = q_db.filter(func.lower(Institution.state) == state.strip().lower())

    # Filter by Institution Type
    if institution_type and institution_type.strip() and institution_type.strip().lower() != "all":
        q_db = q_db.filter(func.lower(Institution.institution_type) == institution_type.strip().lower())

    # Filter by District
    if district and district.strip() and district.strip().lower() != "all":
        q_db = q_db.filter(func.lower(Institution.district) == district.strip().lower())

    # Filter by Autonomous Status
    if is_autonomous is not None:
        q_db = q_db.filter(Institution.autonomous_status == is_autonomous)

    total = q_db.count()
    offset = (page - 1) * limit
    items = q_db.order_by(Institution.official_name.asc()).offset(offset).limit(limit).all()

    return total, items


def get_institution_by_id(db: Session, institution_id: str) -> Optional[Institution]:
    return db.query(Institution).filter(Institution.id == institution_id).first()


def get_affiliating_universities(
    db: Session,
    state: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = 50,
) -> List[Institution]:
    """
    Returns verified universities that act as affiliating bodies for colleges.
    """
    university_types = [
        "Central University",
        "State Public University",
        "State Private University",
        "Deemed-to-be University",
    ]
    q_db = db.query(Institution).filter(
        Institution.recognition_status == "verified",
        Institution.institution_type.in_(university_types),
    )
    if state and state.strip() and state.strip().lower() != "all":
        q_db = q_db.filter(func.lower(Institution.state) == state.strip().lower())
    if query and query.strip():
        term = query.strip().lower()
        q_db = q_db.filter(func.lower(Institution.official_name).ilike(f"%{term}%"))

    return q_db.order_by(Institution.official_name.asc()).limit(limit).all()


def get_institution_types_with_counts(db: Session) -> List[Dict[str, Any]]:
    """Returns the 8 institution types with their current counts in the database."""
    counts = dict(
        db.query(Institution.institution_type, func.count(Institution.id))
        .filter(Institution.recognition_status == "verified")
        .group_by(Institution.institution_type)
        .all()
    )

    type_metadata = {
        "Central University": ("Central University", "University", "Established by an Act of Parliament and funded by UGC / Central Government."),
        "State Public University": ("State Public University", "University", "Established by State Legislative Acts and funded by the State Government."),
        "State Private University": ("State Private University", "University", "Established by State Legislative Acts as self-financing universities recognized by UGC under Section 2(f)."),
        "Deemed-to-be University": ("Deemed-to-be University", "University", "Higher education institutions granted deemed university status by UGC under Section 3 of the UGC Act 1956."),
        "Autonomous College": ("Autonomous College", "College", "Colleges granted academic autonomy by UGC, empowered to design curricula and conduct examinations while affiliated with a parent university."),
        "Affiliated College": ("Affiliated College", "College", "Colleges offering academic programs affiliated to a recognized Central or State Public University."),
        "Constituent College": ("Constituent College", "College", "Maintained or established directly by a university as an integral part of its campus."),
        "Other recognized Higher Education Institution": ("Other recognized Higher Education Institution", "Other", "Institutions recognized by statutory apex bodies such as AICTE, NMC, or DCI."),
    }

    result = []
    for code in INSTITUTION_TYPES:
        name, cat, desc = type_metadata.get(code, (code, "Other", ""))
        result.append({
            "code": code,
            "name": name,
            "category": cat,
            "description": desc,
            "count": counts.get(code, 0),
        })
    return result


def get_states_with_counts(db: Session) -> List[Dict[str, Any]]:
    """Returns all 36 Indian States and UTs with current institution counts."""
    counts = dict(
        db.query(Institution.state, func.count(Institution.id))
        .filter(Institution.recognition_status == "verified")
        .group_by(Institution.state)
        .all()
    )

    result = []
    for st in INDIAN_STATES_AND_UTS:
        result.append({
            "state": st,
            "institution_count": counts.get(st, 0),
        })
    return result


def request_institution_addition(
    db: Session,
    data: Dict[str, Any],
) -> InstitutionAdditionRequest:
    """
    Records a pending request from a college that cannot find itself in the directory.
    Audited, not automatically verified.
    """
    req_id = f"REQ-INST-{uuid.uuid4().hex[:8].upper()}"
    new_req = InstitutionAdditionRequest(
        id=req_id,
        official_name=data["official_name"].strip(),
        institution_type=data["institution_type"],
        state=data["state"],
        district=data["district"],
        city=data.get("city") or data["district"],
        address=data.get("address"),
        official_website=data.get("official_website"),
        aishe_code=data.get("aishe_code"),
        ugc_reference=data.get("ugc_reference"),
        affiliating_university=data.get("affiliating_university"),
        official_email=data["official_email"].strip().lower(),
        applicant_name=data["applicant_name"].strip(),
        status="pending",
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req


def approve_institution_request(
    db: Session,
    request_id: str,
    admin_name: str,
    aishe_code: Optional[str] = None,
    ugc_reference: Optional[str] = None,
    admin_notes: Optional[str] = None,
) -> Institution:
    """
    Administrator approves a pending institution addition request, creating a verified Institution record.
    """
    req = db.query(InstitutionAdditionRequest).filter(InstitutionAdditionRequest.id == request_id).first()
    if not req:
        raise ValueError(f"Institution addition request {request_id} not found.")

    if req.status == "approved":
        existing_inst = db.query(Institution).filter(Institution.official_name == req.official_name).first()
        if existing_inst:
            return existing_inst

    new_id = f"INST-APP-{uuid.uuid4().hex[:8].upper()}"
    final_aishe = aishe_code or req.aishe_code
    final_ugc = ugc_reference or req.ugc_reference or "Administrator Approved / Verified"

    is_auto = "autonomous" in req.institution_type.lower() or "autonomous" in req.official_name.lower()

    inst = Institution(
        id=new_id,
        official_name=req.official_name,
        normalized_name=normalize_name(req.official_name),
        institution_type=req.institution_type,
        state=req.state,
        district=req.district,
        city=req.city or req.district,
        address=req.address,
        aishe_code=final_aishe,
        ugc_reference=final_ugc,
        recognition_status="verified",
        autonomous_status=is_auto,
        autonomous_validity="Verified by University Administrator" if is_auto else None,
        affiliating_university_name=req.affiliating_university,
        official_website=req.official_website,
        source="Administrator Verified Addition Request",
        last_verified_at=datetime.now(timezone.utc),
    )
    db.add(inst)

    # Sync into College table for backward compatibility
    col = College(
        college_id=new_id,
        college_name=req.official_name,
        college_code=final_aishe or f"CODE-{new_id}",
        location=req.city or req.district,
        state=req.state,
        affiliation=req.affiliating_university or req.institution_type,
        verification_status="verified",
    )
    db.add(col)

    req.status = "approved"
    req.admin_notes = admin_notes
    req.reviewed_by = admin_name
    req.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(inst)
    return inst


def reject_institution_request(
    db: Session,
    request_id: str,
    admin_name: str,
    reason: str,
) -> InstitutionAdditionRequest:
    """Administrator rejects a pending addition request with a reason."""
    req = db.query(InstitutionAdditionRequest).filter(InstitutionAdditionRequest.id == request_id).first()
    if not req:
        raise ValueError(f"Institution addition request {request_id} not found.")

    req.status = "rejected"
    req.admin_notes = reason
    req.reviewed_by = admin_name
    req.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return req


def import_institutions_dataset(
    db: Session,
    source_name: str,
    records: List[Dict[str, Any]],
    performed_by: str = "admin",
) -> DirectoryImportLog:
    """
    Imports verified records from CSV / Excel / Government datasets.
    Prevents duplicate entries and logs import audit metrics.
    """
    added = 0
    updated = 0
    skipped = 0

    for rec in records:
        name = rec.get("official_name") or rec.get("college_name")
        if not name or not rec.get("state"):
            skipped += 1
            continue

        aishe = rec.get("aishe_code")
        existing = None
        if aishe:
            existing = db.query(Institution).filter(Institution.aishe_code == aishe).first()
        if not existing:
            norm = normalize_name(name)
            existing = db.query(Institution).filter(
                Institution.normalized_name == norm,
                Institution.state == rec.get("state"),
            ).first()

        if existing:
            # Update fields if new data present, but never downgrade verified status
            if rec.get("ugc_reference"):
                existing.ugc_reference = rec["ugc_reference"]
            if rec.get("official_website"):
                existing.official_website = rec["official_website"]
            if rec.get("autonomous_validity"):
                existing.autonomous_validity = rec["autonomous_validity"]
            existing.last_verified_at = datetime.now(timezone.utc)
            updated += 1
        else:
            new_id = rec.get("id") or f"INST-IMP-{uuid.uuid4().hex[:8].upper()}"
            inst = Institution(
                id=new_id,
                official_name=name.strip(),
                normalized_name=normalize_name(name),
                institution_type=rec.get("institution_type", "Affiliated College"),
                state=rec.get("state"),
                district=rec.get("district", rec.get("city", "General")),
                city=rec.get("city"),
                address=rec.get("address"),
                aishe_code=aishe,
                ugc_reference=rec.get("ugc_reference"),
                recognition_status="verified",
                autonomous_status=bool(rec.get("autonomous_status", False)),
                autonomous_validity=rec.get("autonomous_validity"),
                affiliating_university_id=rec.get("affiliating_university_id"),
                affiliating_university_name=rec.get("affiliating_university_name"),
                official_website=rec.get("official_website"),
                source=source_name,
                last_verified_at=datetime.now(timezone.utc),
            )
            db.add(inst)

            # Sync into College table
            col = College(
                college_id=new_id,
                college_name=name.strip(),
                college_code=aishe or f"CODE-{new_id}",
                location=rec.get("city") or rec.get("district") or "Campus",
                state=rec.get("state"),
                affiliation=rec.get("affiliating_university_name") or rec.get("institution_type", "Accredited"),
                verification_status="verified",
            )
            db.add(col)
            added += 1

    log = DirectoryImportLog(
        id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        source_name=source_name,
        records_processed=len(records),
        records_added=added,
        records_updated=updated,
        records_skipped=skipped,
        performed_by=performed_by,
        notes=f"Processed {len(records)} records: {added} added, {updated} updated, {skipped} skipped.",
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
