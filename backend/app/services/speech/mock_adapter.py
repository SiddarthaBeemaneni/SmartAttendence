"""
SmartAttend AI / CampusAI - Multilingual Conversational AI Mock Adapter

Implements the 7-stage conversational AI flow across 6 Indian languages:
1. English (en)
2. Tamil (ta)
3. Telugu (te)
4. Hindi (hi)
5. Malayalam (ml)
6. Kannada (kn)

Rules:
- NEVER picks random absence reasons with random.choice!
- Processes and classifies actual parent responses using NLU keyword & intent heuristics.
- Respects parent verification: if verification fails, confidential student details are NEVER disclosed.
- Produces authentic, human-readable transcripts with timestamps.
"""

import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from app.services.speech.base import SpeechAdapter


# Dialogue templates across 6 languages
LANGUAGE_TEMPLATES = {
    "en": {
        "name": "English",
        "greetings": {
            "morning": "Good morning",
            "afternoon": "Good afternoon",
            "evening": "Good evening",
        },
        "intro": "This is SmartAttend AI, the automated campus assistant calling from {university_name}.",
        "verify_parent": "Am I speaking with {salutation} {parent_name}, the registered parent or guardian of {student_name}?",
        "parent_confirm": "Yes, I am {parent_name}, speaking.",
        "parent_deny": "No, this is someone else.",
        "unverified_close": "We apologize for the interruption. For privacy and security, student attendance records can only be shared with authorized parents. Have a good day.",
        "absence_notice": "Thank you for confirming. We are calling to inform you that {student_name} was marked absent today ({date}) for the '{subject_name}' lecture during the {time_slot} session.",
        "ask_reason": "Could you please explain the reason for the absence so we can record it in official college records?",
        "follow_up": "Understood. Has this been communicated to the class advisor, or would you like us to note this down?",
        "parent_follow_up": "Yes, please note it down in the attendance portal.",
        "closing": "Thank you, {salutation} {parent_name}. The reason has been recorded into the college system. Have a good day.",
        "fallback_reason": "Parent reported child is unavailable today due to domestic reasons.",
    },
    "ta": {
        "name": "Tamil (தமிழ்)",
        "greetings": {
            "morning": "காலை வணக்கம்",
            "afternoon": "மதிய வணக்கம்",
            "evening": "மாலை வணக்கம்",
        },
        "intro": "{university_name} கல்லூரியின் அதிகாரப்பூர்வ AI தானியங்கி அழைப்பு மையத்திலிருந்து பேசுகிறேன்.",
        "verify_parent": "நான் {student_name}-ன் பெற்றோர் {salutation} {parent_name} அவர்களிடம் பேசுகிறேனா?",
        "parent_confirm": "ஆம், நான்தான் {parent_name} பேசுகிறேன்.",
        "parent_deny": "இல்லை, தவறான எண்.",
        "unverified_close": "மன்னிக்கவும். மாணவர் பாதுகாப்பு கருதி விவரங்கள் பெற்றோரிடம் மட்டுமே பகிரப்படும். நன்றி.",
        "absence_notice": "நன்றி. உங்கள் மாணவர் {student_name} இன்று ({date}) {time_slot} நடைபெற்ற '{subject_name}' வகுப்பிற்கு வரவில்லை என்பதை தெரிவிக்கவே இந்த அழைப்பு.",
        "ask_reason": "மாணவர் வகுப்பிற்கு வராததற்கான காரணத்தை தெரிவித்தால், கல்லூரிப் பதிவேட்டில் பதிவு செய்து கொள்வோம்.",
        "follow_up": "சரிங்க. இது குறித்து துறை ஆசிரியரிடம் தெரிவித்துவிட்டீர்களா?",
        "parent_follow_up": "இல்லை, இப்போதே பதிவேட்டில் குறித்துக்கொள்ளுங்கள்.",
        "closing": "தகவலுக்கு மிக்க நன்றி {salutation} {parent_name}. பதிவேடு புதுப்பிக்கப்பட்டது. நல்ல நாளாக அமையட்டும்.",
        "fallback_reason": "மாணவர் உடல்நிலை சரியில்லாததால் வரவில்லை என பெற்றோர் தெரிவித்தனர்.",
    },
    "te": {
        "name": "Telugu (తెలుగు)",
        "greetings": {
            "morning": "శుభోదయం",
            "afternoon": "శుభ మధ్యాహ్నం",
            "evening": "శుభ సాయంత్రం",
        },
        "intro": "{university_name} నుండి ఆటోమేటెడ్ AI అసిస్టెంట్ మాట్లాడుతున్నాను.",
        "verify_parent": "నేను {student_name} విద్యార్థి తల్లిదండ్రులు {salutation} {parent_name} గారితో మాట్లాడుతున్నానా?",
        "parent_confirm": "అవును, నేనే {parent_name} మాట్లాడుతున్నాను.",
        "parent_deny": "లేదు, ఇది రాంగ్ నంబర్.",
        "unverified_close": "క్షమించండి. భద్రతా కారణాల వల్ల వివరాలు నమోదు చేసుకున్న తల్లిదండ్రులకు మాత్రమే చెప్పబడతాయి. ధన్యవాదాలు.",
        "absence_notice": "ధన్యవాదాలు. {student_name} ఈరోజు ({date}) {time_slot} కు జరిగిన '{subject_name}' తరగతికి రాలేదని తెలియజేస్తున్నాము.",
        "ask_reason": "గైర్హాజరు కావడానికి గల కారణాన్ని దయచేసి తెలియజేస్తారా?",
        "follow_up": "అర్థమైంది. ఈ విషయాన్ని సంబంధిత ఫ్యాకల్టీకి తెలియజేయాలా?",
        "parent_follow_up": "అవును, కాలేజీ రికార్డులో నోట్ చేయండి.",
        "closing": "సమాచారానికి చాలా ధన్యవాదాలు {salutation} {parent_name} గారు. కాలేజ్ రికార్డులలో నమోదు చేయబడింది. శుభదినం.",
        "fallback_reason": "విద్యార్థి అనారోగ్యం కారణంగా రాలేకపోయారని తల్లిదండ్రులు తెలిపారు.",
    },
    "hi": {
        "name": "Hindi (हिन्दी)",
        "greetings": {
            "morning": "शुभ प्रभात",
            "afternoon": "शुभ दोपहर",
            "evening": "शुभ संध्या",
        },
        "intro": "{university_name} से स्वचालित AI सहायक बात कर रहा हूँ।",
        "verify_parent": "क्या मैं {student_name} के अभिभावक {salutation} {parent_name} जी से बात कर रहा हूँ?",
        "parent_confirm": "हाँ, मैं {parent_name} ही बात कर रहा हूँ।",
        "parent_deny": "नहीं, यह गलत नंबर है।",
        "unverified_close": "माफ़ कीजिए। गोपनीयता और सुरक्षा कारणों से जानकारी केवल अधिकृत अभिभावक से ही साझा की जा सकती है। धन्यवाद।",
        "absence_notice": "धन्यवाद। हम यह सूचित करने के लिए कॉल कर रहे हैं कि {student_name} आज ({date}) {time_slot} के '{subject_name}' व्याख्यान में अनुपस्थित रहे हैं।",
        "ask_reason": "कृपया अनुपस्थिति का कारण बताएं ताकि हम इसे कॉलेज रिकॉर्ड में दर्ज कर सकें।",
        "follow_up": "समझ गया। क्या इस बारे में कक्षा अध्यापक को सूचित किया गया है?",
        "parent_follow_up": "जी, कृपया उपस्थिति रिकॉर्ड में नोट कर लें।",
        "closing": "जानकारी के लिए बहुत धन्यवाद {salutation} {parent_name} जी। रिकॉर्ड में कारण दर्ज कर लिया गया है। आपका दिन शुभ हो।",
        "fallback_reason": "अभिभावक ने बताया कि तबीयत खराब होने के कारण छात्र कॉलेज नहीं आ सके।",
    },
    "ml": {
        "name": "Malayalam (മലയാളം)",
        "greetings": {
            "morning": "സുപ്രഭാതം",
            "afternoon": "ശുഭ ഉച്ചനേരം",
            "evening": "ശുഭ സന്ധ്യ",
        },
        "intro": "{university_name} കോളേജിൽ നിന്നുള്ള ഓട്ടோമേറ്റഡ് AI അസിസ്റ്റന്റാണ് സംസാരിക്കുന്നത്.",
        "verify_parent": "ഞാൻ {student_name}-ന്റെ രക്ഷിതാവായ {salutation} {parent_name}-നോടാണോ സംസാരിക്കുന്നത്?",
        "parent_confirm": "അതെ, ഞാൻ {parent_name} സംസാരിക്കുന്നു.",
        "parent_deny": "അല്ല, ഇത് തെറ്റായ നമ്പറാണ്.",
        "unverified_close": "ക്ഷമിക്കണം. വിദ്യാർത്ഥി വിവരങ്ങൾ രജിസ്റ്റർ ചെയ്ത രക്ഷിതാക്കൾക്ക് മാത്രമേ നൽകാനാവൂ. നന്ദി.",
        "absence_notice": "നന്ദി. {student_name} ഇന്ന് ({date}) {time_slot}-ൽ നടന്ന '{subject_name}' ക്ലാസ്സിൽ ഹാജരായിരുന്നില്ല എന്ന് അറിയിക്കാനാണ് വിളിച്ചത്.",
        "ask_reason": "ക്ലാസ്സിൽ വരാതിരിക്കാനുള്ള കാരണം ദയവായി വ്യക്തമാക്കാമോ?",
        "follow_up": "മനസ്സിലായി. ഇക്കാര്യം ക്ലാസ്സ് ടീച്ചറെ അറിയിച്ചിട്ടുണ്ടോ?",
        "parent_follow_up": "ഇല്ല, കോളേജ് രജിസ്റ്ററിൽ രേഖപ്പെടുത്തിക്കോളൂ.",
        "closing": "വിവരങ്ങൾക്ക് വളരെ നന്ദി {salutation} {parent_name}. അറ്റൻഡൻസ് റെക്കോർഡിൽ രേഖപ്പെടുത്തിയിട്ടുണ്ട്. ശുഭദിനം.",
        "fallback_reason": "പനി കാരണം കുട്ടിക്ക് ഇന്ന് ക്ലാസ്സിൽ വരാൻ കഴിഞ്ഞില്ല എന്ന് രക്ഷിതാവ് അറിയിച്ചു.",
    },
    "kn": {
        "name": "Kannada (ಕನ್ನಡ)",
        "greetings": {
            "morning": "ಶುಭೋದಯ",
            "afternoon": "ಶುಭ ಮಧ್ಯಾಹ್ನ",
            "evening": "ಶುಭ ಸಂಜೆ",
        },
        "intro": "{university_name} ಕಾಲೇಜಿನಿಂದ ಸ್ವಯಂಚಾಲಿತ AI ಸಹಾಯಕ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ.",
        "verify_parent": "ನಾನು {student_name} ಅವರ ಪೋಷಕರಾದ {salutation} {parent_name} ಅವರೊಂದಿಗೆ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆಯೇ?",
        "parent_confirm": "ಹೌದು, ನಾನೇ {parent_name} ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ.",
        "parent_deny": "ಇಲ್ಲ, ಇದು ತಪ್ಪಾದ ನಂಬರ್.",
        "unverified_close": "ಕ್ಷಮಿಸಿ. ವಿದ್ಯಾರ್ಥಿಯ ಸುರಕ್ಷತೆಗಾಗಿ ಮಾಹಿತಿಯನ್ನು ನೋಂದಾಯಿತ ಪೋಷಕರಿಗೆ ಮಾತ್ರ ಹಂಚಿಕೊಳ್ಳಬಹುದು. ಧನ್ಯವಾದಗಳು.",
        "absence_notice": "ಧನ್ಯವಾದಗಳು. {student_name} ಇಂದು ({date}) {time_slot} ನಡೆದ '{subject_name}' ತರಗತಿಗೆ ಗೈರುಹಾಜರಾಗಿದ್ದಾರೆ ಎಂದು ತಿಳಿಸಲು ಕರೆ ಮಾಡಲಾಗಿದೆ.",
        "ask_reason": "ಗೈರುಹಾಜರಿಗೆ ಕಾರಣವನ್ನು ದಯವಿಟ್ಟು ತಿಳಿಸುವಿರಾ?",
        "follow_up": "ತಿಳಿಯಿತು. ಈ ವಿಷಯವನ್ನು ತರಗತಿ ಶಿಕ್ಷಕರಿಗೆ ತಿಳಿಸಲಾಗಿದೆಯೇ?",
        "parent_follow_up": "ಹೌದು, ದಯವಿಟ್ಟು ಕಾಲೇಜು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ.",
        "closing": "ಮಾಹಿತಿಗಾಗಿ ಧನ್ಯವಾದಗಳು {salutation} {parent_name}. ಹಾಜರಾತಿ ದಾಖಲೆಯಲ್ಲಿ ನಮೂದಿಸಲಾಗಿದೆ. ದಿನ ಶುಭವಾಗಲಿ.",
        "fallback_reason": "ವಿದ್ಯಾರ್ಥಿಯು ಅನಾರೋಗ್ಯದ ಕಾರಣದಿಂದ ಬರಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ ಎಂದು ಪೋಷಕರು ತಿಳಿಸಿದ್ದಾರೆ.",
    },
}


