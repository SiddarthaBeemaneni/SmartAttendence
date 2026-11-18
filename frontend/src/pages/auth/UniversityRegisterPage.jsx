/**
 * CampusAI / SmartAttend AI - Multi-Level College Registration & Verification
 * 
 * Strict Multi-Stage Verification:
 * 1. Personal Information (Full Name, Role)
 * 2. Official College Verification (Government / AICTE Accredited Database Search & Verification)
 * 3. Email Format & Real DNS MX Domain Verification
 * 4. 6-Digit Email OTP Dispatch via Zoho ZeptoMail (5-Minute Expiry & Rate Limiting)
 * 5. Backend OTP Verification & Password Hashing
 * 6. Multi-Tenant Account Creation & Direct Login Redirection
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { APP_NAME } from '../../config';
import {
  HiOutlineBuildingLibrary,
  HiOutlineAcademicCap,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlineCheckBadge,
} from 'react-icons/hi2';

export default function UniversityRegisterPage() {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'admin',
    college_search: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // College Verification State
  const [collegeQuery, setCollegeQuery] = useState('');
  const [collegeSuggestions, setCollegeSuggestions] = useState([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [verifiedCollege, setVerifiedCollege] = useState(null); // { college_id, college_name, college_code, state, affiliation, location }
  const [collegeVerifying, setCollegeVerifying] = useState(false);
  const [collegeError, setCollegeError] = useState('');
  const dropdownRef = useRef(null);

  // Email Validation & OTP State
  const [emailStatus, setEmailStatus] = useState('idle'); // 'idle' | 'validating' | 'validated' | 'error'
  const [emailError, setEmailError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  // 5-minute Timer (300 seconds) & 45-second Resend Cooldown
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // General Form Errors & Submitting State
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Timer countdown hook
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format seconds into MM:SS
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ====================================================================
  // STAGE 1: COLLEGE SEARCH & VERIFICATION
  // ====================================================================
  const handleCollegeSearchInput = async (value) => {
    setCollegeQuery(value);
    setCollegeError('');
    if (verifiedCollege && value !== verifiedCollege.college_name) {
      setVerifiedCollege(null);
    }

    if (value.trim().length < 2) {
      setCollegeSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearchingColleges(true);
    try {
      const response = await api.get(`/api/college/search?q=${encodeURIComponent(value.trim())}&limit=8`);
      setCollegeSuggestions(response.data.colleges || []);
      setShowDropdown(true);
    } catch {
      setCollegeSuggestions([]);
    } finally {
      setIsSearchingColleges(false);
    }
  };

  const handleSelectCollege = (college) => {
    setVerifiedCollege(college);
    setCollegeQuery(college.college_name);
    setShowDropdown(false);
    setCollegeError('');
  };

  const handleExplicitVerifyCollege = async () => {
    if (!collegeQuery.trim()) {
      setCollegeError('Please enter a college name or code to verify.');
      return;
    }

    setCollegeVerifying(true);
    setCollegeError('');

    try {
      const response = await api.post('/api/college/verify', {
        college_name: collegeQuery.trim(),
        college_code: verifiedCollege?.college_code || undefined,
        college_id: verifiedCollege?.college_id || undefined,
      });

      if (response.data.status === 'verified') {
        setVerifiedCollege(response.data.college);
        setCollegeQuery(response.data.college.college_name);
        setShowDropdown(false);
      }
    } catch (err) {
      setVerifiedCollege(null);
      setCollegeError(
        err.response?.data?.detail || 'College not found. Please enter a valid registered college.'
      );
    } finally {
      setCollegeVerifying(false);
    }
  };

  // ====================================================================
  // STAGE 2: EMAIL FORMAT & DNS MX RECORD VERIFICATION
  // ====================================================================
  const handleValidateEmail = async () => {
    const email = formData.email.trim();
    if (!email) {
      setEmailError('Institutional email address is required.');
      return false;
    }

    setEmailStatus('validating');
    setEmailError('');

    try {
      const response = await api.post('/api/email/validate', { email });
      if (response.data.valid) {
        setEmailStatus('validated');
        return true;
      }
    } catch (err) {
      setEmailStatus('error');
      setEmailError(
        err.response?.data?.detail || 'Invalid email format or unreachable mail domain.'
      );
      return false;
    }
  };

  // ====================================================================
  // STAGE 3: SEND OTP VIA ZOHO ZEPTOMAIL
  // ====================================================================
  const handleSendOtp = async () => {
    if (!verifiedCollege) {
      setCollegeError('Please verify your college before proceeding to email verification.');
      return;
    }

    const emailValid = await handleValidateEmail();
    if (!emailValid) return;

    setOtpLoading(true);
    setServerError('');
    setOtpMessage('');

    try {
      const response = await api.post('/api/email/send-otp', {
        email: formData.email.trim(),
        college_id: verifiedCollege.college_id,
        name: formData.full_name.trim(),
      });

      setOtpSent(true);
      setOtpTimer(300); // 5 minutes expiration
      setResendCooldown(45); // 45 seconds cooldown
      setOtpMessage(response.data.message || 'OTP dispatched to your institutional email.');

      if (response.data.debug_otp) {
        setDebugOtp(response.data.debug_otp);
        setOtpCode(response.data.debug_otp); // Quick fill in dev
      }
    } catch (err) {
      setServerError(
        err.response?.data?.detail || 'Failed to dispatch verification OTP. Please try again.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // ====================================================================
  // STAGE 4: VERIFY 6-DIGIT OTP
  // ====================================================================
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setServerError('Please enter the complete 6-digit numeric OTP code.');
      return;
    }

    setOtpLoading(true);
    setServerError('');

    try {
      const response = await api.post('/api/email/verify-otp', {
        email: formData.email.trim(),
        otp: otpCode.trim(),
      });

      if (response.data.status === 'verified') {
        setOtpVerified(true);
        setVerificationToken(response.data.verification_token);
        setOtpMessage('Email address verified successfully!');
      }
    } catch (err) {
      setServerError(
        err.response?.data?.detail || 'Invalid or expired OTP code.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // ====================================================================
  // STAGE 5: FINAL REGISTRATION & ACCOUNT CREATION
  // ====================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!formData.full_name.trim()) {
      setServerError('Administrator full name is required.');
      return;
    }

    if (!verifiedCollege) {
      setServerError('College existence verification is required. Please verify your college.');
      return;
    }

    if (!otpVerified) {
      setServerError('Email verification is required. Please verify the OTP sent to your email.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setServerError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setServerError('Passwords do not match.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await api.post('/api/auth/register', {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        college_id: verifiedCollege.college_id,
        verification_token: verificationToken,
        role: formData.role,
      });

      setRegistrationSuccess(true);
    } catch (err) {
      setServerError(
        err.response?.data?.detail || 'Registration failed. Please check your verification status and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-primary-500 selection:text-white">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <HiOutlineAcademicCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block leading-none">
                SmartAttend <span className="text-primary-400">AI</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">
                Institutional Verification
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">Already registered?</span>
            <Link
              to="/login"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700/80 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* Verification Success View */}
        {registrationSuccess ? (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl animate-fade-in max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6 text-emerald-400 animate-bounce">
              <HiOutlineCheckBadge className="w-10 h-10" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60 inline-block mb-3">
              Verification & Registration Completed
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome to SmartAttend AI
            </h2>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Your official credentials for <strong className="text-white">{verifiedCollege?.college_name}</strong> have been verified and saved to the database.
            </p>

            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 my-6 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Institutional Email:</span>
                <span className="font-semibold text-slate-200">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">College Code:</span>
                <span className="font-mono text-primary-400 font-bold">{verifiedCollege?.college_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <HiOutlineCheckCircle className="w-4 h-4" /> Verified
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Login</span>
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/70 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Header Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-primary-950/40 to-slate-900 border-b border-slate-700/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary-400 bg-primary-900/50 px-3 py-1 rounded-full border border-primary-800/60">
                    Accredited Institution Registration
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
                    College & Administrator Verification
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Multi-level verification system powered by official college databases and Zoho ZeptoMail.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-700/70 self-start sm:self-auto">
                  <HiOutlineShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Strict AICTE / UGC Verification</span>
                </div>
              </div>

              {/* Step Flow Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6 pt-6 border-t border-slate-800">
                <div className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  formData.full_name.trim() ? 'bg-primary-950/60 border-primary-500 text-primary-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}>
                  1. Personal Info
                </div>
                <div className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  verifiedCollege ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}>
                  2. College Verification
                </div>
                <div className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  otpVerified ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}>
                  3. Email OTP
                </div>
                <div className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  formData.password.length >= 6 ? 'bg-primary-950/60 border-primary-500 text-primary-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}>
                  4. Secure Credentials
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
              {/* Global Error Banner */}
              {serverError && (
                <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-3">
                  <HiOutlineExclamationCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SECTION 1: PERSONAL INFORMATION */}
              {/* ---------------------------------------------------- */}
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs">1</span>
                  Administrator Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <HiOutlineUser className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Dr. K. Ramanathan"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                      Role / Designation
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="admin">University / College Administrator</option>
                      <option value="faculty">Dean / Department Head</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SECTION 2: COLLEGE EXISTENCE VERIFICATION */}
              {/* ---------------------------------------------------- */}
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs">2</span>
                  College Existence Verification
                </h3>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase">
                    Select or Search Recognized College <span className="text-rose-400">*</span>
                  </label>

                  <div className="relative" ref={dropdownRef}>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <HiOutlineBuildingLibrary className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={collegeQuery}
                          onChange={(e) => handleCollegeSearchInput(e.target.value)}
                          onFocus={() => {
                            if (collegeSuggestions.length > 0) setShowDropdown(true);
                          }}
                          placeholder="Type college name (e.g. IIT Madras, Anna University, PSG, SSN, VIT...)"
                          className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleExplicitVerifyCollege}
                        disabled={collegeVerifying || !collegeQuery.trim()}
                        className="px-5 py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
                      >
                        {collegeVerifying ? (
                          <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                        ) : (
                          <HiOutlineShieldCheck className="w-4 h-4" />
                        )}
                        <span>Verify College</span>
                      </button>
                    </div>

                    {/* Suggestions Dropdown */}
                    {showDropdown && collegeSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                        <div className="p-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/60 border-b border-slate-800">
                          Accredited College Suggestions
                        </div>
                        {collegeSuggestions.map((col) => (
                          <button
                            key={col.college_id}
                            type="button"
                            onClick={() => handleSelectCollege(col)}
                            className="w-full text-left p-3 hover:bg-slate-800/80 border-b border-slate-800/50 transition-colors flex items-center justify-between gap-3"
                          >
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-white">{col.college_name}</p>
                              <p className="text-[11px] text-slate-400">
                                {col.location}, {col.state} • Affiliation: {col.affiliation}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-primary-950 text-primary-300 border border-primary-800 px-2 py-0.5 rounded">
                              {col.college_code}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* College Verification Error Message */}
                  {collegeError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <HiOutlineExclamationCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{collegeError}</span>
                    </div>
                  )}

                  {/* College Verified Badge Card */}
                  {verifiedCollege && (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <HiOutlineCheckBadge className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                              Verified Accredited College
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-300">
                              Code: {verifiedCollege.college_code}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {verifiedCollege.college_name}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {verifiedCollege.location}, {verifiedCollege.state} • {verifiedCollege.affiliation}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <HiOutlineCheckCircle className="w-4 h-4" /> Passed Verification
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SECTION 3: EMAIL VALIDATION & ZOHO ZEPTOMAIL OTP */}
              {/* ---------------------------------------------------- */}
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs">3</span>
                  Institutional Email & OTP Verification
                </h3>

                <div className="space-y-4">
                  {/* Email Input & Send OTP Button */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                      Official Institutional Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <HiOutlineEnvelope className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          disabled={otpVerified}
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            setEmailStatus('idle');
                            setEmailError('');
                          }}
                          placeholder="administrator@college.edu"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500 disabled:opacity-60"
                        />
                      </div>

                      {!otpVerified && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading || resendCooldown > 0 || !formData.email.trim()}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
                        >
                          {otpLoading ? (
                            <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                          ) : (
                            <HiOutlinePaperAirplane className="w-4 h-4" />
                          )}
                          <span>
                            {resendCooldown > 0
                              ? `Resend in ${resendCooldown}s`
                              : otpSent
                              ? 'Resend OTP'
                              : 'Send Verification OTP'}
                          </span>
                        </button>
                      )}
                    </div>

                    {emailError && (
                      <p className="text-xs text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                        <HiOutlineExclamationCircle className="w-4 h-4 shrink-0" />
                        <span>{emailError}</span>
                      </p>
                    )}
                  </div>

                  {/* OTP Input Card */}
                  {otpSent && !otpVerified && (
                    <div className="p-5 bg-slate-900/90 border border-primary-800/60 rounded-2xl space-y-4 animate-fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                            Enter 6-Digit Email OTP
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Delivered via Zoho ZeptoMail to <strong className="text-white">{formData.email}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-full self-start sm:self-auto">
                          <HiOutlineClock className="w-4 h-4" />
                          <span>Expires in: {formatTimer(otpTimer)}</span>
                        </div>
                      </div>

                      {/* Debug OTP Banner (development mode) */}
                      {debugOtp && (
                        <div className="p-2.5 bg-primary-950/80 border border-primary-700/60 rounded-xl text-xs flex items-center justify-between text-primary-200">
                          <span>🛠️ Dev Auto-OTP: <strong className="font-mono text-white text-sm">{debugOtp}</strong></span>
                          <button
                            type="button"
                            onClick={() => setOtpCode(debugOtp)}
                            className="text-[11px] font-bold text-primary-400 underline hover:text-white"
                          >
                            Fill Code
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="• • • • • •"
                          className="w-full sm:w-48 text-center text-xl font-mono font-bold tracking-widest px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpLoading || otpCode.length !== 6}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          {otpLoading ? (
                            <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                          ) : (
                            <HiOutlineShieldCheck className="w-4 h-4" />
                          )}
                          <span>Verify OTP Code</span>
                        </button>
                      </div>

                      {otpMessage && (
                        <p className="text-xs text-slate-300 font-medium">{otpMessage}</p>
                      )}
                    </div>
                  )}

                  {/* Email Verified Success Banner */}
                  {otpVerified && (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-300">
                      <div className="flex items-center gap-2">
                        <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Institutional email address verified successfully.</span>
                      </div>
                      <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
                        OTP Confirmed
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SECTION 4: SECURE PASSWORD SETUP */}
              {/* ---------------------------------------------------- */}
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs">4</span>
                  Secure Password
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirm_password}
                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showConfirmPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400">
                  By registering, you confirm authorized governance representation for your college.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || !verifiedCollege || !otpVerified}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-600/30 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <HiOutlineArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 border-t border-slate-800/80">
        &copy; 2026 SmartAttend AI. Enterprise Academic Attendance & Voice AI Verification.
      </footer>
    </div>
  );
}
