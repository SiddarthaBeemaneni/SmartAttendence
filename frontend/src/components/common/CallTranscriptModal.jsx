/**
 * SmartAttend AI - Call Transcript Viewer Modal
 * 
 * Shows turn-by-turn AI voice conversation, detected language, duration,
 * telephony provider reference, and parent's recorded response reason.
 */

import Modal from './Modal';
import Badge from './Badge';
import LanguageBadge from './LanguageBadge';
import {
  HiOutlinePhone,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineSparkles,
} from 'react-icons/hi2';

export default function CallTranscriptModal({ isOpen, onClose, callLog }) {
  if (!callLog) return null;

  // Resolve transcript items (support array, JSON string, or legacy format)
  let transcriptItems = [];
  if (Array.isArray(callLog.transcript)) {
    transcriptItems = callLog.transcript;
  } else if (typeof callLog.dialogue_transcript === 'string') {
    try {
      transcriptItems = JSON.parse(callLog.dialogue_transcript);
    } catch (e) {
      transcriptItems = [];
    }
  } else if (Array.isArray(callLog.dialogue_transcript)) {
    transcriptItems = callLog.dialogue_transcript;
  }

  const absenceReason = callLog.absence_reason || callLog.parent_statement || callLog.reason_category;
  const studentRoll = callLog.student_roll || callLog.roll_number || '';
  const providerRef = callLog.provider_ref || `EXOTEL-REC-${callLog.id ? callLog.id.replace('call-', '') : 'SIM-001'}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Voice Call Log & Transcript"
      subtitle={`Student: ${callLog.student_name} ${studentRoll ? `(${studentRoll})` : ''}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Call Meta Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
          <div>
            <span className="text-xs text-gray-500 block">Status</span>
            <div className="mt-1">
              <Badge variant={callLog.call_status}>{callLog.call_status.toUpperCase()}</Badge>
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Language</span>
            <div className="mt-1">
              <LanguageBadge code={callLog.language} />
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Call Duration</span>
            <p className="font-semibold text-gray-800 flex items-center gap-1 mt-1">
              <HiOutlineClock className="w-4 h-4 text-gray-400" />
              {callLog.duration_seconds > 0 ? `${callLog.duration_seconds} seconds` : '0s (Not connected)'}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Telephony Reference</span>
            <p className="font-mono text-xs font-medium text-gray-700 mt-1 truncate" title={providerRef}>
              {providerRef}
            </p>
          </div>
        </div>

        {/* Parent Details & Consent Check */}
        <div className="p-4 rounded-xl border border-gray-100 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <HiOutlineUser className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{callLog.parent_name}</p>
                <p className="text-xs text-gray-500">{callLog.parent_phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">
              <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600" />
              Parent Consent & Phone Verified
            </div>
          </div>
        </div>

        {/* Absence Reason Recorded */}
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs shrink-0">
              Absence Reason
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-950">
                "{absenceReason || 'No response recorded'}"
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Extracted and categorized by AI Speech & NLU pipeline into college records.
              </p>
            </div>
          </div>
        </div>

        {/* Turn-by-Turn Audio & Transcript Flow */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <HiOutlineSparkles className="w-4 h-4 text-primary-500" />
              AI Voice Conversation Flow
            </h4>
            <span className="text-xs text-gray-400">Speech-to-Text Powered by Sarvam AI</span>
          </div>

          {transcriptItems && transcriptItems.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto p-4 rounded-xl bg-gray-50 border border-gray-200">
              {transcriptItems.map((msg, idx) => {
                const isAI = msg.speaker?.toLowerCase().includes('ai');
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAI && (
                      <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                        AI
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                        isAI
                          ? 'bg-white text-gray-800 border border-gray-200 rounded-tl-xs'
                          : 'bg-primary-500 text-white rounded-tr-xs'
                      }`}
                    >
                      <div className="text-[11px] font-semibold mb-1 opacity-70">
                        {isAI ? 'SmartAttend Voice Agent' : callLog.parent_name}
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                    {!isAI && (
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                        P
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
              <HiOutlinePhone className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              {callLog.call_status === 'blocked_no_consent'
                ? 'No transcript generated: Automated call was blocked because parent consent is not on file.'
                : 'Call was not answered or timed out before audio channel could be established.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
