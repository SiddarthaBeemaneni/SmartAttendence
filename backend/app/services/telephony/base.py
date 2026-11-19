"""
SmartAttend AI / CampusAI - Base Telephony Provider Interface
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class TelephonyAdapter(ABC):
    """
    Abstract interface for telephony providers (Exotel, Twilio, Mock).
    """

    @abstractmethod
    async def initiate_call(
        self,
        to_phone: str,
        from_phone: str,
        callback_url: Optional[str] = None,
        custom_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Initiates an outbound call.
        Returns dict containing: provider_call_id, status, error (if any).
        """
        pass

    @abstractmethod
    async def get_call_status(self, provider_call_id: str) -> Dict[str, Any]:
        """Queries the current status of an ongoing or completed call."""
        pass

    @abstractmethod
    def verify_webhook_signature(
        self,
        signature: Optional[str],
        raw_body: bytes,
        headers: Optional[Dict[str, str]] = None,
    ) -> bool:
        """Verifies the authenticity of provider webhook callbacks."""
        pass
