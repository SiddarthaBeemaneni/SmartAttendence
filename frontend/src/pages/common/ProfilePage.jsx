/**
 * SmartAttend AI - Universal User Profile & Preference Settings
 * 
 * Implements Section 3 requirement:
 * - "Do not guess a parent's gender from their voice. Store their preferred form of address in their profile instead."
 * - Preferred Language configuration across all 6 Indian languages.
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LANGUAGES_LIST } from '../../utils/mockData';
import {
  HiOutlineUserCircle,
  HiOutlineCheck,
  HiOutlineLanguage,
  HiOutlinePhone,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [formAddress, setFormAddress] = useState(user?.title || 'Mr.');
  const [preferredLang, setPreferredLang] = useState(user?.preferred_language || 'ta');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [name, setName] = useState(user?.name || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUser({
      title: formAddress,
      preferred_language: preferredLang,
      phone,
      name,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account & Voice Preferences</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Update your form of address, preferred AI speech language, and verified contact channels.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl font-semibold flex items-center gap-2">
          <HiOutlineCheck className="w-5 h-5 text-emerald-600" />
          Profile and speech preferences saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity & Address Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
              <HiOutlineUserCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Identity & Salutation</h3>
              <p className="text-xs text-slate-400">Explicitly chosen form of address for AI voice greetings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Form of Address
              </label>
              <select
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none"
              >
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
                <option value="Prof.">Prof.</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Used during AI call greetings.</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Verified Mobile Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* 6-Language Preference */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
              <HiOutlineLanguage className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">AI Voice Synthesis Language</h3>
              <p className="text-xs text-slate-400">Language spoken by the college AI voice agent during notifications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LANGUAGES_LIST.map((lang) => (
              <label
                key={lang.code}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  preferredLang === lang.code
                    ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500 text-primary-950 font-bold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                  <span className="opacity-70 text-xs">({lang.native})</span>
                </div>
                <input
                  type="radio"
                  name="userProfileLang"
                  value={lang.code}
                  checked={preferredLang === lang.code}
                  onChange={(e) => setPreferredLang(e.target.value)}
                  className="text-primary-600 focus:ring-primary-500"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all"
          >
            Update Profile & Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
