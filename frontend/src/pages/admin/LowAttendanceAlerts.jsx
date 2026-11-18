/**
 * SmartAttend AI - Low Attendance Alerts & Debarment Prevention
 */

import { useState } from 'react';
import { MOCK_STUDENTS } from '../../utils/mockData';
import LanguageBadge from '../../components/common/LanguageBadge';
import {
  HiOutlineExclamationTriangle,
  HiOutlinePaperAirplane,
  HiOutlinePhone,
  HiOutlineEnvelope,
} from 'react-icons/hi2';

export default function LowAttendanceAlerts() {
  const [students, setStudents] = useState(
    MOCK_STUDENTS.filter((s) => s.attendance_pct < 75)
  );
  const [notificationSent, setNotificationSent] = useState(false);

  const handleSendBatchAlert = () => {
    setNotificationSent(true);
    setTimeout(() => setNotificationSent(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Low Attendance Warning Portal</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated monitoring for students falling below the mandatory 75% university threshold.
          </p>
        </div>
        <button
          onClick={handleSendBatchAlert}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all self-start sm:self-auto"
        >
          <HiOutlinePaperAirplane className="w-4 h-4" />
          Send Batch Warning to Parents
        </button>
      </div>

      {notificationSent && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl font-semibold flex items-center gap-2 animate-fade-in">
          <span>✓</span>
          <span>Official warning dispatches sent to {students.length} parents via AI telephone & registered SMS.</span>
        </div>
      )}

      {/* Warning Cards List */}
      <div className="space-y-4">
        {students.map((student) => (
          <div
            key={student.id}
            className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-black text-lg shrink-0">
                <HiOutlineExclamationTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{student.name}</h3>
                  <span className="font-mono text-xs text-slate-400">({student.roll})</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {student.department} • {student.section}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span>Parent: <strong className="text-slate-800">{student.parent_name}</strong></span>
                  <span className="font-mono">{student.parent_phone}</span>
                  <LanguageBadge code={student.parent_lang} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block uppercase font-bold">Current Attendance</span>
                <span className="text-2xl font-black text-rose-600">{student.attendance_pct.toFixed(1)}%</span>
                <span className="text-[10px] text-rose-700 block font-semibold">
                  {(75.0 - student.attendance_pct).toFixed(1)}% below cutoff
                </span>
              </div>

              <button className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors">
                Schedule Parent Call
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
