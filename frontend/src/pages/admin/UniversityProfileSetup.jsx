/**
 * CampusAI / SmartAttend AI - University Profile Setup Page
 * 
 * Displayed on first login or accessible via Admin Portal Settings.
 * Configures:
 * - University Name
 * - Official Email
 * - Contact Number
 * - Complete Address
 * - University Website
 * - University Logo (File / Preview)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  HiOutlineBuildingLibrary,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineGlobeAlt,
  HiOutlinePhoto,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineShieldCheck,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

export default function UniversityProfileSetup() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setServerError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    official_email: '',
    contact_number: '',
    address: '',
    website: '',
    logo_url: '',
  });

  const [previewLogo, setPreviewLogo] = useState('');

  // Fetch current university profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/university/profile');
        const data = response.data;
        setFormData({
          name: data.name || '',
          official_email: data.official_email || '',
          contact_number: data.contact_number || '',
          address: data.address || '',
          website: data.website || '',
          logo_url: data.logo_url || '',
        });
        if (data.logo_url) {
          setPreviewLogo(data.logo_url);
        }
      } catch (err) {
        setServerError('Unable to load university profile from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setServerError('Logo file size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result);
        setFormData((prev) => ({ ...prev, logo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const response = await api.put('/api/university/profile', formData);
      setSuccessMessage('University profile saved successfully! Institutional records updated.');
      setTimeout(() => {
        navigate('/admin/students');
      }, 1500);
    } catch (err) {
      setServerError(
        err.response?.data?.detail || 'Failed to save university profile. Please check required fields.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <HiOutlineArrowPath className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Loading University Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
            Institutional Setup
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            University Profile & Institutional Identity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure your official college branding, campus address, and verified administrative contacts.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/students')}
          className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          Skip to Student Database
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-2.5 animate-fade-in">
          <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 font-medium flex items-center gap-2.5">
          <span>⚠</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-8">
        {/* Section 1: Institutional Identity */}
        <div>
          <h3 className="text-xs font-black text-primary-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HiOutlineBuildingLibrary className="w-4 h-4 text-primary-600" />
            1. Institutional Identity & Official Name
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                University / College Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. National Institute of Technology & Science"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Official Institutional Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="official_email"
                  value={formData.official_email}
                  onChange={handleChange}
                  required
                  placeholder="registrar@university.edu"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <HiOutlineEnvelope className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Primary Contact Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  required
                  placeholder="+91 (044) 2855-4000"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <HiOutlinePhone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Campus Address & Web Presence */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-xs font-black text-primary-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HiOutlineMapPin className="w-4 h-4 text-primary-600" />
            2. Campus Location & Web Portal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Complete Campus Physical Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Academic Campus, Main Highway Road, Chennai, Tamil Nadu - 600025"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Official University Website (URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://www.university.edu"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <HiOutlineGlobeAlt className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: University Logo */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-xs font-black text-primary-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HiOutlinePhoto className="w-4 h-4 text-primary-600" />
            3. University Crest / Logo
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Logo Preview */}
            <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {previewLogo ? (
                <img src={previewLogo} alt="University Logo Preview" className="w-full h-full object-contain p-1" />
              ) : (
                <div className="text-center text-slate-400">
                  <HiOutlinePhoto className="w-8 h-8 mx-auto" />
                  <span className="text-[10px] block mt-1">No Logo</span>
                </div>
              )}
            </div>

            {/* Upload Control */}
            <div className="space-y-2 flex-1 text-center sm:text-left">
              <label className="inline-block px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                <span>Upload Logo File (PNG / JPG)</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500">
                Recommended: Square PNG with transparent background (Max 2MB). Displayed on automated parent reports and portal headers.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600" />
            Multi-Tenant Isolated Institutional Storage
          </span>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-primary-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>Save University Profile</span>
                <HiOutlineArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
