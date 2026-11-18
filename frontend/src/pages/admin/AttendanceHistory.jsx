/**
 * SmartAttend AI - Attendance History & Audit Trail
 */

import { useState } from 'react';
import Badge from '../../components/common/Badge';
import { MOCK_STUDENTS, MOCK_SUBJECTS } from '../../utils/mockData';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineArrowDownTray,
  HiOutlineFunnel,
  HiOutlineCalendar,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';

export default function AttendanceHistory() {
  const [selectedDate, setSelectedDate] = useState('2026-11-17');
  const [selectedSubject, setSelectedSubject] = useState('CS501');

  // Generate historical attendance records
  const records = MOCK_STUDENTS.map((s, index) => {
    const isAbsent = index === 0 || index === 2 || index === 7;
    const isLate = index === 5;
    return {
      id: `att-${index}`,
      student_name: s.name,
      roll_no: s.roll,
      date: selectedDate,
      subject_code: selectedSubject,
      subject_name: 'Distributed Systems & Microservices',
      session_time: '09:00 AM - 10:00 AM',
      status: isAbsent ? 'absent' : isLate ? 'late' : 'present',
      marked_by: 'Prof. Ananya Sundaram (FAC-CSE-042)',
      finalized_at: '2026-11-17 10:05 AM',
      call_placed: isAbsent,
    };
  });

  const handleExportCSV = () => {
    const headers = 'Roll No,Student Name,Subject,Date,Status,Marked By,Finalized At\n';
    const rows = records
      .map(
        (r) =>
          `"${r.roll_no}","${r.student_name}","${r.subject_code}","${r.date}","${r.status}","${r.marked_by}","${r.finalized_at}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedSubject}_${selectedDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Master Archive</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historical attendance session records, modifier audit trails, and verified call triggers.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <HiOutlineArrowDownTray className="w-4 h-4" />
          Export Session to CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <HiOutlineCalendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <HiOutlineFunnel className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            {MOCK_SUBJECTS.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500 flex items-center gap-1.5">
          <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Cryptographically Sealed Session</span>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Roll & Student</th>
                <th className="py-3.5 px-4">Subject & Session</th>
                <th className="py-3.5 px-4">Attendance Status</th>
                <th className="py-3.5 px-4">AI Call Dispatched</th>
                <th className="py-3.5 px-4">Finalized Timestamp</th>
                <th className="py-3.5 px-4 sm:px-6">Audit Trail / Marked By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6">
                    <p className="font-bold text-slate-900">{r.student_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{r.roll_no}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <p className="font-semibold text-primary-700">{r.subject_code}</p>
                    <p className="text-xs text-slate-400">{r.session_time}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={r.status}>{r.status.toUpperCase()}</Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    {r.call_placed ? (
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        AI Call Triggered
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">N/A (Present)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                    {r.finalized_at}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-600 truncate max-w-xs">
                    {r.marked_by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
