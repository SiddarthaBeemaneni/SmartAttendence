"""
SmartAttend AI / CampusAI - Mock Telephony Adapter for Testing & Simulation

Allows developers and testers to execute realistic simulated calls without incurring
telephony costs or requiring live Exotel credentials.
Clearly labels all output as SIMULATED / TEST.
"""

import uuid
import time
from typing import Dict, Any, Optional
from app.services.telephony.base import TelephonyAdapter


class MockTelephonyAdapter(TelephonyAdapter):
    """Testing & simulation adapter for telephony calls."""

    def __init__(self, default_outcome: str = "completed"):
        self.default_outcome = default_outcome  # "completed", "busy", "no_answer", "failed"
        self._simulated_calls: Dict[str, dict] = {}

    async def initiate_call(
        self,
        to_phone: str,
        from_phone: str,
        callback_url: Optional[str] = None,
        custom_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Simulate call initiation.
        Validates phone format without dialing physical PSTN lines.
        """
        clean_phone = to_phone.replace(" ", "").replace("-", "")
        call_id = f"SIM-EXOTEL-{uuid.uuid4().hex[:12].upper()}"

        # If phone number is clearly invalid (e.g. less than 8 digits), fail immediately
        if len(clean_phone) < 8 or not any(c.isdigit() for c in clean_phone):
            return {
                "success": False,
                "provider_call_id": call_id,
                "status": "failed",
                "failure_reason": "Invalid parent phone number format",
                "is_simulated": True,
            }

        # Check for simulated test triggers in custom_data or phone
        desired_outcome = self.default_outcome
        if custom_data and "simulated_outcome" in custom_data:
            desired_outcome = custom_data["simulated_outcome"]

        call_record = {
            "provider_call_id": call_id,
            "to_phone": to_phone,
            "from_phone": from_phone,
            "status": desired_outcome,
            "is_simulated": True,
            "initiated_at": time.time(),
            "duration": 52 if desired_outcome == "completed" else 0,
        }
        self._simulated_calls[call_id] = call_record

        return {
            "success": desired_outcome in ("completed", "in_progress", "ringing"),
            "provider_call_id": call_id,
            "status": desired_outcome,
            "is_simulated": True,
            "message": f"[SIMULATION] Mock call dispatched to {to_phone}. Zero carrier charges incurred.",
        }

    async def get_call_status(self, provider_call_id: str) -> Dict[str, Any]:
        call = self._simulated_calls.get(provider_call_id)
        if not call:
            return {
                "provider_call_id": provider_call_id,
                "status": "completed",
                "is_simulated": True,
            }
        return call

    def verify_webhook_signature(
        self,
        signature: Optional[str],
        raw_body: bytes,
        headers: Optional[Dict[str, str]] = None,
    ) -> bool:
        # In simulation mode, accept local test webhooks or header verification
        return True
