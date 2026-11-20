/**
 * CampusAI / SmartAttend AI - Institutional Landing Page
 *
 * Features:
 * - Portals nav item with dropdown to Portals section
 * - Four portal cards (Admin, Faculty, Student, Parent)
 * - About CampusAI section
 * - How It Works step-by-step workflow
 * - Existing Hero, Voice AI, Security, Footer all preserved
 */

import { useState, useRef, useEffect } from 'react';
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
  HiOutlineChevronDown,
  HiOutlineComputerDesktop,
  HiOutlineUsers,
  HiOutlineIdentification,
  HiOutlineHome,
  HiOutlineCog6Tooth,
  HiOutlineArrowUpRight,
  HiOutlineArrowDown,
  HiOutlineLockClosed,
  HiOutlineGlobeAlt,
  HiOutlineCircleStack,
} from 'react-icons/hi2';

// ============================================================
// PORTAL DATA
// ============================================================
const PORTALS = [
  {
    id: 'admin',
    title: 'Admin Portal',
    subtitle: 'Dean / Academic Head',
    shortDesc: 'Complete institutional control — manage faculty, students, departments, attendance data, and AI calling dashboards from one place.',
    icon: HiOutlineComputerDesktop,
    color: 'primary',
    gradient: 'from-blue-600 to-primary-700',
    bgLight: 'bg-blue-50',
    textAccent: 'text-blue-700',
    borderAccent: 'border-blue-200',
    loginRole: 'admin',
    loginPath: '/login?role=admin',
    features: [
      'College and institutional management',
      'Faculty account management',
      'Student database upload via CSV / Excel',
      'Department, year, semester & section management',
      'Subject management',
      'Attendance monitoring across departments',
      'AI parent-call monitoring dashboard',
      'Attendance analytics & insights',
      'Reports and institutional settings',
      'Parent contact and consent management',
    ],
  },
  {
    id: 'faculty',
    title: 'Faculty Portal',
    subtitle: 'Faculty Member',
    shortDesc: 'Mark attendance in seconds, finalize records, and let the AI automatically notify parents of absent students.',
    icon: HiOutlineIdentification,
    color: 'purple',
    gradient: 'from-purple-600 to-violet-700',
    bgLight: 'bg-purple-50',
    textAccent: 'text-purple-700',
    borderAccent: 'border-purple-200',
    loginRole: 'faculty',
    loginPath: '/login?role=faculty',
    features: [
      'View assigned classes by department & section',
      'Select department, year, semester and section',
      'Select subject from curriculum catalog',
      'Mark attendance (Present / Absent / Late)',
      'Save attendance drafts safely',
      'Finalize attendance to trigger AI calling',
      'Automatically identify absent students',
      'Monitor parent-call outcomes in real time',
      'Review absence reasons captured by AI',
      'View attendance history and session logs',
    ],
  },
  {
    id: 'student',
    title: 'Student Portal',
    subtitle: 'Student',
    shortDesc: 'Track your attendance percentage, subject-wise records and notifications from your personal academic dashboard.',
    icon: HiOutlineUsers,
    color: 'emerald',
    gradient: 'from-emerald-600 to-teal-700',
    bgLight: 'bg-emerald-50',
    textAccent: 'text-emerald-700',
    borderAccent: 'border-emerald-200',
    loginRole: 'student',
    loginPath: '/login?role=student',
    features: [
      'Personal attendance dashboard',
      'Overall attendance percentage',
      'Subject-wise attendance breakdown',
      'Attendance history by date and subject',
      'Present and absent record timeline',
      'Academic attendance progress tracking',
      'Notifications for low attendance alerts',
    ],
  },
  {
    id: 'parent',
    title: 'Parent Portal',
    subtitle: 'Parent / Guardian',
    shortDesc: 'Stay informed about your child\'s attendance, review AI-call records, manage communication preferences and consent.',
    icon: HiOutlineHome,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    textAccent: 'text-amber-700',
    borderAccent: 'border-amber-200',
    loginRole: 'parent',
    loginPath: '/login?role=parent',
    features: [
      'Child attendance overview',
      'Absence notifications',
      'AI calling history & transcripts',
      'Recorded absence reasons',
      'Contact information management',
      'Communication preferences and consent settings',
    ],
  },
];

