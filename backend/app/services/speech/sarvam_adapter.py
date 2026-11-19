"""
SmartAttend AI / CampusAI - Sarvam AI Voice & Speech Adapter

Production adapter for Indian language Speech-To-Text (STT) and Text-To-Speech (TTS):
- Supports all 6 required languages: ta-IN, en-IN, te-IN, hi-IN, ml-IN, kn-IN
- Powered by official Sarvam AI REST API
"""

import httpx
from typing import Dict, Any, Optional
from app.config import settings
from app.services.speech.base import SpeechAdapter
from app.services.speech.mock_adapter import MockSpeechAdapter

SARVAM_LANG_MAP = {
    "en": "en-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "hi": "hi-IN",
    "ml": "ml-IN",
    "kn": "kn-IN",
}


class SarvamAIAdapter(SpeechAdapter):
    """Production Sarvam AI speech adapter."""

    def __init__(self):
        self.api_key = settings.SARVAM_API_KEY
        self.api_url = settings.SARVAM_API_URL or "https://api.sarvam.ai"
        self._fallback = MockSpeechAdapter()

    async def text_to_speech(self, text: str, language_code: str) -> Optional[bytes]:
        """Convert response text to speech audio via Sarvam AI TTS."""
        if not self.api_key:
            return await self._fallback.text_to_speech(text, language_code)

        target_lang = SARVAM_LANG_MAP.get(language_code, "en-IN")
        url = f"{self.api_url}/text-to-speech"
        headers = {"api-subscription-key": self.api_key, "Content-Type": "application/json"}
        payload = {
            "inputs": [text],
            "target_language_code": target_lang,
            "speaker": "meera",
            "model": "bulbul:v1",
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    return res.content
        except Exception:
            pass
        return None

    async def speech_to_text(self, audio_bytes: bytes, language_code: str) -> str:
        """Transcribe spoken audio via Sarvam AI STT."""
        if not self.api_key:
            return await self._fallback.speech_to_text(audio_bytes, language_code)

        url = f"{self.api_url}/speech-to-text"
        headers = {"api-subscription-key": self.api_key}
        target_lang = SARVAM_LANG_MAP.get(language_code, "en-IN")

        try:
            files = {"file": ("audio.wav", audio_bytes, "audio/wav")}
            data = {"language_code": target_lang, "model": "saarika:v1"}
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, files=files, data=data, headers=headers)
                if res.status_code == 200:
                    return res.json().get("transcript", "")
        except Exception:
            pass
        return ""

    def generate_dialogue_flow(
        self,
        university_name: str,
        student_name: str,
        parent_name: str,
        subject_name: str,
        session_date: str,
        session_slot: str,
        preferred_language: str = "en",
        form_of_address: str = "Mr.",
        parent_provided_reason: Optional[str] = None,
        parent_verified: bool = True,
    ) -> Dict[str, Any]:
        # Uses the core conversational dialogue structure, backing it with live TTS/STT in live calls
        return self._fallback.generate_dialogue_flow(
            university_name=university_name,
            student_name=student_name,
            parent_name=parent_name,
            subject_name=subject_name,
            session_date=session_date,
            session_slot=session_slot,
            preferred_language=preferred_language,
            form_of_address=form_of_address,
            parent_provided_reason=parent_provided_reason,
            parent_verified=parent_verified,
        )
