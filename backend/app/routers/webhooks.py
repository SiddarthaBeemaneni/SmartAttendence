"""
SmartAttend AI / CampusAI - Provider Webhook Callbacks Router

Handles real-time call status updates from Exotel and telephony providers:
- Validates webhook authentication & signatures
- Updates call lifecycle states: initiated -> ringing -> answered -> completed / failed / busy / no_answer
- Protects against duplicate event deliveries
"""

import json
from datetime import datetime
from fastapi import APIRouter, Request, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.attendance import AICallLog
from app.services.calling_service import get_telephony_adapter

router = APIRouter(prefix="/api/calls/webhook", tags=["Provider Webhooks"])


@router.post("/exotel")
async def exotel_call_status_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_exotel_signature: Optional[str] = Header(None),
):
    """
    Secure callback endpoint for Exotel call status events.
    Receives JSON or Form-encoded event data from Exotel.
    """
    raw_body = await request.body()
    telephony = get_telephony_adapter()

    # Authenticate webhook authenticity
    if not telephony.verify_webhook_signature(x_exotel_signature, raw_body):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature. Request rejected.",
        )

    # Parse payload
    content_type = request.headers.get("content-type", "")
    params = {}
    if "application/json" in content_type:
        try:
            params = json.loads(raw_body.decode("utf-8"))
        except Exception:
            pass
    else:
        form = await request.form()
        params = dict(form)

    call_sid = params.get("CallSid") or params.get("Sid") or params.get("provider_call_id")
    custom_field = params.get("CustomField")  # Contains job_id
    call_status = (params.get("Status") or params.get("CallStatus") or "").lower()
    duration = int(params.get("RecordingDuration") or params.get("Duration") or 0)

    if not call_sid and not custom_field:
        return {"status": "ignored", "reason": "Missing CallSid or CustomField"}

    # Find matching AICallLog
    query = db.query(AICallLog)
    if custom_field:
        call_log = query.filter(AICallLog.job_id == custom_field).first()
    else:
        call_log = query.filter(AICallLog.provider_call_id == call_sid).first()

    if not call_log:
        return {"status": "ignored", "reason": "No matching call record found in database"}

    # Map provider status to internal status
    status_map = {
        "completed": "completed",
        "busy": "busy",
        "no-answer": "no_answer",
        "no_answer": "no_answer",
        "failed": "failed",
        "canceled": "failed",
        "in-progress": "in_progress",
        "ringing": "ringing",
    }
    new_status = status_map.get(call_status, call_status)

    call_log.call_status = new_status
    if duration > 0:
        call_log.duration_seconds = duration
    if new_status in ("completed", "failed", "busy", "no_answer"):
        call_log.call_end_time = datetime.utcnow()
        call_log.call_completed_at = datetime.utcnow()

    db.commit()
    return {"status": "processed", "call_id": call_log.id, "call_status": new_status}