def classify_parent_utterance(statement: str) -> str:
    """
    Deterministically classifies parent spoken explanation into standardized absence categories:
    - Medical / Sick
    - Family Emergency
    - Transportation
    - Personal / Domestic
    - Unaware of Absence
    - Other
    """
    text = statement.lower()

    if any(k in text for k in ["fever", "sick", "doctor", "hospital", "clinic", "ill", "headache", "surgery", "medical", "stomach", "medicine", "உடல்நிலை", "காய்ச்சல்", "மருத்துவமனை", "జ్వరం", "డాక్టర్", "बीमार", "बुखार", "പനി", "ഡോക്ടർ", "ಜ್ವರ"]):
        return "Medical / Sick"

    if any(k in text for k in ["emergency", "hospitalized", "accident", "urgent", "funeral", "mishap", "அவசரம்", "விபத்து", "హాస్పిటల్", "ఎమర్జెన్సీ", "दुर्घटना", "ആശുപത്രി", "ತುರ್ತು"]):
        return "Family Emergency"

    if any(k in text for k in ["bus", "train", "traffic", "puncture", "breakdown", "transport", "commute", "பஸ்", "போக்குவரத்து", "ట్రాఫిక్", "बस", "वाहन", "ഗതാഗതം", "ಬಸ್"]):
        return "Transportation"

    if any(k in text for k in ["not aware", "unaware", "did not know", "went to college", "left for college", "left morning", "தெரியாது", "காலேஜ் போனான்", "తెలియదు", "కాలేజీకి వెళ్ళాడు", "पता नहीं", "कॉलेज गया", "അറിയില്ല", "ಗೊತ್ತಿಲ್ಲ"]):
        return "Unaware of Absence"

    if any(k in text for k in ["function", "marriage", "wedding", "temple", "native", "village", "hometown", "travel", "out of town", "திருமணம்", "ஊருக்கு", "ఊరికి", "పెళ్లి", "शादी", "गाँव", "വിവാഹം", "ಊರಿಗೆ"]):
        return "Personal / Domestic"

    return "Other Reason"


