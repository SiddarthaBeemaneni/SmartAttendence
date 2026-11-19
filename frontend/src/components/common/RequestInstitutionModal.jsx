/**
 * CampusAI / SmartAttend AI - Request Institution Addition Modal
 *
 * Allows unlisted colleges/universities to submit official verification requests.
 * Stored as pending administrator review.
 */

import { useState } from 'react';
import api from '../../services/api';
import Modal from './Modal';
import {
  HiOutlineBuildingLibrary,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineArrowPath,
  HiOutlinePaperAirplane,
} from 'react-icons/hi2';

const INSTITUTION_TYPES = [
  'Central University',
  'State Public University',
  'State Private University',
  'Deemed-to-be University',
  'Autonomous College',
  'Affiliated College',
  'Constituent College',
  'Other recognized Higher Education Institution',
];

const STATES_LIST = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function RequestInstitutionModal({
  isOpen,
  onClose,
  initialQuery = '',
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    official_name: initialQuery || '',
    institution_type: 'Autonomous College',
    state: 'Tamil Nadu',
    district: '',
    city: '',
    address: '',
    official_website: '',
    aishe_code: '',
    ugc_reference: '',
    affiliating_university: '',
    official_email: '',
    applicant_name: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.official_name.trim()) {
      setError('Official institution name is required.');
      return;
    }
    if (!formData.district.trim()) {
      setError('District is required.');
      return;
    }
    if (!formData.official_email.trim()) {
      setError('Official institutional email is required.');
      return;
    }
    if (!formData.applicant_name.trim()) {
      setError('Applicant name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/institutions/request-addition', {
        official_name: formData.official_name.trim(),
        institution_type: formData.institution_type,
        state: formData.state,
        district: formData.district.trim(),
        city: formData.city.trim() || formData.district.trim(),
        address: formData.address.trim() || undefined,
        official_website: formData.official_website.trim() || undefined,
        aishe_code: formData.aishe_code.trim() || undefined,
        ugc_reference: formData.ugc_reference.trim() || undefined,
        affiliating_university: formData.affiliating_university.trim() || undefined,
        official_email: formData.official_email.trim(),
        applicant_name: formData.applicant_name.trim(),
      });

      setSubmittedRequest(response.data);
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to submit institution addition request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmittedRequest(null);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request Institution Addition"
      subtitle="Submit official college or university details for administrator verification"
    >
      {submittedRequest ? (
        <div className="p-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500">
            <HiOutlineCheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Addition Request Submitted</h4>
            <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
              Your request for <strong className="text-white">{submittedRequest.official_name}</strong> has been assigned tracking ID:
            </p>
            <p className="font-mono text-sm font-bold text-primary-400 my-2">
              {submittedRequest.id}
            </p>
            <p className="text-[11px] text-slate-400">
              An administrator will verify your institution credentials against official government gazettes. Once verified, this institution will be available in the directory and you will be notified at <strong className="text-slate-200">{formData.official_email}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Close & Return to Registration
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 font-semibold flex items-center gap-2">
              <HiOutlineExclamationCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-[11px] flex items-start gap-2">
            <HiOutlineShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Manually submitted institutions are not automatically verified. They are queued for strict administrative accreditation audit.
            </span>
          </div>

          {/* Institution Name */}
          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">
              Official Institution Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.official_name}
              onChange={(e) => setFormData({ ...formData, official_name: e.target.value })}
              placeholder="e.g. Government College of Engineering, Salem"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Type & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">
                Institution Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.institution_type}
                onChange={(e) => setFormData({ ...formData, institution_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              >
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">
                State / Union Territory <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              >
                {STATES_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* District & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">
                District <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="e.g. Salem"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">
                City / Campus Location
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Karuppur"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Affiliating University & AISHE Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">
                Affiliating University (if College)
              </label>
              <input
                type="text"
                value={formData.affiliating_university}
                onChange={(e) => setFormData({ ...formData, affiliating_university: e.target.value })}
                placeholder="e.g. Anna University"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">
                AISHE Code (Optional)
              </label>
              <input
                type="text"
                value={formData.aishe_code}
                onChange={(e) => setFormData({ ...formData, aishe_code: e.target.value })}
                placeholder="e.g. C-12345"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Official Website & UGC Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">
                Official Website URL
              </label>
              <input
                type="url"
                value={formData.official_website}
                onChange={(e) => setFormData({ ...formData, official_website: e.target.value })}
                placeholder="https://gcesalem.edu.in"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">
                UGC Reference / Recognition Details
              </label>
              <input
                type="text"
                value={formData.ugc_reference}
                onChange={(e) => setFormData({ ...formData, ugc_reference: e.target.value })}
                placeholder="UGC Autonomous Conferred / AICTE"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Official Email & Applicant Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">
                Official Institutional Email <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.official_email}
                onChange={(e) => setFormData({ ...formData, official_email: e.target.value })}
                placeholder="principal@college.edu"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">
                Applicant Name & Designation <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.applicant_name}
                onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                placeholder="Dr. K. Ramanathan, Principal"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
              ) : (
                <HiOutlinePaperAirplane className="w-4 h-4" />
              )}
              <span>Submit Addition Request</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
