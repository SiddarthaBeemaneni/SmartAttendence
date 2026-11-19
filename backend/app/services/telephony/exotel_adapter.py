"""
SmartAttend AI / CampusAI - Exotel Telephony Integration Adapter

Production adapter for placing automated outbound voice calls through Exotel:
- Compliant with Exotel REST API (v1)
- Supports callback URLs for call events (ringing, answered, completed, busy, no_answer)
- Webhook signature / token verification
"""

import hmac
import hashlib
import httpx
from typing import Dict, Any, Optional
from app.config import settings
from app.services.telephony.base import TelephonyAdapter


class ExotelAdapter(TelephonyAdapter):
    """Production Exotel cloud telephony adapter."""

    def __init__(self):
        self.api_key = settings.EXOTEL_API_KEY
        self.api_token = settings.EXOTEL_API_TOKEN
        self.sid = settings.EXOTEL_SID
        self.subdomain = settings.EXOTEL_SUBDOMAIN or "api.exotel.com"
        self.caller_id = settings.EXOTEL_CALLER_ID
        self.webhook_secret = settings.EXOTEL_WEBHOOK_SECRET

    def _get_base_url(self) -> str:
        return f"https://{self.subdomain}/v1/Accounts/{self.sid}"

    async def initiate_call(
        self,
        to_phone: str,
        from_phone: Optional[str] = None,
        callback_url: Optional[str] = None,
        custom_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Initiate outbound phone call using Exotel Connect API.
        """
        if not (self.api_key and self.api_token and self.sid):
            raise ValueError("Exotel credentials not configured. Please set EXOTEL_API_KEY, EXOTEL_API_TOKEN, and EXOTEL_SID in .env.")

        caller = from_phone or self.caller_id
        url = f"{self._get_base_url()}/Calls/connect.json"

        # Format number: remove spaces and hyphens
        clean_to = to_phone.replace(" ", "").replace("-", "")

        payload = {
            "From": caller,
            "To": clean_to,
            "CallerId": caller,
            "CallType": "trans",  # Transactional voice call
        }

        if callback_url:
            payload["StatusCallback"] = callback_url
            payload["StatusCallbackEvents[0]"] = "terminal"
            payload["StatusCallbackEvents[1]"] = "answered"

        if custom_data:
            payload["CustomField"] = str(custom_data.get("job_id", ""))

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    url,
                    data=payload,
                    auth=(self.api_key, self.api_token),
                )
                if res.status_code in (200, 201):
                    data = res.json()
                    call_obj = data.get("Call", {})
                    return {
                        "success": True,
                        "provider_call_id": call_obj.get("Sid", f"EXOTEL-{call_obj.get('DateCreated', '')}"),
                        "status": "initiated",
                        "is_simulated": False,
                        "raw_response": data,
                    }
                else:
                    return {
                        "success": False,
                        "provider_call_id": None,
                        "status": "failed",
                        "failure_reason": f"Exotel API error HTTP {res.status_code}: {res.text[:150]}",
                        "is_simulated": False,
                    }
        except Exception as e:
            return {
                "success": False,
                "provider_call_id": None,
                "status": "failed",
                "failure_reason": f"Connection to Exotel failed: {str(e)}",
                "is_simulated": False,
            }

    async def get_call_status(self, provider_call_id: str) -> Dict[str, Any]:
        """Query live call status from Exotel."""
        url = f"{self._get_base_url()}/Calls/{provider_call_id}.json"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, auth=(self.api_key, self.api_token))
                if res.status_code == 200:
                    data = res.json().get("Call", {})
                    return {
                        "provider_call_id": provider_call_id,
                        "status": data.get("Status", "in_progress").lower(),
                        "duration": int(data.get("Duration", 0) or 0),
                        "is_simulated": False,
                    }
        except Exception as e:
            pass
        return {"provider_call_id": provider_call_id, "status": "unknown", "is_simulated": False}

    def verify_webhook_signature(
        self,
        signature: Optional[str],
        raw_body: bytes,
        headers: Optional[Dict[str, str]] = None,
    ) -> bool:
        """
        Verify incoming webhook signature using HMAC-SHA256 if secret configured.
        """
        if not self.webhook_secret:
            return True  # If secret not set in dev, allow callback
        if not signature:
            return False

        computed = hmac.new(self.webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature, computed)
