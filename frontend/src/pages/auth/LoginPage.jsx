/**
 * SmartAttend AI - Enterprise College Login Page
 * 
 * Features:
 * - Two-column design with navy-blue branding panel & white login card
 * - Institutional college crest & configurable college name placeholder
 * - Full responsiveness across mobile, tablet, and desktop
 * - Client-side email format & password validation with clear inline messages
 * - Show / Hide password toggle
 * - Forgot Password modal with self-service reset recovery
 * - Privacy Policy & Terms of Service dialogs
 * - 4 safe demo role buttons (active in development, strictly disabled in production)
 * - Real FastAPI backend JWT authentication & role-based routing
 * - Loading spinners, error alerts, and disabled states during network requests
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  HiOutlineKey,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineDocumentText,
} from 'react-icons/hi2';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, demoLogin, forgotPassword } = useAuth();

  // Form inputs
  const [email, setEmail] = useState('admin@smartattend.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & feedback state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(null);

  // Modals
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');
  const [policyModalType, setPolicyModalType] = useState(null); // 'privacy' | 'terms' | null

  // Production environment check
  const isProduction = import.meta.env.PROD;

  // Email format validation
  const validateEmail = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setEmailError('Email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid academic or personal email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Password validation
  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('Password is required.');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Handle standard credential submission
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
          const { default: api } = await import('../../services/api');
          const profileRes = await api.get('/api/university/profile');
          if (!profileRes.data.profile_completed) {
            sessionStorage.setItem('first_login', 'true');
          }
        } catch {}
      }
      // Role-based redirection
      navigate(`/${user.role}`);
    } catch (err) {
      setServerError(
        err.message || 'Login failed. Please verify your institutional credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle 1-click Demo Role Login (Disabled in production)
  const handleDemoAccess = async (role) => {
    if (isProduction) {
      setServerError('Demo shortcuts are strictly disabled in production environments.');
      return;
    }

    setServerError('');
    setLoadingRole(role);

    try {
      const user = await demoLogin(role);
      // If admin logging in via demo, check profile completion
      if (user.role === 'admin') {
        try {
          const { default: api } = await import('../../services/api');
          const profileRes = await api.get('/api/university/profile');
          if (!profileRes.data.profile_completed) {
            sessionStorage.setItem('first_login', 'true');
          }
        } catch {}
      }
      navigate(`/${user.role}`);
    } catch (err) {
      setServerError(err.message || `Unable to authenticate as ${role}.`);
    } finally {
      setLoadingRole(null);
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
          {/* Institutional College Banner */}
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
            Integrated attendance governance with real-time autonomous voice outreach. Dispatches safe, consent-driven phone calls to parents in their preferred native language.
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
          Right Column: Login Form, Demo Role Cards & Modals
          ======================================================== */}
      <div className="lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-16">
        <div className="w-full max-w-md space-y-6 sm:space-y-7">
          {/* Mobile College Banner */}
          <div className="lg:hidden text-center pb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
              <HiOutlineBuildingLibrary className="w-4 h-4 text-primary-600" />
              <span>{COLLEGE_CONFIG.name}</span>
            </div>
          </div>

          {/* Form Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your credentials to access your institutional dashboard.
            </p>
          </div>

          {/* 1-Click Role Testing Cards (Development Only) */}
          {!isProduction && (
            <div className="p-4 bg-primary-50/70 border border-primary-200 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary-950 uppercase tracking-wider flex items-center gap-1.5">
                  <HiOutlineSparkles className="w-4 h-4 text-primary-600" />
                  1-Click Role Testing (Dev Mode)
                </span>
                <span className="text-[10px] bg-white text-primary-700 border border-primary-200 font-bold px-2 py-0.5 rounded-full">
                  FastAPI Auth
                </span>
              </div>
              <p className="text-[11px] text-primary-800 mb-3">
                Select a persona to authenticate via real backend JWT tokens:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'admin', label: 'Admin Portal', sub: 'Dean / Academic Head' },
                  { role: 'faculty', label: 'Faculty Portal', sub: 'Prof. Ananya Sundaram' },
                  { role: 'student', label: 'Student Portal', sub: 'Karthik Subramanian' },
                  { role: 'parent', label: 'Parent Portal', sub: 'Mr. S. Subramanian' },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    disabled={loading || loadingRole !== null}
                    onClick={() => handleDemoAccess(item.role)}
                    className="p-2.5 bg-white hover:bg-primary-500 hover:text-white border border-primary-200 rounded-xl text-left transition-all shadow-xs group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-white">
                        {loadingRole === item.role ? 'Connecting...' : item.label}
                      </span>
                      <HiOutlineArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-primary-100 block truncate mt-0.5">
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Server Error Alert Banner */}
          {serverError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium flex items-start gap-2.5 animate-shake">
              <HiOutlineExclamationCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{serverError}</div>
              <button
                type="button"
                onClick={() => setServerError('')}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email Address
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
                  placeholder="e.g. admin@smartattend.edu"
                  disabled={loading}
                  required
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all shadow-xs focus:outline-none ${
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
                  className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors"
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
                  placeholder="••••••••"
                  disabled={loading}
                  required
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all shadow-xs focus:outline-none pr-11 ${
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || loadingRole !== null}
              className="w-full py-3.5 px-4 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold rounded-xl shadow-md shadow-primary-500/20 text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to College Portal</span>
              )}
            </button>
          </form>

          {/* New University Sign Up Banner */}
          <div className="p-4 bg-gradient-to-r from-primary-50 to-slate-50 border border-primary-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-900 block">New University or College?</span>
              <span className="text-[11px] text-slate-500">Sign up your institution to start automated calling</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-extrabold rounded-xl text-xs shadow-sm shadow-primary-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
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
              className="hover:text-primary-600 transition-colors underline"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setPolicyModalType('terms')}
              className="hover:text-primary-600 transition-colors underline"
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