// ============================================================
// ABOUT FEATURES
// ============================================================
const ABOUT_FEATURES = [
  {
    icon: HiOutlineCheckCircle,
    title: 'Smart Attendance Management',
    desc: 'Faculty mark attendance digitally. Drafts protect against accidental early submissions. Session finalization locks records.',
  },
  {
    icon: HiOutlinePhone,
    title: 'AI-Powered Parent Calling',
    desc: 'On attendance finalization, the AI automatically queues and places calls to parents of absent students — no manual effort required.',
  },
  {
    icon: HiOutlineLanguage,
    title: 'Six-Language Voice Communication',
    desc: 'Conversations in Tamil, Telugu, Hindi, Malayalam, Kannada and English. Parents hear their preferred native language.',
  },
  {
    icon: HiOutlineCircleStack,
    title: 'College-Wise Database Management',
    desc: 'Every college\'s student records, attendance sessions, subjects and call logs are strictly isolated. No data leakage between institutions.',
  },
  {
    icon: HiOutlineChartBar,
    title: 'Attendance Reports & Analytics',
    desc: 'Administrators view attendance trends, department-wise summaries, low-attendance alerts, and downloadable reports.',
  },
  {
    icon: HiOutlineLockClosed,
    title: 'Secure Role-Based Access',
    desc: 'Admin, Faculty, Student and Parent roles each see only their authorized data. JWT-secured APIs and verified parent identity before disclosure.',
  },
];

