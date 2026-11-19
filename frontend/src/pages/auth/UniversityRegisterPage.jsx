/**
 * CampusAI / SmartAttend AI - Multi-Level College & University Registration
 *
 * Strict Multi-Stage Verification:
 * 1. Personal Information (Full Name, Role)
 * 2. Official All India Institution Directory Verification (UGC / AISHE Directory)
 *    - Searchable across all 36 Indian States & UTs
 *    - 8 Recognized Categories (Central, State Public, State Private, Deemed, Autonomous, etc.)
 *    - Autonomous college recognition & affiliating university support
 *    - "Can't find your institution? Request addition" audit workflow
 * 3. Email Format & DNS MX Domain Verification
 * 4. 6-Digit Email OTP Dispatch via Zoho ZeptoMail (5-Minute Expiry & Rate Limiting)
 * 5. Backend OTP Verification & Password Hashing
 * 6. Multi-Tenant Account Creation & Direct Login Redirection
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import InstitutionSearchDropdown from '../../components/common/InstitutionSearchDropdown';
import RequestInstitutionModal from '../../components/common/RequestInstitutionModal';
import {
  HiOutlineBuildingLibrary,
  HiOutlineAcademicCap,
  HiOutlineEnvelope,
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlinePaperAirplane,
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
    email: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Institution Verification State (All India UGC & AISHE Directory)
  const [verifiedInstitution, setVerifiedInstitution] = useState(null);
  const [institutionError, setInstitutionError] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestInitialQuery, setRequestInitialQuery] = useState('');
  const [additionNotice, setAdditionNotice] = useState(null);

  // Email Validation & OTP State
  const [emailStatus, setEmailStatus] = useState('idle');
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

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
    if (!verifiedInstitution) {
      setInstitutionError('Please select your institution from the directory before proceeding to email verification.');
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
        college_id: verifiedInstitution.id,
        name: formData.full_name.trim(),
      });

      setOtpSent(true);
      setOtpTimer(300); // 5 minutes expiration
      setResendCooldown(45); // 45 seconds cooldown
      setOtpMessage(response.data.message || 'OTP dispatched to your institutional email.');

      if (response.data.debug_otp) {
        setDebugOtp(response.data.debug_otp);
        setOtpCode(response.data.debug_otp);
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
        setOtpMessage('Institutional email address verified successfully!');
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

    if (!verifiedInstitution) {
      setServerError('Institution verification is required. Please select your verified institution.');
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
        institution_id: verifiedInstitution.id,
        college_id: verifiedInstitution.id,
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
                All India Higher Education Directory
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
              Institutional Accreditation Confirmed
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome to SmartAttend AI
            </h2>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Your official credentials for <strong className="text-white">{verifiedInstitution?.official_name}</strong> have been verified and saved to the multi-tenant database.
            </p>

            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 my-6 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Institution Category:</span>
                <span className="font-semibold text-primary-300">
                  {verifiedInstitution?.autonomous_status ? 'UGC Autonomous College' : verifiedInstitution?.institution_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">State / Location:</span>
                <span className="font-semibold text-slate-200">
                  {verifiedInstitution?.district}, {verifiedInstitution?.state}
                </span>
              </div>
              {verifiedInstitution?.aishe_code && (
                <div className="flex justify-between">
                  <span className="text-slate-400">AISHE Code:</span>
                  <span className="font-mono text-emerald-400 font-bold">{verifiedInstitution.aishe_code}</span>
                </div>
              )}
              {verifiedInstitution?.affiliating_university_name && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Affiliating University:</span>
                  <span className="font-semibold text-slate-200">{verifiedInstitution.affiliating_university_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Institutional Email:</span>
                <span className="font-semibold text-slate-200">{formData.email}</span>
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
                    University & College Registration
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Search official UGC & AISHE directories covering all 36 Indian States and Union Territories.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-700/70 self-start sm:self-auto">
                  <HiOutlineShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>UGC & AISHE Integrated</span>
                </div>
              </div>

              {/* Step Flow Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6 pt-6 border-t border-slate-800">
                <div className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  formData.full_name.trim() ? 'bg-primary-950/60 border-primary-500 text-primary-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}>
                  1. Profile
                </div>
                <div className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  verifiedInstitution ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}>
                  2. Institution Search
                </div>
                <div className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  otpVerified ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}>
                  3. Email OTP
                </div>
                <div className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  formData.password.length >= 6 ? 'bg-primary-950/60 border-primary-500 text-primary-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}>
                  4. Password
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

              {/* Addition Request Submitted Notice Banner */}
              {additionNotice && (
                <div className="p-4 bg-amber-950/50 border border-amber-800 rounded-2xl text-amber-200 text-xs flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <HiOutlineShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Institution Addition Request Logged ({additionNotice.id})</p>
                      <p className="mt-0.5 text-amber-300/90">
                        {additionNotice.official_name} has been submitted for accreditation review. You can proceed with registration once approved.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdditionNotice(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
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
              {/* SECTION 2: ALL INDIA INSTITUTION SEARCH DROPDOWN */}
              {/* ---------------------------------------------------- */}
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs">2</span>
                  Institution Selection & Verification
                </h3>

                <InstitutionSearchDropdown
                  selectedInstitution={verifiedInstitution}
                  onSelectInstitution={(inst) => {
                    setVerifiedInstitution(inst);
                    setInstitutionError('');
                  }}
                  onRequestAddition={(searchQuery) => {
                    setRequestInitialQuery(searchQuery || '');
                    setIsRequestModalOpen(true);
                  }}
                  error={institutionError}
                />
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
              <div className="pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={isSubmitting || !verifiedInstitution || !otpVerified}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600 hover:from-primary-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-primary-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <HiOutlineArrowPath className="w-5 h-5 animate-spin" />
                      <span>Creating Institutional Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration & Create Account</span>
                      <HiOutlineArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-3">
                  By registering, your institution agrees to CampusAI Multi-Tenant Data Governance standards and TRAI parental calling guidelines.
                </p>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 SmartAttend AI / CampusAI. Sourced from official UGC & AISHE directories.</p>
      </footer>

      {/* Request Institution Addition Modal */}
      <RequestInstitutionModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        initialQuery={requestInitialQuery}
        onSuccess={(req) => {
          setAdditionNotice(req);
        }}
      />
    </div>
  );
}
