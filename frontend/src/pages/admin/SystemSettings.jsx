/**
 * SmartAttend AI - System Configuration & Telephony Settings
 */

import { useState } from 'react';
import { MOCK_SETTINGS } from '../../utils/mockData';
import {
  HiOutlineCog6Tooth,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineCheck,
} from 'react-icons/hi2';

export default function SystemSettings() {
  const [settings, setSettings] = useState(MOCK_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings & Voice Engine</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure AI calling parameters, compliance guardrails, telephony gateways, and operational hours.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl font-semibold flex items-center gap-2">
          <HiOutlineCheck className="w-5 h-5 text-emerald-600" />
          Settings persisted successfully to system configuration.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Voice Calling Safeguards & Simulation */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <HiOutlineShieldCheck className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-slate-900 text-base">Telephony Operational Safety & Mode</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div>
              <h4 className="text-sm font-bold text-amber-950">Simulated Calling Mode (Sandbox)</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Executes the complete AI speech dialog and records transcripts without placing real phone calls.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.simulated_calling_mode}
                onChange={(e) =>
                  setSettings({ ...settings, simulated_calling_mode: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Calling Window Start (Local Time)
              </label>
              <input
                type="time"
                value={settings.calling_window_start}
                onChange={(e) =>
                  setSettings({ ...settings, calling_window_start: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Calling Window End (Local Time)
              </label>
              <input
                type="time"
                value={settings.calling_window_end}
                onChange={(e) =>
                  setSettings({ ...settings, calling_window_end: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Retry & Escalation Engine */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <HiOutlinePhone className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-slate-900 text-base">Unanswered Call Retry Policy</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Maximum Retry Attempts
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={settings.max_retries}
                onChange={(e) =>
                  setSettings({ ...settings, max_retries: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Prevents repeated harassment to guardians.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Retry Interval (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.retry_interval_minutes}
                onChange={(e) =>
                  setSettings({ ...settings, retry_interval_minutes: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800">SMS / WhatsApp Fallback Notification</h4>
              <p className="text-[11px] text-slate-400">
                Dispatches text notice if phone call remains unanswered after maximum retries.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.sms_fallback_enabled}
              onChange={(e) =>
                setSettings({ ...settings, sms_fallback_enabled: e.target.checked })
              }
              className="w-4 h-4 text-primary-600 rounded-sm"
            />
          </div>
        </div>

        {/* AI Engine Providers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <HiOutlineSparkles className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-slate-900 text-base">Integrated Providers</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Speech & Voice Synthesis</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{settings.speech_engine}</p>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-1">● 6 Languages Ready</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Telephony Gateway</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{settings.telephony_provider}</p>
              <span className="text-[11px] text-blue-600 font-semibold block mt-1">● Webhook Listening</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all"
          >
            Save All Configurations
          </button>
        </div>
      </form>
    </div>
  );
}