// ============================================================
// HOW IT WORKS STEPS
// ============================================================
const WORKFLOW_STEPS = [
  { step: 1, title: 'College Registration', desc: 'University admin registers the institution, verifies college credentials, and sets up the platform.', badge: null },
  { step: 2, title: 'Student Database Upload', desc: 'Upload student records via CSV or Excel. Parent phone numbers and consent are recorded per student.', badge: null },
  { step: 3, title: 'Faculty Marks Attendance', desc: 'Faculty selects class parameters, marks each student Present / Absent / Late, and saves a draft.', badge: null },
  { step: 4, title: 'Absent Students Identified', desc: 'On finalization, the system identifies all absent students and cross-checks their consent and phone status.', badge: null },
  { step: 5, title: 'Parent Consent & Contact Validation', desc: 'Only students whose parents have granted calling consent and have verified phone numbers proceed to the call queue.', badge: 'TRAI Compliant' },
  { step: 6, title: 'AI Calling Queue', desc: 'Background queue dispatches call jobs. Idempotency keys prevent duplicate calls for the same session.', badge: 'Simulation Mode Available' },
  { step: 7, title: 'Automated Parent Communication', desc: 'AI voice agent calls parent in their preferred language, verifies identity, informs of absence, and captures reason.', badge: 'Simulation Mode' },
  { step: 8, title: 'Call Results Saved', desc: 'Transcript, absence reason category, duration and call status are saved to the college database.', badge: null },
  { step: 9, title: 'Administrator Dashboard', desc: 'Admin reviews call logs, analytics, reason categories, retry failed calls, and exports attendance reports.', badge: null },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalsDropdownOpen, setPortalsDropdownOpen] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState(LANGUAGES_LIST[1]);
  const [modalType, setModalType] = useState(null);
  const [expandedPortal, setExpandedPortal] = useState(null);
  const portalsRef = useRef(null);
  const dropdownRef = useRef(null);

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
      parentReply: "Yes, speaking. I am Karthik's father.",
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

  // Close portals dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPortalsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function scrollToPortals() {
    setPortalsDropdownOpen(false);
    setMobileMenuOpen(false);
    portalsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const colorMap = {
    primary: { ring: 'ring-blue-200', iconBg: 'bg-blue-100', iconText: 'text-blue-700', badgeBg: 'bg-blue-50', badgeText: 'text-blue-700', badgeBorder: 'border-blue-200', btnBg: 'bg-blue-600 hover:bg-blue-700', featureDot: 'bg-blue-500' },
    purple: { ring: 'ring-purple-200', iconBg: 'bg-purple-100', iconText: 'text-purple-700', badgeBg: 'bg-purple-50', badgeText: 'text-purple-700', badgeBorder: 'border-purple-200', btnBg: 'bg-purple-600 hover:bg-purple-700', featureDot: 'bg-purple-500' },
    emerald: { ring: 'ring-emerald-200', iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700', badgeBorder: 'border-emerald-200', btnBg: 'bg-emerald-600 hover:bg-emerald-700', featureDot: 'bg-emerald-500' },
    amber: { ring: 'ring-amber-200', iconBg: 'bg-amber-100', iconText: 'text-amber-700', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', badgeBorder: 'border-amber-200', btnBg: 'bg-amber-500 hover:bg-amber-600', featureDot: 'bg-amber-500' },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">

      {/* ========================================================
          1. NAVIGATION BAR
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
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600">

            {/* Portals Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setPortalsDropdownOpen(!portalsDropdownOpen)}
                className="flex items-center gap-1 hover:text-primary-600 transition-colors"
              >
                Portals
                <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${portalsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {portalsDropdownOpen && (
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-72 bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-3 z-50">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-2 pb-2">Select Portal</p>
                  {PORTALS.map((p) => {
                    const Icon = p.icon;
                    const c = colorMap[p.color];
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPortalsDropdownOpen(false);
                          navigate(p.loginPath);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                      >
                        <div className={`w-8 h-8 rounded-lg ${c.iconBg} ${c.iconText} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{p.title}</p>
                          <p className="text-[10px] text-slate-500">{p.subtitle}</p>
                        </div>
                        <HiOutlineArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-600 transition-colors" />
                      </button>
                    );
                  })}
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <button
                      onClick={scrollToPortals}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 py-1.5"
                    >
                      View All Portals
                      <HiOutlineArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <a href="#voice-ai" className="hover:text-primary-600 transition-colors">6-Language Voice AI</a>
            <a href="#how-it-works" className="hover:text-primary-600 transition-colors">Calling Workflow</a>
            <a href="#security" className="hover:text-primary-600 transition-colors">Governance & Security</a>
          </nav>

          {/* Top-Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-primary-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Institutional Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-primary-500/25 hover:shadow-primary-600/35 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <span>Sign Up University</span>
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger */}
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
            <button
              onClick={scrollToPortals}
              className="block w-full text-left text-xs font-bold text-slate-700 py-1.5"
            >
              Portals ↓
            </button>
            <a href="#voice-ai" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-bold text-slate-700 py-1.5">
              6-Language Voice AI
            </a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-bold text-slate-700 py-1.5">
              Calling Workflow
            </a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-bold text-slate-700 py-1.5">
              About CampusAI
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full py-2.5 text-xs font-bold text-slate-800 bg-slate-100 rounded-xl"
              >
                Institutional Login
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/register'); }}
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
          2. HERO SECTION (PRESERVED)
          ======================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-700 to-primary-900 text-white pt-16 pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute -top-40 -right-40 w-96 sm:w-[32rem] h-96 sm:h-[32rem] bg-accent-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 sm:w-[32rem] h-96 sm:h-[32rem] bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-primary-100">
            <HiOutlineSparkles className="w-4 h-4 text-amber-300" />
            <span>CampusAI 2.0 • Autonomous College Attendance & Voice Outreach</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
            AI-Powered Attendance Monitoring & Automated Parent Calling System
          </h1>

          <p className="text-sm sm:text-lg text-primary-100 max-w-3xl mx-auto leading-relaxed">
            Faculty marks attendance in seconds. When students are absent, our autonomous AI voice agent calls parents in their preferred native language, verifies authorization, explains the absence, and captures the reason into college records.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-accent-500/30 hover:shadow-accent-500/50 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>Sign Up Your University</span>
              <HiOutlineArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-7 py-4 bg-white/15 hover:bg-white/25 text-white font-bold text-sm sm:text-base rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In to College Portal</span>
            </button>
          </div>

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
              <span className="text-2xl font-black text-white">4 Portals</span>
              <p className="text-xs text-primary-200 mt-0.5">Admin, Faculty, Student, and Parent Portals</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. PORTALS SECTION
          ======================================================== */}
      <section id="portals" ref={portalsRef} className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Role-Based Access
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Explore CampusAI Portals
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              One intelligent platform connecting college administrators, faculty, students and parents through automated attendance management and AI-powered communication.
            </p>
          </div>

          {/* Portal Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              const c = colorMap[portal.color];
              const isExpanded = expandedPortal === portal.id;

              return (
                <div
                  key={portal.id}
                  className={`relative group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${isExpanded ? 'ring-2 ' + c.ring : ''}`}
                >
                  {/* Card Gradient Bar */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${portal.gradient}`} />

                  <div className="p-6 flex flex-col flex-1">
                    {/* Icon + Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl ${c.iconBg} ${c.iconText} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${c.badgeBg} ${c.badgeText} border ${c.badgeBorder}`}>
                        {portal.subtitle}
                      </span>
                    </div>

                    {/* Title & Short Desc */}
                    <h3 className="text-base font-black text-slate-900 mb-2">{portal.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{portal.shortDesc}</p>

                    {/* Feature List (always show first 4, expand for all) */}
                    <ul className="space-y-1.5 mb-5">
                      {portal.features.slice(0, isExpanded ? portal.features.length : 4).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className={`w-1.5 h-1.5 rounded-full ${c.featureDot} mt-1.5 shrink-0`} />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Learn More Toggle */}
                    {portal.features.length > 4 && (
                      <button
                        onClick={() => setExpandedPortal(isExpanded ? null : portal.id)}
                        className={`text-xs font-bold mb-4 flex items-center gap-1 ${portal.textAccent}`}
                      >
                        {isExpanded ? 'Show less' : `+${portal.features.length - 4} more features`}
                        <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    <div className="mt-auto space-y-2">
                      {/* Access Portal Button */}
                      <button
                        onClick={() => navigate(portal.loginPath)}
                        className={`w-full py-2.5 text-xs font-extrabold text-white rounded-xl ${c.btnBg} transition-all shadow-sm flex items-center justify-center gap-2`}
                      >
                        Access {portal.title}
                        <HiOutlineArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Register CTA below cards */}
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500 mb-4">Don't have a university account yet?</p>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white text-sm font-extrabold rounded-xl shadow-md shadow-primary-500/20 transition-all hover:-translate-y-0.5"
            >
              Register Your University
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. ABOUT CAMPUSAI SECTION
          ======================================================== */}
      <section id="about" className="py-20 sm:py-28 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Platform Overview
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              About CampusAI
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              CampusAI is an intelligent college attendance and parent communication platform. It automates the entire absence notification pipeline — from faculty marking attendance to AI calling parents in their native language and saving results into the college database.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ABOUT_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 mb-1.5">{feat.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          5. MULTI-LINGUAL VOICE AI DIALOGUE DEMO (PRESERVED)
          ======================================================== */}
      <section id="voice-ai" className="py-16 sm:py-24 bg-white border-t border-slate-200">
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

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold text-xs shrink-0">AI</div>
                <div className="max-w-[85%] bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-primary-600 block mb-1">AI Assistant (Time-Aware Greeting & Guardian Verification)</span>
                  <p className="text-slate-800 leading-relaxed">{currentDialogue.aiGreeting}</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <div className="max-w-[85%] bg-primary-500 text-white p-3.5 rounded-2xl rounded-tr-none shadow-xs">
                  <span className="text-[10px] font-bold text-primary-100 block mb-1">Parent (Voice Response)</span>
                  <p className="leading-relaxed">{currentDialogue.parentReply}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">P</div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold text-xs shrink-0">AI</div>
                <div className="max-w-[85%] bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-primary-600 block mb-1">AI Assistant (Accurate Course, Date & Time Details)</span>
                  <p className="text-slate-800 leading-relaxed">{currentDialogue.aiAbsence}</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <div className="max-w-[85%] bg-primary-500 text-white p-3.5 rounded-2xl rounded-tr-none shadow-xs">
                  <span className="text-[10px] font-bold text-primary-100 block mb-1">Parent (Stated Reason)</span>
                  <p className="leading-relaxed">{currentDialogue.parentReason}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">P</div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold text-xs shrink-0">AI</div>
                <div className="max-w-[85%] bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-primary-600 block mb-1">AI Assistant (Polite Closing & Reason Recorded)</span>
                  <p className="text-slate-800 leading-relaxed">{currentDialogue.aiClosing}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. HOW IT WORKS — FULL 9-STEP WORKFLOW
          ======================================================== */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              End-to-End Pipeline
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              A fully automated, compliance-first pipeline from college registration to AI-powered parent communication and reporting.
            </p>
            {/* Simulation Notice */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              AI calling currently runs in Simulation Mode. Live telephony activates once Exotel & Sarvam AI credentials are configured.
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical connector line (desktop) */}
            <div className="hidden lg:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-400 to-primary-200" />

            <div className="space-y-6 lg:space-y-0">
              {WORKFLOW_STEPS.map((step, idx) => {
                const isLeft = idx % 2 === 0;
                return (
                  <div key={step.step} className={`lg:flex lg:items-center lg:gap-8 ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                    {/* Content Card */}
                    <div className="flex-1">
                      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow ${isLeft ? 'lg:mr-8' : 'lg:ml-8'}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                            {String(step.step).padStart(2, '0')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900">{step.title}</h4>
                              {step.badge && (
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                  step.badge.includes('Simulation')
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-green-50 text-green-700 border-green-200'
                                }`}>
                                  {step.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Center Step Circle (desktop) */}
                    <div className="hidden lg:flex w-10 h-10 rounded-full bg-primary-500 text-white items-center justify-center font-black text-sm shrink-0 shadow-md shadow-primary-500/30 z-10">
                      {step.step}
                    </div>

                    {/* Empty spacer for alternating layout */}
                    <div className="flex-1 hidden lg:block" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile: simple numbered list fallback */}
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-sm rounded-xl shadow-md shadow-primary-500/20 transition-all hover:-translate-y-0.5"
            >
              Get Started — Register Your University
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. GOVERNANCE & SECURITY (ID TARGET)
          ======================================================== */}
      <section id="security" className="py-16 sm:py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Enterprise Grade
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Governance & Security
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: HiOutlineLockClosed, title: 'TRAI Compliant Calling', desc: 'Automated calls only to consented parents within 08:00–20:00 IST calling window.' },
              { icon: HiOutlineShieldCheck, title: 'Parent Identity Verified', desc: 'Student details are disclosed only after the registered guardian is confirmed on the call.' },
              { icon: HiOutlineGlobeAlt, title: 'Multi-Tenant Isolation', desc: 'College A cannot see College B\'s students, sessions, subjects or call logs — ever.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          8. CTA BANNER (PRESERVED)
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
          9. FOOTER (PRESERVED)
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
          <div className="flex items-center gap-6 font-semibold flex-wrap justify-center">
            <button onClick={() => navigate('/register')} className="text-white hover:text-accent-400 transition-colors font-bold">Sign Up</button>
            <button onClick={() => navigate('/login')} className="text-slate-300 hover:text-white transition-colors">Institutional Login</button>
            <button onClick={scrollToPortals} className="text-slate-300 hover:text-white transition-colors">Portals</button>
            <button onClick={() => setModalType('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => setModalType('terms')} className="hover:text-white transition-colors">Terms of Service</button>
          </div>
        </div>
      </footer>

      {/* Policy Modal (PRESERVED) */}
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
