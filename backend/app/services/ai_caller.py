"""
SmartAttend AI / CampusAI - Multilingual AI Voice Calling Engine (Refactored)

Provides backwards-compatible interface delegating to the structured speech adapters:
- Eliminates random absence reasons and fake completion
- Deterministic NLU classification based on real parent statements
- Preserves full 6-language dialogue templates (ta, en, te, hi, ml, kn)
"""

import json
from typing import Dict, Any, Optional
from app.services.speech.mock_adapter import MockSpeechAdapter, LANGUAGE_TEMPLATES, classify_parent_utterance

_speech_adapter = MockSpeechAdapter()


def generate_parent_call_dialogue(
    university_name: str,
    student_name: str,
    parent_name: str,
    subject_name: str,
    session_date: str,
    session_slot: str,
    preferred_language: str = "en",
    form_of_address: str = "Mr.",
    parent_statement: Optional[str] = None,
    parent_verified: bool = True,
) -> Dict[str, Any]:
    """Generates authentic 7-stage dialogue flow in parent's preferred language."""
    return _speech_adapter.generate_dialogue_flow(
        university_name=university_name,
        student_name=student_name,
        parent_name=parent_name,
        subject_name=subject_name,
        session_date=session_date,
        session_slot=session_slot,
        preferred_language=preferred_language,
        form_of_address=form_of_address,
        parent_provided_reason=parent_statement,
        parent_verified=parent_verified,
    )


def dispatch_automated_call(
    university_name: str,
    student_name: str,
    roll_number: str,
    parent_name: str,
    parent_phone: str,
    subject_name: str,
    session_date: str,
    session_slot: str,
    preferred_language: str = "en",
    form_of_address: str = "Mr.",
    parent_statement: Optional[str] = None,
    parent_verified: bool = True,
) -> Dict[str, Any]:
    """
    Executes an automated call dispatch with validation:
    - Validates phone format
    - Respects guardian verification status
    - Categorizes true reason using NLU
    """
    clean_phone = parent_phone.replace(" ", "").replace("-", "") if parent_phone else ""
    if len(clean_phone) < 8 or not any(c.isdigit() for c in clean_phone):
        return {
            "call_status": "wrong_number",
            "duration_seconds": 0,
            "reason_category": "Unreachable",
            "parent_statement": "Invalid or incomplete phone number",
            "staff_transfer_requested": False,
            "dialogue_transcript_json": json.dumps([
                {"speaker": "System", "text": "Call aborted: Invalid phone number format", "timestamp": "00:00"}
            ]),
        }

    convo = generate_parent_call_dialogue(
        university_name=university_name,
        student_name=student_name,
        parent_name=parent_name,
        subject_name=subject_name,
        session_date=session_date,
        session_slot=session_slot,
        preferred_language=preferred_language,
        form_of_address=form_of_address,
        parent_statement=parent_statement,
        parent_verified=parent_verified,
    )

    return {
        "call_status": convo.get("call_status", "completed"),
        "duration_seconds": convo.get("duration_seconds", 0),
        "reason_category": convo.get("reason_category"),
        "parent_statement": convo.get("parent_statement"),
        "staff_transfer_requested": False,
        "dialogue_transcript_json": convo.get("dialogue_transcript_json"),
    }
