/**
 * SmartAttend AI / CampusAI - Enterprise Institutional Login Page
 * 
 * Features:
 * - Four Portal Selector Cards: Admin, Faculty, Student, Parent
 * - Interactive role switching: clicking any portal card selects that role and asks for login email and password
 * - Dynamic form title, badges, labels, and placeholders customized to the selected portal
 * - Email format and password validation
 * - Show / Hide password toggle
 * - Fast helper to populate demo testing credentials into form fields without bypassing authentication
 * - Real FastAPI backend JWT authentication via /api/auth/login
 * - Forgot Password recovery modal
 * - Privacy Policy & Terms of Service dialogs
 * - Navy-blue and white institutional branding layout
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, COLLEGE_CONFIG } from '../../config';
import { LANGUAGES_LIST } from '../../utils/mockData';
import Modal from '../../components/common/Modal';
import {
  HiOutlineAcademicCap,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineLanguage,
  HiOutlineArrowRight,
  HiOutlineBuildingLibrary,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineComputerDesktop,
  HiOutlineIdentification,
  HiOutlineUsers,
  HiOutlineHome,
  HiOutlineCheck,
  HiOutlineLockClosed,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

// Role configurations with personas and institutional defaults
const PORTAL_ROLES = [
  {
    role: 'admin',
    label: 'Admin Portal',
    sub: 'Dean / Academic Head',
    personaName: 'Dr. K. Ramanathan',
    defaultEmail: 'admin@smartattend.edu',
    defaultPassword: 'password123',
    icon: HiOutlineComputerDesktop,
    title: 'Dean & Administrator Sign In',
    subtitle: 'Sign in to access institutional governance, department rosters, attendance analytics, and AI calling operations.',
    emailLabel: 'Administrator Email Address',
    emailPlaceholder: 'e.g. admin@smartattend.edu or dean@university.ac.in',
    colorTheme: 'blue',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    activeCardClass: 'ring-2 ring-primary-500 border-primary-500 bg-primary-50/70 shadow-sm',
    btnClass: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 shadow-primary-500/25',
    accentText: 'text-primary-600',
  },
  {
    role: 'faculty',
    label: 'Faculty Portal',
    sub: 'Prof. Ananya Sundaram',
    personaName: 'Prof. Ananya Sundaram',
    defaultEmail: 'faculty@smartattend.edu',
    defaultPassword: 'password123',
    icon: HiOutlineIdentification,
    title: 'Faculty Member Sign In',
    subtitle: 'Sign in to manage assigned lecture classes, mark attendance, and review AI parent-call logs in real time.',
    emailLabel: 'Faculty Institutional Email',
    emailPlaceholder: 'e.g. faculty@smartattend.edu or prof.name@university.ac.in',
    colorTheme: 'purple',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    activeCardClass: 'ring-2 ring-purple-500 border-purple-500 bg-purple-50/70 shadow-sm',
    btnClass: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 shadow-purple-600/25',
    accentText: 'text-purple-600',
  },
  {
    role: 'student',
    label: 'Student Portal',
    sub: 'Karthik Subramanian',
    personaName: 'Karthik Subramanian',
    defaultEmail: 'student@smartattend.edu',
    defaultPassword: 'password123',
    icon: HiOutlineUsers,
    title: 'Student Portal Sign In',
    subtitle: 'Sign in to inspect your attendance percentages, subject logs, notifications, and academic records.',
    emailLabel: 'Student Email or Academic Roll No.',
    emailPlaceholder: 'e.g. student@smartattend.edu or 2023-CSE-089',
    colorTheme: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    activeCardClass: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/70 shadow-sm',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/25',
    accentText: 'text-emerald-600',
  },
  {
    role: 'parent',
    label: 'Parent Portal',
    sub: 'Mr. S. Subramanian',
    personaName: 'Mr. S. Subramanian',
    defaultEmail: 'parent@smartattend.edu',
    defaultPassword: 'password123',
    icon: HiOutlineHome,
    title: 'Parent & Guardian Sign In',
    subtitle: 'Sign in to review your child\'s attendance logs, absence phone-call recordings & transcripts, and contact settings.',
    emailLabel: 'Parent Registered Email / Contact',
    emailPlaceholder: 'e.g. parent@smartattend.edu or registered mobile/email',
    colorTheme: 'amber',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    activeCardClass: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/70 shadow-sm',
    btnClass: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/25',
    accentText: 'text-amber-600',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, forgotPassword } = useAuth();

  // Role resolution from URL or default to admin
  const roleParam = searchParams.get('role');
  const initialRole = PORTAL_ROLES.find((r) => r.role === roleParam)?.role || 'admin';

  const [activeRole, setActiveRole] = useState(initialRole);
  const currentRoleConfig = PORTAL_ROLES.find((r) => r.role === activeRole) || PORTAL_ROLES[0];

  // Form inputs - starts with the role's default email, password asks user to enter
  const [email, setEmail] = useState(currentRoleConfig.defaultEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & feedback state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');
  const [policyModalType, setPolicyModalType] = useState(null); // 'privacy' | 'terms' | null

  // Sync role state when URL param changes
  useEffect(() => {
    const roleInQuery = searchParams.get('role');
    if (roleInQuery && roleInQuery !== activeRole) {
      const matched = PORTAL_ROLES.find((r) => r.role === roleInQuery);
      if (matched) {
        setActiveRole(matched.role);
        setEmail(matched.defaultEmail);
        setPassword('');
        setEmailError('');
        setPasswordError('');
        setServerError('');
      }
    }
  }, [searchParams]);

  // Handle switching portal cards
  const handlePortalSelect = (roleItem) => {
    setActiveRole(roleItem.role);
    setEmail(roleItem.defaultEmail);
    setPassword('');
    setEmailError('');
    setPasswordError('');
    setServerError('');
    setSearchParams({ role: roleItem.role });
  };

  // Quick fill helper for demo testing credentials
  const handleQuickFillCredentials = () => {
    setEmail(currentRoleConfig.defaultEmail);
    setPassword(currentRoleConfig.defaultPassword);
    setEmailError('');
    setPasswordError('');
    setServerError('');
  };

  // Email format validation
  const validateEmail = (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      setEmailError('Email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid institutional or personal email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Password validation
  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('Password is required to sign in.');
      return false;
    }
    if (value.length < 4) {
      setPasswordError('Password must be at least 4 characters.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Handle credential submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const user = await login(email, password);

      // If admin logging in, check if profile needs setup (first login)
      if (user.role === 'admin') {
        try {
          const profileRes = await api.get('/api/university/profile');
          if (!profileRes.data.profile_completed) {
            sessionStorage.setItem('first_login', 'true');
          }
        } catch {}
      }

      // Navigate to the user's authorized role dashboard
      navigate(`/${user.role}`);
    } catch (err) {
      setServerError(
        err.message || 'Login failed. Please verify your email and password credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password submission
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(forgotEmail)) return;

    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotEmail);
      setForgotSuccessMessage(
        res.message || 'Password reset link has been dispatched to your contact.'
      );
    } catch (err) {
      setForgotSuccessMessage(
        `If ${forgotEmail} is enrolled, recovery instructions have been sent.`
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const CurrentIcon = currentRoleConfig.icon;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-800">
      {/* ========================================================
          Left Column: College Identity, Branding & Capabilities
          ======================================================== */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-700 to-primary-900 text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Soft decorative background glows */}
        <div className="absolute -top-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top: College Crest Placeholder & System Name */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-primary-100 mb-6 font-medium">
            <HiOutlineBuildingLibrary className="w-4 h-4 text-amber-300" />
            <span>{COLLEGE_CONFIG.name}</span>
            <span className="hidden sm:inline opacity-60">• {COLLEGE_CONFIG.code}</span>
          </div>

          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20 shrink-0">
              <HiOutlineAcademicCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{APP_NAME}</h1>
              <p className="text-[11px] sm:text-xs text-primary-200 uppercase tracking-widest font-semibold">
                AI-Powered Attendance & Automated Calling
              </p>
            </div>
          </div>
          <p className="text-primary-100 text-xs sm:text-sm mt-3 max-w-lg leading-relaxed">
            Integrated attendance governance connecting administrators, faculty, students, and parents with real-time autonomous voice outreach in 6 Indian languages.
          </p>
        </div>

        {/* Middle Feature Highlights */}
        <div className="my-8 sm:my-10 space-y-3 relative z-10">
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="p-2 rounded-xl bg-white/15 text-white shrink-0">
              <HiOutlinePhone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Automated AI Calling</h4>
              <p className="text-[11px] sm:text-xs text-primary-200 mt-0.5">
                Triggered exclusively upon finalized faculty attendance; verifies guardian identity before disclosing student absence.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="p-2 rounded-xl bg-white/15 text-white shrink-0">
              <HiOutlineLanguage className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">6 Indian Languages Supported</h4>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {LANGUAGES_LIST.map((lang) => (
                  <span
                    key={lang.code}
                    className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-md bg-white/15 text-white font-medium"
                  >
                    {lang.name} ({lang.native})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="p-2 rounded-xl bg-white/15 text-white shrink-0">
              <HiOutlineShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Privacy & Verification Guardrails</h4>
              <p className="text-[11px] sm:text-xs text-primary-200 mt-0.5">
                Role-based access control, parent consent tracking, phone verification, and cryptographic session sealing.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-primary-200">
          <span>{COLLEGE_CONFIG.accreditation}</span>
          <span className="flex items-center gap-1">
            <HiOutlineSparkles className="w-3.5 h-3.5 text-amber-300" />
            Powered by Sarvam AI & FastAPI
          </span>
        </div>
      </div>

      {/* ========================================================
          Right Column: Portal Selector Cards & Login Form
          ======================================================== */}
      <div className="lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-14">
        <div className="w-full max-w-md space-y-5 sm:space-y-6">
          {/* Mobile College Banner */}
          <div className="lg:hidden text-center pb-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
              <HiOutlineBuildingLibrary className="w-4 h-4 text-primary-600" />
              <span>{COLLEGE_CONFIG.name}</span>
            </div>
          </div>

          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Institutional Login
              </h2>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${currentRoleConfig.badgeClass} flex items-center gap-1`}>
                <CurrentIcon className="w-3.5 h-3.5" />
                <span>{currentRoleConfig.label}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select your role below and enter your login email and password to access your portal.
            </p>
          </div>

          {/* ========================================================
              Four Portal Cards (Clicking selects the portal & asks for credentials)
              ======================================================== */}
          <div className="p-3.5 bg-slate-100/80 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <HiOutlineSparkles className="w-3.5 h-3.5 text-primary-600" />
                Select Portal to Sign In
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Click to switch role</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PORTAL_ROLES.map((item) => {
                const isSelected = activeRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handlePortalSelect(item)}
                    className={`p-3 rounded-xl text-left transition-all border cursor-pointer relative group ${
                      isSelected
                        ? item.activeCardClass
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-slate-900 font-extrabold' : 'text-slate-800'}`}>
                        {item.label}
                      </span>
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0">
                          <HiOutlineCheck className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      ) : (
                        <HiOutlineArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate font-medium">
                      {item.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium flex items-start gap-2.5 animate-shake">
              <HiOutlineExclamationCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{serverError}</div>
              <button
                type="button"
                onClick={() => setServerError('')}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================
              Active Role Login Form (Asks for Email and Password)
              ======================================================== */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CurrentIcon className="w-4 h-4 text-primary-600" />
                {currentRoleConfig.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentRoleConfig.subtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {currentRoleConfig.emailLabel}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    placeholder={currentRoleConfig.emailPlaceholder}
                    disabled={loading}
                    required
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs sm:text-sm transition-all shadow-xs focus:outline-none ${
                      emailError
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20'
                        : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                    }`}
                  />
                  <HiOutlineEnvelope className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {emailError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <span>⚠</span> {emailError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  {/* Forgot Password Link */}
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotSuccessMessage('');
                      setIsForgotModalOpen(true);
                    }}
                    className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) validatePassword(e.target.value);
                    }}
                    onBlur={() => validatePassword(password)}
                    placeholder="Enter your password"
                    disabled={loading}
                    required
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs sm:text-sm transition-all shadow-xs focus:outline-none pr-11 ${
                      passwordError
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20'
                        : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                    }`}
                  />
                  {/* Show / Hide Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <HiOutlineEyeSlash className="w-4 h-4" />
                    ) : (
                      <HiOutlineEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <span>⚠</span> {passwordError}
                  </p>
                )}
              </div>

              {/* Demo Credentials Helper Pill */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px]">
                <div className="truncate pr-2">
                  <span className="text-slate-500">Demo Testing: </span>
                  <span className="font-semibold text-slate-800 font-mono">{currentRoleConfig.defaultEmail}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="font-semibold text-slate-800 font-mono">password123</span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFillCredentials}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-primary-700 border border-slate-200 rounded-lg font-bold text-[10px] shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Fill demo credentials into form"
                >
                  <HiOutlineArrowPath className="w-3 h-3" />
                  Fill Credentials
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 ${currentRoleConfig.btnClass} text-white font-extrabold rounded-xl shadow-md text-xs sm:text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying {currentRoleConfig.label} Credentials...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineLockClosed className="w-4 h-4" />
                    <span>Sign In to {currentRoleConfig.label}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* New University Sign Up Banner */}
          <div className="p-3.5 bg-gradient-to-r from-primary-50 to-slate-50 border border-primary-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-900 block">New University or College?</span>
              <span className="text-[11px] text-slate-500">Sign up your institution to start automated calling</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="px-3.5 py-2 bg-primary-500 hover:bg-primary-600 text-white font-extrabold rounded-xl text-xs shadow-sm shadow-primary-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Sign Up</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Privacy Policy & Terms Links */}
          <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => setPolicyModalType('privacy')}
              className="hover:text-primary-600 transition-colors underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setPolicyModalType('terms')}
              className="hover:text-primary-600 transition-colors underline cursor-pointer"
            >
              Terms of Service
            </button>
            <span>•</span>
            <span>Support: {COLLEGE_CONFIG.supportEmail}</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          Forgot Password Modal
          ======================================================== */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="Self-service credential recovery for students, faculty, parents, and administrators."
      >
        {forgotSuccessMessage ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-900 flex items-start gap-3">
              <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-950">Recovery Dispatch Initiated</h4>
                <p className="mt-1">{forgotSuccessMessage}</p>
                <p className="mt-2 text-emerald-800 text-[11px]">
                  Please verify your inbox and SMS messages. If no email is received, contact college IT desk at {COLLEGE_CONFIG.emergencyDesk}.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered academic or guardian email address. A one-time verification link and OTP will be dispatched to your contact records.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Registered Email Address
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="user@smartattend.edu"
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {forgotLoading ? 'Sending...' : 'Send Recovery Link'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================
          Privacy Policy & Terms of Service Modal
          ======================================================== */}
      <Modal
        isOpen={policyModalType !== null}
        onClose={() => setPolicyModalType(null)}
        title={policyModalType === 'privacy' ? 'Privacy Policy & Student Data Governance' : 'Terms of Service'}
        subtitle={`${COLLEGE_CONFIG.name} • SmartAttend AI`}
      >
        <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed max-h-80 overflow-y-auto pr-2">
          {policyModalType === 'privacy' ? (
            <>
              <h4 className="font-bold text-slate-900 text-sm">1. Autonomous Voice Calling Consent</h4>
              <p>
                Automated phone calls to parents or guardians are placed only after verified faculty finalization of attendance. Parents maintain the right to grant or revoke automated calling consent at any time via the Parent Portal.
              </p>
              <h4 className="font-bold text-slate-900 text-sm mt-3">2. Identity Verification Guardrail</h4>
              <p>
                In compliance with educational privacy standards, the AI voice agent strictly verifies that it is speaking with an authorized guardian before disclosing student attendance records.
              </p>
              <h4 className="font-bold text-slate-900 text-sm mt-3">3. Language & Title Preferences</h4>
              <p>
                Parent preferred form of address (Mr., Mrs., Dr.) and preferred Indian language (Tamil, English, Telugu, Hindi, Malayalam, Kannada) are stored explicitly in profiles and never guessed from biometric audio signals.
              </p>
            </>
          ) : (
            <>
              <h4 className="font-bold text-slate-900 text-sm">1. Academic Attendance Policy</h4>
              <p>
                Students are mandated to maintain a minimum of 75% aggregate attendance in all registered lecture sessions to be eligible for end-semester examinations.
              </p>
              <h4 className="font-bold text-slate-900 text-sm mt-3">2. Attendance Finalization & Audit Logs</h4>
              <p>
                Attendance entries saved as drafts do not trigger telephone dispatches. Finalized records are sealed with cryptographic timestamps and modifier audit trails.
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setPolicyModalType(null)}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
          >
            I Understand
          </button>
        </div>
      </Modal>
    </div>
  );
}
