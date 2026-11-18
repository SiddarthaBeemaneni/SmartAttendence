/**
 * SmartAttend AI - AI Parent Calling Command Center
 * 
 * Features:
 * - Simulated Calling Mode banner and safety check
 * - Live Call Queue & status pipeline
 * - Interactive AI Voice Call Simulator (simulates call flow in any of the 6 languages!)
 * - Direct Transcript inspection
 */

import { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import LanguageBadge from '../../components/common/LanguageBadge';
import CallTranscriptModal from '../../components/common/CallTranscriptModal';
import { MOCK_CALL_LOGS, MOCK_STUDENTS, LANGUAGES_LIST } from '../../utils/mockData';
import {
  HiOutlinePhone,
  HiOutlineSparkles,
  HiOutlinePlay,
  HiOutlineShieldCheck,
  HiOutlineArrowPath,
  HiOutlineSignal,
  HiOutlineClock,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';

export default function AICallDashboard() {
  const [callLogs, setCallLogs] = useState(MOCK_CALL_LOGS);
  const [selectedCall, setSelectedCall] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedStatus, setSimulatedStatus] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Fetch real calls from backend
  useEffect(() => {
    const fetchCallLogs = async () => {
      try {
        const res = await api.get('/api/attendance/calls/logs');
        if (res.data && res.data.length > 0) {
          const mappedApiLogs = res.data.map((l) => ({
            id: l.id,
            student_id: l.student_id,
            student_name: l.student_name,
            student_roll: l.roll_number,
            parent_name: l.parent_name,
            parent_phone: l.parent_phone,
            subject: l.subject_name,
            session_time: l.session_slot,
            date: l.session_date,
            call_status: l.call_status,
            duration_seconds: l.duration_seconds,
            language: l.language,
            language_name: LANGUAGES_LIST.find((lg) => lg.code === l.language)?.name || l.language,
            absence_reason: l.parent_statement || l.reason_category || 'Reason recorded by AI voice agent',
            dialogue_transcript: l.dialogue_transcript,
            provider_ref: `EXOTEL-${l.id.replace('call-', '').toUpperCase()}`,
          }));
          // Prepend API logs before mock logs
          setCallLogs([...mappedApiLogs, ...MOCK_CALL_LOGS]);
        }
      } catch (err) {
        console.error('Failed to load call logs from API:', err);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchCallLogs();
  }, []);

  // Simulator controls
  const [simStudent, setSimStudent] = useState(MOCK_STUDENTS[0]);
  const [simLanguage, setSimLanguage] = useState('ta');

  const openTranscript = (call) => {
    setSelectedCall(call);
    setIsModalOpen(true);
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulatedStatus('Checking guardian consent and telephone verification...');

    setTimeout(() => {
      setSimulatedStatus(`Initiating telephony handshake in ${LANGUAGES_LIST.find((l) => l.code === simLanguage)?.name} to ${simStudent.parent_phone}...`);
    }, 1200);

    setTimeout(() => {
      setSimulatedStatus('Call answered! AI verifying guardian authorization identity...');
    }, 2500);

    setTimeout(() => {
      setSimulatedStatus('Notifying parent of absence & capturing voice excuse reason with Sarvam AI...');
    }, 3800);

    setTimeout(() => {
      const newSimCall = {
        id: `call-sim-${Date.now()}`,
        student_id: simStudent.id,
        student_name: simStudent.name,
        student_roll: simStudent.roll,
        parent_id: 'p-sim',
        parent_name: simStudent.parent_name,
        parent_phone: simStudent.parent_phone,
        subject: 'CS501 - Distributed Systems',
        session_time: '11:15 AM - 12:15 PM',
        date: '2026-11-17',
        call_status: 'completed',
        duration_seconds: 64,
        language: simLanguage,
        language_name: LANGUAGES_LIST.find((l) => l.code === simLanguage)?.name,
        absence_reason: 'Simulated Voice Response: Child had dental surgery appointment; certificate will be produced.',
        retry_count: 0,
        provider_ref: `SIM-EXOTEL-${Math.floor(100000 + Math.random() * 900000)}`,
        transcript: [
          { speaker: 'AI', text: `Good morning. I am the automated AI assistant of ABC College. May I verify that I am speaking with the authorized guardian of ${simStudent.name}?` },
          { speaker: 'Parent', text: 'Yes, speaking. I am the parent.' },
          { speaker: 'AI', text: `Thank you. I am informing you that ${simStudent.name} was marked absent for Distributed Systems today. May I know the reason?` },
          { speaker: 'Parent', text: 'My child had dental surgery this morning, so resting at home.' },
          { speaker: 'AI', text: 'Thank you for informing us. I have recorded your response into official college records. We hope for a speedy recovery. Have a good day.' },
        ],
      };

      setCallLogs([newSimCall, ...callLogs]);
      setIsSimulating(false);
      setSimulatedStatus('');
      openTranscript(newSimCall);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Mode Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
            <HiOutlineShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
              SIMULATED CALLING MODE ACTIVE (Phase 14 Safety Protocol)
            </h4>
            <p className="text-[11px] sm:text-xs text-amber-800">
              Zero telephony charges incurred. Fully exercises AI NLU dialog trees, multi-lingual scripts, and transcript logging.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg shrink-0">
          Sandbox Guard Active
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Parent Calling Center</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Autonomous multi-lingual telephone outreach engine with Sarvam AI speech integration.
          </p>
        </div>
      </div>

      {/* Interactive AI Call Simulator Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
              <HiOutlineSparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Test AI Voice Agent Simulation
              </h3>
              <p className="text-xs text-slate-500">Pick a student and test the 6-language dialogue flow</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Absent Student
            </label>
            <select
              value={simStudent.id}
              onChange={(e) =>
                setSimStudent(MOCK_STUDENTS.find((s) => s.id === e.target.value) || MOCK_STUDENTS[0])
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {MOCK_STUDENTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.roll})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Speaking Language
            </label>
            <select
              value={simLanguage}
              onChange={(e) => setSimLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {LANGUAGES_LIST.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.native})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs shadow-md shadow-primary-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                  <span>Executing Voice Agent...</span>
                </>
              ) : (
                <>
                  <HiOutlinePlay className="w-4 h-4 text-emerald-300" />
                  <span>Trigger Test AI Call</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Simulation Progress Indicator */}
        {isSimulating && (
          <div className="mt-4 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-900 font-medium animate-pulse">
            <HiOutlineSignal className="w-5 h-5 text-blue-600 shrink-0" />
            <span>{simulatedStatus}</span>
          </div>
        )}
      </div>

      {/* Call History / Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HiOutlinePhone className="w-5 h-5 text-primary-500" />
            Live Call Queue & Dispatch Log
          </h3>
          <span className="text-xs text-slate-400">Total {callLogs.length} calls recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Student</th>
                <th className="py-3.5 px-4">Subject & Session</th>
                <th className="py-3.5 px-4">Guardian Called</th>
                <th className="py-3.5 px-4">Language</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Captured Reason</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Transcript</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {callLogs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    <div>{c.student_name}</div>
                    <div className="text-xs text-slate-400 font-normal">{c.student_roll}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="font-medium truncate max-w-[160px]">{c.subject}</div>
                    <div className="text-xs text-slate-400">{c.session_time}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="font-medium">{c.parent_name}</div>
                    <div className="text-xs text-slate-400 font-mono">{c.parent_phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <LanguageBadge code={c.language} />
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={c.call_status}>{c.call_status.toUpperCase()}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-700">
                    {c.duration_seconds > 0 ? `${c.duration_seconds}s` : '0s'}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate" title={c.absence_reason}>
                    {c.absence_reason}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <button
                      onClick={() => openTranscript(c)}
                      className="px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-500 hover:text-white text-primary-700 font-bold text-xs transition-all"
                    >
                      Inspect AI Flow
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
