/**
 * CampusAI / SmartAttend AI - University Registration Page
 * 
 * Features:
 * - Full university registration form:
 *   - University Name
 *   - Official Institutional Email
 *   - Contact Number
 *   - Campus Address
 *   - Administrator Name
 *   - Administrator Email
 *   - Password & Confirm Password
 * - Client-side & backend validation
 * - 6-Digit Email OTP verification flow
 * - Duplicate university & email checks
 * - Unique University ID generation (e.g. UNI-2026-XXXX)
 * - "Pending Approval" status display with Super Admin notice
 * - Direct "Already have an account? Login" redirection
 * - Protection against multiple simultaneous submissions
 */

import { useState } from 'react';
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
} from 'react-icons/hi2';

export default function UniversityRegisterPage() {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    university_name: '',
    official_email: '',
    contact_number: '',
    address: '',
    admin_name: '',
    admin_email: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field errors
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  // Registration Processing State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success State
  const [registrationResult, setRegistrationResult] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvedMessage, setApprovedMessage] = useState('');

  // Validate form fields
  const validateField = (name, value) => {
    let error = '';
    const trimmed = typeof value === 'string' ? value.trim() : value;

    switch (name) {
      case 'university_name':
        if (!trimmed) error = 'University name is required.';
        else if (trimmed.length < 3) error = 'University name must be at least 3 characters.';
        break;
      case 'official_email':
        if (!trimmed) error = 'Official email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) error = 'Enter a valid official email address.';
        break;
      case 'contact_number':
        if (!trimmed) error = 'Contact phone number is required.';
        else if (trimmed.length < 8) error = 'Enter a valid telephone number (at least 8 digits).';
        break;
      case 'address':
        if (!trimmed) error = 'Campus location address is required.';
        break;
      case 'admin_name':
        if (!trimmed) error = 'Administrator full name is required.';
        break;
      case 'admin_email':
        if (!trimmed) error = 'Administrator email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) error = 'Enter a valid administrator email address.';
        break;
      case 'password':
        if (!value) error = 'Password is required.';
        else if (value.length < 6) error = 'Password must be at least 6 characters.';
        break;
      case 'confirm_password':
        if (!value) error = 'Please confirm your password.';
        else if (value !== formData.password) error = 'Passwords do not match.';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time error clearance
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));

    // Reset OTP verification if admin email changes
    if (name === 'admin_email' && otpVerified) {
      setOtpVerified(false);
      setOtpSent(false);
      setOtpMessage('');
    }
  };

  // Step 1: Send OTP to Administrator Email
  const handleSendOtp = async () => {
    const emailErr = validateField('admin_email', formData.admin_email);
    if (emailErr) {
      setErrors((prev) => ({ ...prev, admin_email: emailErr }));
      return;
    }

    setOtpLoading(true);
    setServerError('');
    setOtpMessage('');

    try {
      const response = await api.post('/auth/university/send-otp', {
        email: formData.admin_email.trim(),
      });

      setOtpSent(true);
      setOtpMessage(response.data.message || 'OTP dispatched to email.');
      if (response.data.debug_otp) {
        setDebugOtp(response.data.debug_otp);
        setOtpCode(response.data.debug_otp); // Auto-fill for convenience
      }
    } catch (err) {
      setServerError(
        err.response?.data?.detail || 'Failed to dispatch verification OTP. Please try again.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2: Verify Submitted OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setServerError('Please enter the 6-digit OTP code.');
      return;
    }

    setOtpLoading(true);
    setServerError('');

    try {
      const response = await api.post('/auth/university/verify-otp', {
        email: formData.admin_email.trim(),
        otp: otpCode.trim(),
      });

      if (response.data.verified) {
        setOtpVerified(true);
        setOtpMessage('Administrator email verified successfully.');
      }
    } catch (err) {
      setServerError(
        err.response?.data?.detail || 'Invalid or expired OTP code.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Handle Final Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setServerError('Please correct the highlighted fields before submitting.');
      return;
    }

    // Require OTP verification before registration
    if (!otpVerified) {
      setServerError('Please verify the administrator email with OTP before completing registration.');
      return;
    }

    // Multiple submission prevention guard
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/university/register', {
        ...formData,
        otp: otpCode.trim(),
      });

      setRegistrationResult(response.data);
    } catch (err) {
      setServerError(
        err.response?.data?.detail ||
          'University registration submission failed. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo Helper: Super Admin Approval Simulation
  const handleDemoApproveAndLogin = async () => {
    if (!registrationResult?.university_id) return;
    setIsApproving(true);

    try {
      const approveRes = await api.post(
        `/auth/university/approve/${registrationResult.university_id}`
      );
      setApprovedMessage(approveRes.data.message);
      // Mark as first login so admin is redirected to profile setup
      sessionStorage.setItem('first_login', 'true');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setServerError('Approval simulation error.');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-xl flex items-center justify-center font-bold shadow-md shadow-primary-500/20">
              <HiOutlineAcademicCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                CampusAI <span className="text-primary-600">Registration</span>
              </span>
              <p className="text-[10px] text-slate-400">Institutional Onboarding Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-500">Already registered?</span>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
            >
              Institutional Login
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-10 my-6">
        {/* ========================================================
            SUCCESS VIEW (AFTER SUBMISSION)
            ======================================================== */}
        {registrationResult ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <HiOutlineCheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Status: Pending Approval
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                Your university registration has been submitted successfully!
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                Your account is awaiting Super Admin approval. Once approved, the university administrator will receive access to the University Admin Dashboard.
              </p>
            </div>

            {/* Generated Details Card */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-lg mx-auto text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Generated University ID:</span>
                <span className="font-mono font-extrabold text-sm text-primary-700">
                  {registrationResult.university_id}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Institution Name:</span>
                <span className="font-bold text-slate-900">{registrationResult.university_name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Administrator Email:</span>
                <span className="font-mono text-slate-700">{registrationResult.admin_email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Submission Timestamp:</span>
                <span className="text-slate-600">{new Date(registrationResult.submitted_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-primary-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to University Login</span>
                <HiOutlineArrowRight className="w-4 h-4" />
              </button>

              {/* Instant Approval Simulation for Evaluation */}
              <button
                onClick={handleDemoApproveAndLogin}
                disabled={isApproving}
                className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <HiOutlineSparkles className="w-4 h-4" />
                <span>{isApproving ? 'Approving...' : 'Demo Mode: Approve & Login Now'}</span>
              </button>
            </div>

            {approvedMessage && (
              <p className="text-xs text-emerald-700 font-bold animate-pulse">
                ✓ {approvedMessage} Redirecting to login...
              </p>
            )}
          </div>
        ) : (
          /* ========================================================
             REGISTRATION FORM
             ======================================================== */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8">
            {/* Form Title */}
            <div className="border-b border-slate-100 pb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-2">
                <HiOutlineBuildingLibrary className="w-4 h-4" />
                <span>New University Registration</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Enroll Your University into CampusAI
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Provide your institutional credentials. An automated verification OTP will be sent to the administrator.
              </p>
            </div>

            {/* Error Banner */}
            {serverError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-medium flex items-start gap-2.5 animate-shake">
                <HiOutlineExclamationCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{serverError}</div>
                <button
                  type="button"
                  onClick={() => setServerError('')}
                  className="text-rose-500 hover:text-rose-700 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* SECTION A: University Information */}
              <div>
                <h3 className="text-xs font-extrabold text-primary-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <HiOutlineBuildingLibrary className="w-4 h-4 text-primary-600" />
                  1. University / Institutional Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* University Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      University Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="university_name"
                      value={formData.university_name}
                      onChange={handleChange}
                      placeholder="e.g. National Institute of Engineering & Technology"
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all focus:outline-none ${
                        errors.university_name
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                          : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                      }`}
                    />
                    {errors.university_name && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        ⚠ {errors.university_name}
                      </p>
                    )}
                  </div>

                  {/* Official Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Official Institutional Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="official_email"
                        value={formData.official_email}
                        onChange={handleChange}
                        placeholder="registrar@university.edu"
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all focus:outline-none ${
                          errors.official_email
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                            : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                        }`}
                      />
                      <HiOutlineEnvelope className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {errors.official_email && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        ⚠ {errors.official_email}
                      </p>
                    )}
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      University Contact Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        placeholder="+91 (044) 2855-4000"
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-sm font-mono transition-all focus:outline-none ${
                          errors.contact_number
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                            : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                        }`}
                      />
                      <HiOutlinePhone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {errors.contact_number && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        ⚠ {errors.contact_number}
                      </p>
                    )}
                  </div>

                  {/* Campus Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Campus Physical Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Campus Road, Tech District, City, State, PIN"
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all focus:outline-none ${
                          errors.address
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                            : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                        }`}
                      />
                      <HiOutlineMapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {errors.address && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        ⚠ {errors.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION B: Administrator Account & Email OTP Verification */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-extrabold text-primary-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <HiOutlineUser className="w-4 h-4 text-primary-600" />
                  2. University Administrator Details & Email OTP Verification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Admin Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Administrator Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="admin_name"
                      value={formData.admin_name}
                      onChange={handleChange}
                      placeholder="e.g. Dr. Ramesh Sundaram"
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all focus:outline-none ${
                        errors.admin_name
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                            : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                      }`}
                    />
                    {errors.admin_name && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        ⚠ {errors.admin_name}
                      </p>
                    )}
                  </div>

                  {/* Admin Email with OTP Verification Button */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Administrator Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          name="admin_email"
                          value={formData.admin_email}
                          onChange={handleChange}
                          disabled={otpVerified}
                          placeholder="admin@university.edu"
                          className={`w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all focus:outline-none ${
                            errors.admin_email
                              ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                              : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                          } ${otpVerified ? 'bg-emerald-50 text-emerald-900 font-semibold' : ''}`}
                        />
                        {otpVerified && (
                          <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        )}
                      </div>

                      {!otpVerified && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading || !formData.admin_email}
                          className="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                        >
                          {otpLoading ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                        </button>
                      )}
                    </div>
                    {errors.admin_email && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        ⚠ {errors.admin_email}
                      </p>
                    )}
                  </div>
                </div>

                {/* OTP Verification Box */}
                {otpSent && !otpVerified && (
                  <div className="mt-4 p-4 bg-primary-50/70 border border-primary-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary-950 flex items-center gap-1.5">
                        <HiOutlineShieldCheck className="w-4 h-4 text-primary-600" />
                        Enter 6-Digit Email Verification Code
                      </span>
                      {debugOtp && (
                        <span className="text-[10px] bg-white text-primary-700 font-bold px-2 py-0.5 rounded-full border border-primary-200">
                          Dev OTP: {debugOtp}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 max-w-sm">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-40 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-center font-mono font-bold tracking-widest text-base focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpLoading || otpCode.length < 4}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        {otpLoading ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>

                    {otpMessage && (
                      <p className="text-[11px] text-primary-800 font-medium">
                        {otpMessage}
                      </p>
                    )}
                  </div>
                )}

                {otpVerified && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
                    Administrator email verified with OTP. You can proceed with registration.
                  </div>
                )}
              </div>

              {/* SECTION C: Password & Security */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-extrabold text-primary-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <HiOutlineLockClosed className="w-4 h-4 text-primary-600" />
                  3. Set Administrator Password
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 6 characters"
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all focus:outline-none pr-11 ${
                          errors.password
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                            : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        ⚠ {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all focus:outline-none pr-11 ${
                          errors.confirm_password
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                            : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <HiOutlineEyeSlash className="w-4 h-4" />
                        ) : (
                          <HiOutlineEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        ⚠ {errors.confirm_password}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button & In-Flight Protection */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  By clicking submit, you confirm that you are an authorized representative of the institution.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || !otpVerified}
                  className="w-full sm:w-auto px-8 py-3.5 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-primary-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete University Registration</span>
                      <HiOutlineArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* "Already have an account? Login" Link */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="font-bold text-primary-600 hover:text-primary-800 transition-colors underline cursor-pointer"
                >
                  Login to Institutional Portal
                </button>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2026 CampusAI • SmartAttend AI Institutional Registration System</p>
      </footer>
    </div>
  );
}