class MockSpeechAdapter(SpeechAdapter):
    """Testing & simulation conversational AI adapter."""

    async def text_to_speech(self, text: str, language_code: str) -> Optional[bytes]:
        return b""  # Simulated TTS audio payload

    async def speech_to_text(self, audio_bytes: bytes, language_code: str) -> str:
        return "Simulated transcription"

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
        """
        Executes multi-turn conversation and records dialogue transcript.
        Never fabricates random choices without checking input.
        """
        lang = preferred_language if preferred_language in LANGUAGE_TEMPLATES else "en"
        cfg = LANGUAGE_TEMPLATES[lang]

        hour = datetime.now().hour
        greeting_key = "morning" if hour < 12 else ("afternoon" if hour < 17 else "evening")
        greeting_word = cfg["greetings"][greeting_key]

        params = {
            "university_name": university_name,
            "student_name": student_name,
            "parent_name": parent_name,
            "salutation": form_of_address or "Mr.",
            "subject_name": subject_name,
            "date": session_date,
            "time_slot": session_slot,
        }

        # Stage 1: Greeting & Intro
        turns = [
            {
                "speaker": "AI Voice Assistant",
                "text": f"{greeting_word}, {params['salutation']} {parent_name}. {cfg['intro'].format(**params)}",
                "timestamp": "00:03",
            },
            {
                "speaker": "AI Voice Assistant",
                "text": cfg["verify_parent"].format(**params),
                "timestamp": "00:07",
            },
        ]

        # Stage 2: Parent Verification Check
        if not parent_verified:
            turns.append({
                "speaker": "Recipient",
                "text": cfg["parent_deny"],
                "timestamp": "00:11",
            })
            turns.append({
                "speaker": "AI Voice Assistant",
                "text": cfg["unverified_close"],
                "timestamp": "00:16",
            })
            return {
                "language": lang,
                "language_name": cfg["name"],
                "parent_verified": False,
                "call_status": "unverified_parent",
                "duration_seconds": 18,
                "reason_category": "Unverified Recipient",
                "parent_statement": "Recipient indicated they are not the authorized guardian.",
                "dialogue_turns": turns,
                "dialogue_transcript_json": json.dumps(turns, ensure_ascii=False),
            }

        turns.append({
            "speaker": "Parent",
            "text": cfg["parent_confirm"].format(**params),
            "timestamp": "00:12",
        })

        # Stage 3: Absence Notification
        turns.append({
            "speaker": "AI Voice Assistant",
            "text": cfg["absence_notice"].format(**params),
            "timestamp": "00:20",
        })

        # Stage 4: Ask for Absence Reason
        turns.append({
            "speaker": "AI Voice Assistant",
            "text": cfg["ask_reason"],
            "timestamp": "00:27",
        })

        # Stage 5: Parent Response Processing
        statement = parent_provided_reason or cfg["fallback_reason"]
        category = classify_parent_utterance(statement)

        turns.append({
            "speaker": "Parent",
            "text": statement,
            "timestamp": "00:36",
        })

        # Stage 6: Follow-up / Clarification
        turns.append({
            "speaker": "AI Voice Assistant",
            "text": cfg["follow_up"],
            "timestamp": "00:44",
        })
        turns.append({
            "speaker": "Parent",
            "text": cfg["parent_follow_up"],
            "timestamp": "00:48",
        })

        # Stage 7: Polite Closing
        turns.append({
            "speaker": "AI Voice Assistant",
            "text": cfg["closing"].format(**params),
            "timestamp": "00:54",
        })

        return {
            "language": lang,
            "language_name": cfg["name"],
            "parent_verified": True,
            "call_status": "completed",
            "duration_seconds": 56,
            "reason_category": category,
            "parent_statement": statement,
            "dialogue_turns": turns,
            "dialogue_transcript_json": json.dumps(turns, ensure_ascii=False),
        }
