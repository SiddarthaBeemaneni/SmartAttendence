"""
SmartAttend AI / CampusAI - Base AI Speech Provider Interface
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


class SpeechAdapter(ABC):
    """
    Abstract interface for Speech Recognition (STT), Speech Synthesis (TTS),
    and Conversational Dialogue Management across multiple Indian languages.
    """

    @abstractmethod
    async def text_to_speech(self, text: str, language_code: str) -> Optional[bytes]:
        """Convert response text to speech audio bytes."""
        pass

    @abstractmethod
    async def speech_to_text(self, audio_bytes: bytes, language_code: str) -> str:
        """Transcribe spoken parent audio into text."""
        pass

    @abstractmethod
    def generate_dialogue_flow(
        self,
        university_name: str,
        student_name: str,
        parent_name: str,
        subject_name: str,
        session_date: str,
        session_slot: str,
        preferred_language: str,
        form_of_address: str,
        parent_provided_reason: Optional[str] = None,
        parent_verified: bool = True,
    ) -> Dict[str, Any]:
        """
        Executes or simulates the 7-stage conversational AI flow:
        1. GREETING (Time-based in preferred language)
        2. PARENT VERIFICATION (Confirms speaking to authorized parent)
        3. ABSENCE NOTIFICATION (Discloses date, subject, slot ONLY if verified)
        4. REASON INQUIRY (Asks for reason of absence)
        5. LISTEN & PROCESS RESPONSE (Classifies parent statement)
        6. FOLLOW-UP / CLARIFICATION (If needed)
        7. CLOSING (Polite acknowledgment)
        """
        pass
