"""
SmartAttend AI / CampusAI - Attendance & Automated Calling Router
"""

import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.university import University
from app.models.student import Student
from app.models.attendance import AttendanceSession, AttendanceRecord, AICallLog
from app.schemas.attendance import (
    AttendanceSessionCreate,
    AttendanceBatchMark,
    AttendanceFinalizeRequest,
    AttendanceSessionResponse,
    AICallLogResponse,
)
from app.services.ai_caller import dispatch_automated_call
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


@router.get("/sessions", response_model=List[AttendanceSessionResponse])
def get_attendance_sessions(
    subject_code: Optional[str] = None,
    session_date: Optional[str] = None,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """List attendance sessions for the current university tenant."""
    univ_id = user.get("university_id", "UNI-2026-0001")
    query = db.query(AttendanceSession).filter(AttendanceSession.university_id == univ_id)
    if subject_code:
        query = query.filter(AttendanceSession.subject_code == subject_code)
    if session_date:
        query = query.filter(AttendanceSession.session_date == session_date)
    return query.order_by(AttendanceSession.created_at.desc()).all()


@router.post("/sessions", response_model=AttendanceSessionResponse)
def create_or_get_session(
    data: AttendanceSessionCreate,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """Create a new attendance marking session."""
    univ_id = user.get("university_id", "UNI-2026-0001")
    faculty_id = user.get("user_id", data.faculty_id or "usr-fac-01")
    faculty_name = user.get("name", data.faculty_name or "Faculty Member")

    # Check if session already exists for this slot & subject
    existing = (
        db.query(AttendanceSession)
        .filter(
            AttendanceSession.university_id == univ_id,
            AttendanceSession.subject_code == data.subject_code,
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


@router.put("/mark")
def save_attendance_draft(
    data: AttendanceBatchMark,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    Save attendance records as draft without triggering AI parent calls.
    """
    univ_id = user.get("university_id", "UNI-2026-0001")
    session = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.id == data.session_id, AttendanceSession.university_id == univ_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found.")

    if session.status == "finalized":
        raise HTTPException(status_code=400, detail="Cannot edit a finalized session.")

    # Upsert attendance records
    present_count = 0
    absent_count = 0
    late_count = 0

    for rec in data.records:
        if rec.status == "present":
            present_count += 1
        elif rec.status == "absent":
            absent_count += 1
        elif rec.status == "late":
            late_count += 1

        existing_rec = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == rec.student_id)
            .first()
        )
        if existing_rec:
            existing_rec.status = rec.status
            existing_rec.remarks = rec.remarks
            existing_rec.marked_at = datetime.utcnow()
        else:
            new_rec = AttendanceRecord(
                session_id=session.id,
                student_id=rec.student_id,
                student_name=rec.student_name,
                roll_number=rec.roll_number,
                status=rec.status,
                parent_name=rec.parent_name,
                parent_phone=rec.parent_phone,
                preferred_language=rec.preferred_language or "en",
                preferred_form_of_address=rec.preferred_form_of_address or "Mr.",
                remarks=rec.remarks,
            )
            db.add(new_rec)

    session.total_students = len(data.records)
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


@router.post("/finalize")
def finalize_attendance_and_dispatch_calls(
    data: AttendanceFinalizeRequest,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    Finalize attendance session:
    1. Lock attendance session permanently.
    2. Save all student attendance states.
    3. For every student marked absent, automatically dispatch AI parent call
       in parent's preferred language, verify identity, notify absence,
       capture reason, and record dialogue transcript.
    """
    univ_id = user.get("university_id", "UNI-2026-0001")
    univ = db.query(University).filter(University.id == univ_id).first()
    university_name = univ.name if univ else "College Administration"

    session = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.id == data.session_id, AttendanceSession.university_id == univ_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found.")

    # Save all records and identify absentees
    absentees = []
    present_count = 0
    absent_count = 0
    late_count = 0

    for rec in data.records:
        if rec.status == "present":
            present_count += 1
        elif rec.status == "absent":
            absent_count += 1
            absentees.append(rec)
        elif rec.status == "late":
            late_count += 1

        existing_rec = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == rec.student_id)
            .first()
        )
        if existing_rec:
            existing_rec.status = rec.status
            existing_rec.remarks = rec.remarks
        else:
            new_rec = AttendanceRecord(
                session_id=session.id,
                student_id=rec.student_id,
                student_name=rec.student_name,
                roll_number=rec.roll_number,
                status=rec.status,
                parent_name=rec.parent_name,
                parent_phone=rec.parent_phone,
                preferred_language=rec.preferred_language or "en",
                preferred_form_of_address=rec.preferred_form_of_address or "Mr.",
                remarks=rec.remarks,
            )
            db.add(new_rec)

    # Finalize session
    session.status = "finalized"
    session.finalized_at = datetime.utcnow()
    session.total_students = len(data.records)
    session.present_count = present_count
    session.absent_count = absent_count
    session.late_count = late_count
    db.commit()

    # Dispatch automated AI parent calls for every absent student
    dispatched_calls = []
    for absent_rec in absentees:
        call_result = dispatch_automated_call(
            university_name=university_name,
            student_name=absent_rec.student_name,
            roll_number=absent_rec.roll_number,
            parent_name=absent_rec.parent_name or "Parent / Guardian",
            parent_phone=absent_rec.parent_phone or "+91 98401 00000",
            subject_name=session.subject_name,
            session_date=session.session_date,
            session_slot=session.session_slot,
            preferred_language=absent_rec.preferred_language or "en",
            form_of_address=absent_rec.preferred_form_of_address or "Mr.",
        )

        call_log = AICallLog(
            university_id=univ_id,
            session_id=session.id,
            student_id=absent_rec.student_id,
            student_name=absent_rec.student_name,
            roll_number=absent_rec.roll_number,
            subject_name=session.subject_name,
            session_date=session.session_date,
            session_slot=session.session_slot,
            parent_name=absent_rec.parent_name or "Parent / Guardian",
            parent_phone=absent_rec.parent_phone or "+91 98401 00000",
            language=absent_rec.preferred_language or "en",
            form_of_address=absent_rec.preferred_form_of_address or "Mr.",
            call_status=call_result["call_status"],
            duration_seconds=call_result["duration_seconds"],
            reason_category=call_result["reason_category"],
            parent_statement=call_result["parent_statement"],
            staff_transfer_requested=call_result["staff_transfer_requested"],
            dialogue_transcript=call_result["dialogue_transcript_json"],
            call_initiated_at=datetime.utcnow(),
            call_completed_at=datetime.utcnow(),
        )
        db.add(call_log)
        dispatched_calls.append({
            "student_name": absent_rec.student_name,
            "parent_name": absent_rec.parent_name,
            "language": absent_rec.preferred_language or "en",
            "phone": absent_rec.parent_phone,
            "status": call_result["call_status"],
            "reason_captured": call_result["reason_category"],
        })

    db.commit()

    return {
        "message": f"Attendance finalized successfully. {len(dispatched_calls)} automated AI parent calls dispatched.",
        "session_id": session.id,
        "total_students": session.total_students,
        "present_count": present_count,
        "absent_count": absent_count,
        "late_count": late_count,
        "dispatched_calls": dispatched_calls,
    }


@router.get("/calls/logs", response_model=List[AICallLogResponse])
def get_call_logs(
    call_status: Optional[str] = None,
    language: Optional[str] = None,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """Retrieve all AI call logs for the university with transcripts and recorded reasons."""
    univ_id = user.get("university_id", "UNI-2026-0001")
    query = db.query(AICallLog).filter(AICallLog.university_id == univ_id)
    if call_status:
        query = query.filter(AICallLog.call_status == call_status)
    if language:
        query = query.filter(AICallLog.language == language)
    return query.order_by(AICallLog.call_initiated_at.desc()).all()
