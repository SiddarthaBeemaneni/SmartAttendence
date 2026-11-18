/**
 * SmartAttend AI - Parent & Guardian Dashboard
 * 
 * Features:
 * - Child's live attendance monitoring
 * - Automated AI phone calls received log
 * - View speech conversation transcripts with the college AI assistant
 * - Update absence excuse remarks
 * - Configure preferred voice language (Tamil, English, Telugu, Hindi, Malayalam, Kannada)
 */

import { useState } from 'react';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import LanguageBadge from '../../components/common/LanguageBadge';
import CallTranscriptModal from '../../components/common/CallTranscriptModal';
import { MOCK_CALL_LOGS, LANGUAGES_LIST } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineClipboardDocumentList,
  HiOutlineLanguage,
  HiOutlineSparkles,
  HiOutlineExclamationTriangle,
  HiOutlineCheck,
} from 'react-icons/hi2';

export default function ParentDashboard() {
  const { user, updateUser } = useAuth();
  const [selectedCall, setSelectedCall] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preferredLang, setPreferredLang] = useState(user?.preferred_language || 'ta');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Calls received for Karthik
  const myCalls = MOCK_CALL_LOGS.filter((c) => c.student_roll === '2023-CSE-089');

  const openTranscript = (call) => {
    setSelectedCall(call);
    setIsModalOpen(true);
  };

  const handleSaveLanguage = (e) => {
    e.preventDefault();
    updateUser({ preferred_language: preferredLang });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Parent & Guardian Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Guardian of: <strong className="text-slate-800">Karthik Subramanian (2023-CSE-089)</strong> • CSE Semester 5
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
            ✓ Automated Voice Calling Authorized
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Child's Current Attendance"
          value="72.4%"
          change="Need 75% for Exams"
          changeType="negative"
          icon={HiOutlineClipboardDocumentList}
          color="red"
        />
        <StatCard
          title="AI Notifications Received"
          value={myCalls.length.toString()}
          change="All Completed"
          changeType="positive"
          icon={HiOutlinePhone}
          color="cyan"
        />
        <StatCard
          title="Preferred Language"
          value={LANGUAGES_LIST.find((l) => l.code === preferredLang)?.name || 'Tamil'}
          change="Sarvam Voice Synthesis"
          changeType="positive"
          icon={HiOutlineLanguage}
          color="purple"
        />
        <StatCard
          title="Verified Guardian Mobile"
          value="+91 98410..."
          change="OTP Confirmed"
          changeType="positive"
          icon={HiOutlineUser}
          color="green"
        />
      </div>

      {/* Low Attendance Alert for Child */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <HiOutlineExclamationTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">
              Attendance Alert: Karthik's attendance (72.4%) is currently below the mandatory 75%
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Please ensure Karthik attends upcoming classes to maintain eligibility for semester examinations.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Section: AI Calls Received & Language Preference Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calls Log Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HiOutlinePhone className="w-5 h-5 text-primary-500" />
              AI Phone Calls Received From College
            </h3>
            <span className="text-xs text-slate-400">{myCalls.length} calls logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Session</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Recorded Reason</th>
                  <th className="py-3 px-4 text-right">Transcript</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{call.date}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{call.session_time}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{call.subject}</td>
                    <td className="py-3.5 px-4">
                      <LanguageBadge code={call.language} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={call.absence_reason}>
                      {call.absence_reason}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openTranscript(call)}
                        className="px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-500 hover:text-white text-primary-700 font-bold text-xs transition-all"
                      >
                        View Transcript
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Language Preference Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
              <HiOutlineLanguage className="w-5 h-5 text-primary-500" />
              AI Voice Language
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select which language the college AI voice agent should speak when calling you.
            </p>

            {savedSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold flex items-center gap-1.5">
                <HiOutlineCheck className="w-4 h-4 text-emerald-600" />
                Language preference saved!
              </div>
            )}

            <form onSubmit={handleSaveLanguage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Preferred Language (6 Supported)
                </label>
                <div className="space-y-2">
                  {LANGUAGES_LIST.map((lang) => (
                    <label
                      key={lang.code}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        preferredLang === lang.code
                          ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500 text-primary-950 font-bold'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-xs">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                        <span className="opacity-70 font-normal">({lang.native})</span>
                      </div>
                      <input
                        type="radio"
                        name="preferredLang"
                        value={lang.code}
                        checked={preferredLang === lang.code}
                        onChange={(e) => setPreferredLang(e.target.value)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs shadow-md shadow-primary-500/20 transition-all"
              >
                Save Voice Preference
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Transcript Modal */}
      <CallTranscriptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        callLog={selectedCall}
      />
    </div>
  );
}
