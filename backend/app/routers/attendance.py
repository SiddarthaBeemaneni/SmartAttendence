"""
SmartAttend AI / CampusAI - Enterprise Attendance & Automated AI Calling Router

Enforces:
- Multi-college database isolation
- Authoritative database verification for every absent student & registered parent
- Prior parental consent validation (TRAI / Compliance requirement)
- Valid phone verification
- Idempotent background call job dispatch
- Real-time call logs, stats, and manual retry endpoints
"""

import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.config import settings
from app.models.university import University
from app.models.student import Student
from app.models.attendance import AttendanceSession, AttendanceRecord, AICallLog
from app.schemas.attendance import (
    AttendanceSessionCreate,
    AttendanceBatchMark,
    AttendanceFinalizeRequest,
    AttendanceSessionResponse,
    AICallLogResponse,
    CallStatsResponse,
)
from app.services.call_queue import enqueue_call_job
from app.routers.auth import oauth2_scheme
from app.utils.security import verify_token

router = APIRouter(prefix="/api/attendance", tags=["Attendance & Calling"])


def get_current_tenant_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


# ====================================================================
# 1. SESSIONS (CREATE, LIST, RETRIEVE)
# ====================================================================
@router.get("/sessions", response_model=List[AttendanceSessionResponse])
def get_attendance_sessions(
    subject_code: Optional[str] = None,
    session_date: Optional[str] = None,
    department: Optional[str] = None,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """List attendance sessions strictly isolated to the authenticated college tenant."""
    univ_id = user.get("university_id") or user.get("college_id") or "UNI-2026-0001"
    query = db.query(AttendanceSession).filter(AttendanceSession.university_id == univ_id)

    if subject_code:
        query = query.filter(AttendanceSession.subject_code == subject_code)
    if session_date:
        query = query.filter(AttendanceSession.session_date == session_date)
    if department and department != "All":
        query = query.filter(AttendanceSession.department == department)

    return query.order_by(AttendanceSession.created_at.desc()).all()


@router.post("/sessions", response_model=AttendanceSessionResponse)
def create_or_get_session(
    data: AttendanceSessionCreate,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """Create or resume an attendance marking session for the college."""
    univ_id = user.get("university_id") or user.get("college_id") or "UNI-2026-0001"
    faculty_id = user.get("user_id", data.faculty_id or "usr-fac-01")
    faculty_name = user.get("name", data.faculty_name or "Faculty Member")

    existing = (
        db.query(AttendanceSession)
        .filter(
            AttendanceSession.university_id == univ_id,
            AttendanceSession.subject_code == data.subject_code,
            AttendanceSession.department == data.department,
            AttendanceSession.year == data.year,
            AttendanceSession.semester == data.semester,
            AttendanceSession.section == data.section,
            AttendanceSession.session_date == data.session_date,
            AttendanceSession.session_slot == data.session_slot,
        )
        .first()
    )
    if existing:
        return existing

    new_session = AttendanceSession(
        university_id=univ_id,
        faculty_id=faculty_id,
        faculty_name=faculty_name,
        subject_code=data.subject_code,
        subject_name=data.subject_name,
        department=data.department,
        year=data.year,
        semester=data.semester,
        section=data.section,
        session_date=data.session_date,
        session_slot=data.session_slot,
        status="draft",
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


# ====================================================================
# 2. SAVE AS DRAFT (ZERO CALLS DISPATCHED)
# ====================================================================
@router.put("/mark")
def save_attendance_draft(
    data: AttendanceBatchMark,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    Save attendance records as draft without triggering any calls.
    Validates students against the authenticated college database.
    """
    univ_id = user.get("university_id") or user.get("college_id") or "UNI-2026-0001"
    session = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.id == data.session_id, AttendanceSession.university_id == univ_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found.")

    if session.status == "finalized":
        raise HTTPException(status_code=400, detail="Cannot modify a finalized attendance session.")

    # Validate students belonging to this university
    student_ids = [r.student_id for r in data.records]
    db_students = {
        s.id: s
        for s in db.query(Student).filter(
            Student.id.in_(student_ids),
            Student.university_id == univ_id
        ).all()
    }

    present_count = 0
    absent_count = 0
    late_count = 0

    for rec in data.records:
        st = db_students.get(rec.student_id)
        if not st:
            continue  # Skip unverified cross-tenant records

        if rec.status == "present":
            present_count += 1
        elif rec.status == "absent":
            absent_count += 1
        elif rec.status == "late":
            late_count += 1

        existing_rec = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == st.id)
            .first()
        )
        if existing_rec:
            existing_rec.status = rec.status
            existing_rec.remarks = rec.remarks
            existing_rec.marked_at = datetime.utcnow()
        else:
            new_rec = AttendanceRecord(
                session_id=session.id,
                student_id=st.id,
                student_name=st.name,
                roll_number=st.roll_number,
                status=rec.status,
                parent_name=st.parent_name,
                parent_phone=st.parent_phone,
                preferred_language=st.preferred_language or "en",
                preferred_form_of_address=st.preferred_form_of_address or "Mr.",
                remarks=rec.remarks,
            )
            db.add(new_rec)

    session.total_students = present_count + absent_count + late_count
    session.present_count = present_count
    session.absent_count = absent_count
    session.late_count = late_count
    db.commit()

    return {
        "message": "Attendance draft saved safely. Zero AI parent calls were triggered.",
        "session_id": session.id,
        "total_students": session.total_students,
        "present_count": present_count,
        "absent_count": absent_count,
        "late_count": late_count,
        "status": session.status,
    }


# ====================================================================
# 3. FINALIZE ATTENDANCE & AUTOMATED AI CALL DISPATCH
# ====================================================================
@router.post("/finalize")
def finalize_attendance_and_dispatch_calls(
    data: AttendanceFinalizeRequest,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    Finalizes attendance transactionally:
    1. Locks the session permanently.
    2. Validates every student and retrieves trusted parent details from the database.
    3. Identifies all absent students.
    4. Enforces regulatory parental consent (consent_given == True).
    5. Validates phone number format.
    6. Creates unique call jobs in background queue with idempotency keys.
    7. Dispatches calls asynchronously via configured telephony provider.
    """
    univ_id = user.get("university_id") or user.get("college_id") or "UNI-2026-0001"
    session = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.id == data.session_id, AttendanceSession.university_id == univ_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found.")

    if session.status == "finalized":
        raise HTTPException(
            status_code=400,
            detail="This attendance session is already finalized. Calls have already been queued.",
        )

    # Retrieve all student records strictly from database for this college
    student_ids = [r.student_id for r in data.records]
    db_students = {
        s.id: s
        for s in db.query(Student).filter(
            Student.id.in_(student_ids),
            Student.university_id == univ_id
        ).all()
    }

    if not db_students:
        raise HTTPException(
            status_code=400,
            detail="No valid registered students found for this class session.",
        )

    try:
        present_count = 0
        absent_count = 0
        late_count = 0
        absent_student_objects = []

        for rec in data.records:
            st = db_students.get(rec.student_id)
            if not st:
                continue

            if rec.status == "present":
                present_count += 1
            elif rec.status == "absent":
                absent_count += 1
                absent_student_objects.append(st)
            elif rec.status == "late":
                late_count += 1

            existing_rec = (
                db.query(AttendanceRecord)
                .filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == st.id)
                .first()
            )
            if existing_rec:
                existing_rec.status = rec.status
                existing_rec.remarks = rec.remarks
            else:
                new_rec = AttendanceRecord(
                    session_id=session.id,
                    student_id=st.id,
                    student_name=st.name,
                    roll_number=st.roll_number,
                    status=rec.status,
                    parent_name=st.parent_name,
                    parent_phone=st.parent_phone,
                    preferred_language=st.preferred_language or "en",
                    preferred_form_of_address=st.preferred_form_of_address or "Mr.",
                    remarks=rec.remarks,
                )
                db.add(new_rec)

        # Mark session finalized
        session.status = "finalized"
        session.finalized_at = datetime.utcnow()
        session.total_students = present_count + absent_count + late_count
        session.present_count = present_count
        session.absent_count = absent_count
        session.late_count = late_count

        # Process each absent student for AI parent calling
        call_mode = settings.CALL_MODE
        queued_calls = []
        skipped_no_consent = []
        skipped_invalid_phone = []

        for st in absent_student_objects:
            idempotency_key = f"{session.id}_{st.id}"

            # Check if call job already exists for this session & student
            existing_job = db.query(AICallLog).filter(AICallLog.idempotency_key == idempotency_key).first()
            if existing_job:
                continue

            # Verification 1: Parental consent check
            if not st.consent_given:
                # Log unconsented record without placing outbound call
                unconsented_log = AICallLog(
                    id=f"call-{uuid.uuid4().hex[:10]}",
                    job_id=f"job-{uuid.uuid4().hex[:10]}",
                    university_id=univ_id,
                    college_id=univ_id,
                    session_id=session.id,
                    student_id=st.id,
                    student_name=st.name,
                    roll_number=st.roll_number,
                    idempotency_key=idempotency_key,
                    subject_name=session.subject_name,
                    session_date=session.session_date,
                    session_slot=session.session_slot,
                    parent_name=st.parent_name,
                    parent_phone=st.parent_phone,
                    language=st.preferred_language or "en",
                    preferred_language=st.preferred_language or "en",
                    form_of_address=st.preferred_form_of_address or "Mr.",
                    call_mode=call_mode,
                    call_status="no_consent",
                    failure_reason="Automated calling skipped: Parental consent not granted.",
                    dialogue_transcript=json.dumps([
                        {"speaker": "System", "text": "Call not dispatched: Parent has not opted-in or provided automated call consent.", "timestamp": "00:00"}
                    ]),
                    call_initiated_at=datetime.utcnow(),
                    call_completed_at=datetime.utcnow(),
                )
                db.add(unconsented_log)
                skipped_no_consent.append({"student_name": st.name, "reason": "No parental consent"})
                continue

            # Verification 2: Phone number validity
            clean_phone = st.parent_phone.replace(" ", "").replace("-", "") if st.parent_phone else ""
            if len(clean_phone) < 8 or not any(c.isdigit() for c in clean_phone):
                invalid_phone_log = AICallLog(
                    id=f"call-{uuid.uuid4().hex[:10]}",
                    job_id=f"job-{uuid.uuid4().hex[:10]}",
                    university_id=univ_id,
                    college_id=univ_id,
                    session_id=session.id,
                    student_id=st.id,
                    student_name=st.name,
                    roll_number=st.roll_number,
                    idempotency_key=idempotency_key,
                    subject_name=session.subject_name,
                    session_date=session.session_date,
                    session_slot=session.session_slot,
                    parent_name=st.parent_name,
                    parent_phone=st.parent_phone or "None",
                    language=st.preferred_language or "en",
                    preferred_language=st.preferred_language or "en",
                    form_of_address=st.preferred_form_of_address or "Mr.",
                    call_mode=call_mode,
                    call_status="failed",
                    failure_reason="Invalid or missing parent telephone number.",
                    dialogue_transcript=json.dumps([
                        {"speaker": "System", "text": "Call failed: Registered parent contact number is incomplete or invalid.", "timestamp": "00:00"}
                    ]),
                    call_initiated_at=datetime.utcnow(),
                    call_completed_at=datetime.utcnow(),
                )
                db.add(invalid_phone_log)
                skipped_invalid_phone.append({"student_name": st.name, "reason": "Invalid phone format"})
                continue

            # Create queued call record in database
            call_id = f"call-{uuid.uuid4().hex[:10]}"
            job_id = f"job-{uuid.uuid4().hex[:10]}"
            new_call = AICallLog(
                id=call_id,
                job_id=job_id,
                university_id=univ_id,
                college_id=univ_id,
                session_id=session.id,
                student_id=st.id,
                student_name=st.name,
                roll_number=st.roll_number,
                idempotency_key=idempotency_key,
                subject_name=session.subject_name,
                session_date=session.session_date,
                session_slot=session.session_slot,
                parent_name=st.parent_name,
                parent_phone=st.parent_phone,
                language=st.preferred_language or "en",
                preferred_language=st.preferred_language or "en",
                form_of_address=st.preferred_form_of_address or "Mr.",
                call_mode=call_mode,
                call_status="queued",
                attempt_count=1,
                max_attempts=3,
                dialogue_transcript=json.dumps([
                    {"speaker": "System", "text": f"Call job queued in background queue. Mode: {call_mode}.", "timestamp": "00:00"}
                ]),
                call_initiated_at=datetime.utcnow(),
            )
            db.add(new_call)
            db.flush()  # Flush to ensure new_call.id is persisted before enqueuing

            # Enqueue to background worker queue
            enqueue_call_job(new_call.id)
            queued_calls.append({
                "student_name": st.name,
                "parent_name": st.parent_name,
                "language": st.preferred_language or "en",
                "phone": st.parent_phone,
                "status": "queued",
                "call_mode": call_mode,
            })

        db.commit()

        return {
            "message": f"Attendance finalized successfully. {len(queued_calls)} automated AI parent calls queued.",
            "session_id": session.id,
            "total_students": session.total_students,
            "present_count": present_count,
            "absent_count": absent_count,
            "late_count": late_count,
            "queued_calls": queued_calls,
            "skipped_no_consent": skipped_no_consent,
            "skipped_invalid_phone": skipped_invalid_phone,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Attendance finalization failed: {str(e)}",
        )


# ====================================================================
# 4. CALL LOGS & DASHBOARD REPORTING
# ====================================================================
@router.get("/calls/logs", response_model=List[AICallLogResponse])
def get_call_logs(
    call_status: Optional[str] = None,
    language: Optional[str] = None,
    call_mode: Optional[str] = None,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """Retrieve all AI call logs for the authenticated university tenant with transcripts."""
    univ_id = user.get("university_id") or user.get("college_id") or "UNI-2026-0001"
    query = db.query(AICallLog).filter(AICallLog.university_id == univ_id)

    if call_status and call_status != "All":
        query = query.filter(AICallLog.call_status == call_status)
    if language and language != "All":
        query = query.filter(AICallLog.language == language)
    if call_mode and call_mode != "All":
        query = query.filter(AICallLog.call_mode == call_mode)

    return query.order_by(AICallLog.call_initiated_at.desc()).all()


@router.get("/calls/stats", response_model=CallStatsResponse)
def get_call_dashboard_stats(
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """Retrieve comprehensive call pipeline statistics for the AI Call Dashboard."""
    univ_id = user.get("university_id") or user.get("college_id") or "UNI-2026-0001"
    base_q = db.query(AICallLog).filter(AICallLog.university_id == univ_id)

    total_absent = db.query(func.count(AICallLog.id)).filter(AICallLog.university_id == univ_id).scalar() or 0
    queued = base_q.filter(AICallLog.call_status == "queued").count()
    in_progress = base_q.filter(AICallLog.call_status.in_(["initiated", "ringing", "in_progress"])).count()
    completed = base_q.filter(AICallLog.call_status == "completed").count()
    failed = base_q.filter(AICallLog.call_status.in_(["failed", "wrong_number"])).count()
    unanswered = base_q.filter(AICallLog.call_status == "no_answer").count()
    busy = base_q.filter(AICallLog.call_status == "busy").count()
    no_consent = base_q.filter(AICallLog.call_status == "no_consent").count()

    simulated = base_q.filter(AICallLog.call_mode == "simulation").count()
    live = base_q.filter(AICallLog.call_mode == "live").count()

    return CallStatsResponse(
        total_absent_students=total_absent,
        eligible_parents=total_absent - no_consent,
        calls_queued=queued,
        calls_in_progress=in_progress,
        calls_completed=completed,
        calls_failed=failed,
        calls_unanswered=unanswered,
        calls_busy=busy,
        parents_without_consent=no_consent,
        simulated_calls=simulated,
        live_calls=live,
    )


# ====================================================================
# 5. RETRY FAILED OR UNANSWERED CALLS
# ====================================================================
@router.post("/calls/{call_id}/retry")
def retry_call_job(
    call_id: str,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """Manually retry a failed, unanswered, or busy call job."""
    univ_id = user.get("university_id") or user.get("college_id") or "UNI-2026-0001"
    call_log = (
        db.query(AICallLog)
        .filter(AICallLog.id == call_id, AICallLog.university_id == univ_id)
        .first()
    )
    if not call_log:
        raise HTTPException(status_code=404, detail="Call record not found.")

    if call_log.call_status == "completed":
        raise HTTPException(status_code=400, detail="Cannot retry a call that was already successfully completed.")

    if call_log.attempt_count >= call_log.max_attempts:
        raise HTTPException(status_code=400, detail="Maximum retry limit reached for this call.")

    call_log.attempt_count += 1
    call_log.call_status = "queued"
    call_log.failure_reason = None
    call_log.call_initiated_at = datetime.utcnow()
    db.commit()

    enqueue_call_job(call_log.id)
    return {"message": "Call job re-enqueued for retry.", "call_id": call_log.id, "attempt": call_log.attempt_count}
