/**
 * CampusAI / SmartAttend AI - Institutional Landing Page
 * 
 * Features:
 * - Prominent top-right "Sign Up" button in navigation bar
 * - Prominent "Sign Up Your University" button in main hero section
 * - Seamless page navigation to University Registration (/register) and Login (/login)
 * - Modern, clean navy-blue and white responsive design
 * - Multi-lingual AI speech showcase (6 Indian languages)
 * - Enterprise security and parent calling workflow presentation
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { APP_NAME, COLLEGE_CONFIG } from '../config';
import { LANGUAGES_LIST } from '../utils/mockData';
import Modal from '../components/common/Modal';
import {
  HiOutlineAcademicCap,
  HiOutlinePhone,
  HiOutlineLanguage,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineBuildingLibrary,
  HiOutlineCheckCircle,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineCheck,
} from 'react-icons/hi2';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState(LANGUAGES_LIST[1]); // Tamil by default
  const [modalType, setModalType] = useState(null);

  const sampleVoiceDialogues = {
    ta: {
      lang: 'Tamil (தமிழ்)',
      aiGreeting: 'வணக்கம் ஐயா. நான் ஏபிசி கல்லூரியின் தானியங்கி AI உதவியாளர். மாணவர் கார்த்திக் அவர்களின் பெற்றோரிடம் பேசலாமா?',
      parentReply: 'ஆமாம், நான் தான் கார்த்திக்கின் தந்தை பேசுகிறேன்.',
      aiAbsence: 'இன்று காலை 9:00 மணிக்கு நடைபெற்ற வகுப்பில் கார்த்திக் வரவில்லை என்பதை தெரிவிக்கவே இந்த அழைப்பு. காரணத்தை அறியலாமா?',
      parentReason: 'அவனுக்கு காய்ச்சல் இருப்பதால் மருத்துவமனைக்கு சென்றுள்ளோம்.',
      aiClosing: 'நன்றி ஐயா. உங்கள் பதிலை நாங்கள் பதிவு செய்துள்ளோம். கார்த்திக் விரைவில் நலம்பெற விரும்புகிறோம்.',
    },
    en: {
      lang: 'English',
      aiGreeting: 'Good morning. I am the automated AI assistant of ABC College. May I speak with the registered guardian of Karthik?',
      parentReply: 'Yes, speaking. I am Karthik\'s father.',
      aiAbsence: 'I am calling to inform you that Karthik was marked absent for Distributed Systems at 09:00 AM. May I know the reason?',
      parentReason: 'He has high fever and is resting under medical observation.',
      aiClosing: 'Thank you for informing us. I have recorded your response into official college records. Have a good day.',
    },
    te: {
      lang: 'Telugu (తెలుగు)',
      aiGreeting: 'నమస్కారం అండి. నేను కాలేజీ యొక్క ఆటోమేటెడ్ AI అసిస్టెంట్ ని. విద్యార్థి కార్తీక్ తల్లిదండ్రులతో మాట్లాడవచ్చా?',
      parentReply: 'అవునండి, నేను కార్తీక్ తండ్రిని మాట్లాడుతున్నాను.',
      aiAbsence: 'ఈరోజు ఉదయం 9:00 గంటల క్లాస్ కి కార్తీక్ హాజరుకాలేదని తెలియజేస్తున్నాము. కారణం తెలుసుకోవచ్చా?',
      parentReason: 'జ్వరం ఉండటం వల్ల హాస్పిటల్ కి వెళ్ళాము.',
      aiClosing: 'ధన్యవాదాలు అండి. మీ సమాధానం నమోదు చేయబడింది. సెలవు.',
    },
    hi: {
      lang: 'Hindi (हिन्दी)',
      aiGreeting: 'नमस्ते जी। मैं कॉलेज का ऑटोमेटेड एआई असिस्टेंट बोल रहा हूँ। क्या मैं कार्तिक के अभिभावक से बात कर सकता हूँ?',
      parentReply: 'हाँ, मैं कार्तिक के पिता बात कर रहा हूँ।',
      aiAbsence: 'आज सुबह 9:00 बजे की कक्षा में कार्तिक अनुपस्थित थे। क्या आप अनुपस्थिति का कारण बता सकते हैं?',
      parentReason: 'उसे सुबह से तेज बुखार है, इसलिए डॉक्टर के पास गए हैं।',
      aiClosing: 'धन्यवाद जी। हमने आपकी जानकारी कॉलेज रिकॉर्ड में दर्ज कर ली है। आपका दिन शुभ हो।',
    },
    ml: {
      lang: 'Malayalam (മലയാളം)',
      aiGreeting: 'നമസ്കാരം. ഞാൻ കോളേജിൻ്റെ ഓട്ടോമേറ്റഡ് എഐ അസിസ്റ്റന്റാണ്. കാർത്തിക്കിന്റെ രക്ഷിതാവിനോട് സംസാരിക്കാമോ?',
      parentReply: 'അതെ, ഞാൻ കാർത്തിക്കിന്റെ അച്ഛനാണ് സംസാരിക്കുന്നത്.',
      aiAbsence: 'ഇന്ന് രാവിലെയുള്ള ക്ലാസിൽ കാർത്തിക് പങ്കെടുത്തില്ല എന്ന് അറിയിക്കാൻ വിളിച്ചതാണ്. കാരണം അറിയാമോ?',
      parentReason: 'പനിയായതുകൊണ്ട് ഇന്ന് ഡോക്ടറെ കാണാൻ പോയിരിക്കുകയാണ്.',
      aiClosing: 'ശരി സാർ, താങ്കൾ നൽകിയ കാരണം ഞങ്ങൾ രേഖപ്പെടുത്തിയിട്ടുണ്ട്. നന്ദി, ശുഭദിനം.',
    },
    kn: {
      lang: 'Kannada (ಕನ್ನಡ)',
      aiGreeting: 'ನಮಸ್ಕಾರ. ನಾನು ಕಾಲೇಜಿನ ಸ್ವಯಂಚಾಲಿತ AI ಸಹಾಯಕ. ಕಾರ್ತಿಕ್ ಅವರ ಪೋಷಕರೊಂದಿಗೆ ಮಾತನಾಡಬಹುದೇ?',
      parentReply: 'ಹೌದು, ನಾನು ಕಾರ್ತಿಕ್ ತಂದೆ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ.',
      aiAbsence: 'ಇಂದು ಬೆಳಗಿನ ತರಗತಿಗೆ ಕಾರ್ತಿಕ್ ಗೈರುಹಾಜರಾಗಿದ್ದಾರೆ ಎಂದು ತಿಳಿಸಲು ಕರೆ ಮಾಡಲಾಗಿದೆ. ಕಾರಣ ತಿಳಿಯಬಹುದೇ?',
      parentReason: 'ಜ್ವರ ಇರುವುದರಿಂದ ವಿಶ್ರಾಂತಿ ಪಡೆಯುತ್ತಿದ್ದಾರೆ.',
      aiClosing: 'ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ. ಒಳ್ಳೆಯ ದಿನವಾಗಲಿ.',
    },
  };

  const currentDialogue = sampleVoiceDialogues[activeLangTab.code] || sampleVoiceDialogues.en;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* ========================================================
          1. NAVIGATION BAR WITH PROMINENT SIGN UP BUTTON
          ======================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <HiOutlineAcademicCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                CampusAI
                <span className="text-[11px] font-extrabold uppercase bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full border border-primary-200">
                  SmartAttend
                </span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Autonomous College Attendance Platform</p>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-primary-600 transition-colors">
              Platform Features
            </a>
            <a href="#voice-ai" className="hover:text-primary-600 transition-colors">
              6-Language Voice AI
            </a>
            <a href="#workflow" className="hover:text-primary-600 transition-colors">
              Calling Workflow
            </a>
            <a href="#security" className="hover:text-primary-600 transition-colors">
              Governance & Security
            </a>
          </nav>

          {/* Top-Right Action Buttons: Login + Prominent Sign Up */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-primary-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Institutional Login
            </button>

            {/* Prominent Sign Up Button */}
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-primary-500/25 hover:shadow-primary-600/35 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <span>Sign Up University</span>
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
          >
            {mobileMenuOpen ? <HiOutlineXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-slate-700 py-1.5"
            >
              Platform Features
            </a>
            <a
              href="#voice-ai"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-slate-700 py-1.5"
            >
              6-Language Voice AI
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-slate-700 py-1.5"
            >
              Calling Workflow
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full py-2.5 text-xs font-bold text-slate-800 bg-slate-100 rounded-xl"
              >
                Institutional Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/register');
                }}
                className="w-full py-2.5 text-xs font-extrabold text-white bg-primary-500 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <span>Sign Up University</span>
                <HiOutlineArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================
          2. HERO SECTION WITH PROMINENT SIGN UP CTA
          ======================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-700 to-primary-900 text-white pt-16 pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8">
        {/* Decorative backdrop shapes */}
        <div className="absolute -top-40 -right-40 w-96 sm:w-[32rem] h-96 sm:h-[32rem] bg-accent-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 sm:w-[32rem] h-96 sm:h-[32rem] bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6 sm:space-y-8">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-primary-100">
            <HiOutlineSparkles className="w-4 h-4 text-amber-300" />
            <span>CampusAI 2.0 • Autonomous College Attendance & Voice Outreach</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
            AI-Powered Attendance Monitoring & Automated Parent Calling System
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-lg text-primary-100 max-w-3xl mx-auto leading-relaxed">
            Faculty marks attendance in seconds. When students are absent, our autonomous AI voice agent calls parents in their preferred native language, verifies authorization, explains the absence, and captures the reason into college records.
          </p>

          {/* Hero Action Buttons (Prominent Sign Up + Login) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Prominent Hero Sign Up Button */}
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-accent-500/30 hover:shadow-accent-500/50 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>Sign Up Your University</span>
              <HiOutlineArrowRight className="w-5 h-5" />
            </button>

            {/* Secondary Login Button */}
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-7 py-4 bg-white/15 hover:bg-white/25 text-white font-bold text-sm sm:text-base rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In to College Portal</span>
            </button>
          </div>

          {/* Trust Metrics / Badges */}
          <div className="pt-8 sm:pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-2xl font-black text-white">6 Languages</span>
              <p className="text-xs text-primary-200 mt-0.5">Tamil, Telugu, Hindi, Malayalam, Kannada & English</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-2xl font-black text-white">Zero False Calls</span>
              <p className="text-xs text-primary-200 mt-0.5">Draft protection + duplicate call suppression</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-2xl font-black text-white">Privacy Verified</span>
              <p className="text-xs text-primary-200 mt-0.5">Guardian verified before disclosing student data</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-2xl font-black text-white">4 Dashboards</span>
              <p className="text-xs text-primary-200 mt-0.5">Admin, Faculty, Student, and Parent Portals</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. MULTI-LINGUAL VOICE AI DIALOGUE DEMO
          ======================================================== */}
      <section id="voice-ai" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Powered by Sarvam AI & Advanced NLU
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Natural Voice Conversations in 6 Indian Languages
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Parents select their preferred language in their profile. The AI voice agent speaks naturally, greets based on local time, answers from verified college records only, and saves absence reasons.
            </p>
          </div>

          {/* Language Selector Pills */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8">
            {LANGUAGES_LIST.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setActiveLangTab(lang)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  activeLangTab.code === lang.code
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                <span className="text-[11px] opacity-75 font-normal">({lang.native})</span>
              </button>
            ))}
          </div>

          {/* Interactive Voice Dialogue Preview Box */}
          <div className="max-w-3xl mx-auto bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
                  <HiOutlinePhone className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Live Voice Agent Sample Flow</h4>
                  <span className="text-[11px] text-slate-500">Language: {currentDialogue.lang}</span>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                Guardian Verified
              </span>
            </div>

            {/* Conversation Bubbles */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Turn 1: AI Greeting & Authorization Check */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  AI
                </div>
                <div className="max-w-[85%] bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-primary-600 block mb-1">
                    AI Assistant (Time-Aware Greeting & Guardian Verification)
                  </span>
                  <p className="text-slate-800 leading-relaxed">{currentDialogue.aiGreeting}</p>
                </div>
              </div>

              {/* Turn 2: Parent Reply */}
              <div className="flex gap-3 justify-end">
                <div className="max-w-[85%] bg-primary-500 text-white p-3.5 rounded-2xl rounded-tr-none shadow-xs">
                  <span className="text-[10px] font-bold text-primary-100 block mb-1">
                    Parent (Voice Response)
                  </span>
                  <p className="leading-relaxed">{currentDialogue.parentReply}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  P
                </div>
              </div>

              {/* Turn 3: AI Informs Absence & Asks Reason */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  AI
                </div>
                <div className="max-w-[85%] bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-primary-600 block mb-1">
                    AI Assistant (Accurate Course, Date & Time Details)
                  </span>
                  <p className="text-slate-800 leading-relaxed">{currentDialogue.aiAbsence}</p>
                </div>
              </div>

              {/* Turn 4: Parent Gives Reason */}
              <div className="flex gap-3 justify-end">
                <div className="max-w-[85%] bg-primary-500 text-white p-3.5 rounded-2xl rounded-tr-none shadow-xs">
                  <span className="text-[10px] font-bold text-primary-100 block mb-1">
                    Parent (Stated Reason)
                  </span>
                  <p className="leading-relaxed">{currentDialogue.parentReason}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  P
                </div>
              </div>

              {/* Turn 5: AI Closing */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  AI
                </div>
                <div className="max-w-[85%] bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-primary-600 block mb-1">
                    AI Assistant (Polite Closing & Reason Recorded)
                  </span>
                  <p className="text-slate-800 leading-relaxed">{currentDialogue.aiClosing}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. HOW IT WORKS / CALLING WORKFLOW
          ======================================================== */}
      <section id="workflow" className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Rigorous 7-Step Absence & Telephony Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Engineered with strict compliance guardrails to eliminate false alarms and guarantee student data privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm mb-4">
                  01
                </div>
                <h4 className="font-bold text-base text-slate-900 mb-2">Faculty Marks & Saves Draft</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Faculty marks present, absent, or late. While attendance is in draft mode, no phone calls are ever initiated.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 mt-4 block">Zero False Calls</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm mb-4">
                  02
                </div>
                <h4 className="font-bold text-base text-slate-900 mb-2">Finalization & Verification Check</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upon finalization, the system checks: Is parent phone verified? Is calling consent granted? Has a call already been made?
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 mt-4 block">Regulatory Compliance</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm mb-4">
                  03
                </div>
                <h4 className="font-bold text-base text-slate-900 mb-2">AI Call & Reason Capture</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The AI voice agent connects in the parent's preferred language, records their response into official college archives, and logs transcripts.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 mt-4 block">Transcript Archival</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. CALL TO ACTION BANNER (SIGN UP PROMPT)
          ======================================================== */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-primary-500 via-primary-700 to-primary-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto text-white backdrop-blur-md">
            <HiOutlineBuildingLibrary className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Modernize Your University's Attendance System?
          </h2>

          <p className="text-xs sm:text-base text-primary-100 max-w-2xl mx-auto leading-relaxed">
            Register your institution today. Set up departments, faculty, subjects, and enable multi-lingual AI parent voice notifications.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Direct Sign Up Button */}
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-3.5 bg-accent-500 hover:bg-accent-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-accent-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign Up Your University</span>
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              <span>Already Registered? Log In</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. FOOTER
          ======================================================== */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-500 text-white flex items-center justify-center font-bold">
              <HiOutlineAcademicCap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">CampusAI • SmartAttend AI</p>
              <p className="text-[11px] text-slate-500">Enterprise College Attendance Governance Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <button
              onClick={() => navigate('/register')}
              className="text-white hover:text-accent-400 transition-colors font-bold"
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-slate-300 hover:text-white transition-colors"
            >
              Institutional Login
            </button>
            <button
              onClick={() => setModalType('privacy')}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setModalType('terms')}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <Modal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={modalType === 'privacy' ? 'Privacy Policy & Student Data Governance' : 'Terms of Service'}
        subtitle="CampusAI Institutional Standards"
      >
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-72 overflow-y-auto">
          <p>
            CampusAI enforces zero-leakage student record handling. Automated calls are placed strictly upon finalized faculty attendance, and caller identity is verified prior to disclosing absence events.
          </p>
          <p>
            Parent preferred language and forms of address are explicitly recorded and respected across all 6 supported Indian languages.
          </p>
        </div>
      </Modal>
    </div>
  );
}
