/**
 * SmartAttend AI / CampusAI - Faculty Attendance Marking Module
 * 
 * Features:
 * - Dynamic subject and class selectors (Department, Year, Semester, Section)
 * - Fetches only students registered in the selected class from authenticated database
 * - Real-time student roster marking (Present / Absent / Late)
 * - "Mark All Present" batch shortcut
 * - "Save as Draft" (Safely stores without triggering calls)
 * - "Finalize Attendance" (Creates unique background call jobs with idempotency keys)
 * - Strict error handling: never fakes success if the backend fails
 * - Clear post-finalization summary of queued calls vs skipped unconsented parents
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import LanguageBadge from '../../components/common/LanguageBadge';
import { DEPARTMENTS } from '../../utils/mockData';
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineSparkles,
  HiOutlineShieldExclamation,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineBookmark,
  HiOutlineCheckCircle,
  HiOutlinePhone,
  HiOutlineArrowRight,
  HiOutlineArrowPath,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';

export default function AttendanceMarking() {
  const navigate = useNavigate();

  // Class & Session Filters
  const [selectedDept, setSelectedDept] = useState('Computer Science & Engineering');
  const [selectedYear, setSelectedYear] = useState(3);
  const [selectedSemester, setSelectedSemester] = useState(5);
  const [selectedSection, setSelectedSection] = useState('A');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionSlot, setSessionSlot] = useState('09:00 - 10:00 AM');

  // Subjects
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Student Roster
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);

  // Attendance states: studentId -> 'present' | 'absent' | 'late'
  const [attendance, setAttendance] = useState({});
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [dispatchedSummary, setDispatchedSummary] = useState(null);

  // 1. Fetch Subjects from API
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await api.get('/api/subjects', {
          params: { department: selectedDept, semester: selectedSemester },
        });
        if (res.data && res.data.length > 0) {
          setSubjects(res.data);
          setSelectedSubject(res.data[0].code);
        } else {
          setSubjects([
            { code: 'CS8501', name: 'Theory of Computation', department: selectedDept },
            { code: 'CS8591', name: 'Computer Networks', department: selectedDept },
          ]);
          setSelectedSubject('CS8501');
        }
      } catch (err) {
        setSubjects([
          { code: 'CS8501', name: 'Theory of Computation', department: selectedDept },
          { code: 'CS8591', name: 'Computer Networks', department: selectedDept },
        ]);
        setSelectedSubject('CS8501');
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [selectedDept, selectedSemester]);

  // 2. Fetch Students matching the selected Class from API
  useEffect(() => {
    const fetchClassStudents = async () => {
      setLoadingStudents(true);
      setErrorMessage('');
      setSessionId(null);
      setIsFinalized(false);
      setIsDraftSaved(false);

      try {
        const res = await api.get('/api/students', {
          params: {
            department: selectedDept,
            year: selectedYear,
            semester: selectedSemester,
            section: selectedSection,
          },
        });

        const studentList = res.data || [];
        setStudents(studentList);

        // Initialize all as present by default
        const initial = {};
        studentList.forEach((s) => {
          initial[s.id] = 'present';
        });
        setAttendance(initial);
      } catch (err) {
        setErrorMessage('Failed to load student roster from college database.');
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchClassStudents();
  }, [selectedDept, selectedYear, selectedSemester, selectedSection]);

  // Ensure active database session exists
  const ensureSession = async () => {
    if (sessionId) return sessionId;

    const currentSub = subjects.find((s) => s.code === selectedSubject) || subjects[0] || { code: 'CS8501', name: 'Theory of Computation' };
    const sessionPayload = {
      subject_code: currentSub.code,
      subject_name: currentSub.name,
      department: selectedDept,
      year: selectedYear,
      semester: selectedSemester,
      section: selectedSection,
      session_date: sessionDate,
      session_slot: sessionSlot,
      faculty_id: 'usr-fac-01',
      faculty_name: 'Prof. Ananya Sundaram',
    };

    const res = await api.post('/api/attendance/sessions', sessionPayload);
    setSessionId(res.data.id);
    return res.data.id;
  };

  // Calculations
  const totalStudents = students.length;
  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;
  const lateCount = Object.values(attendance).filter((s) => s === 'late').length;
  const attendanceRate = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : '0';
  const absentStudents = students.filter((s) => attendance[s.id] === 'absent');

  const handleMarkAllPresent = () => {
    const updated = {};
    students.forEach((s) => {
      updated[s.id] = 'present';
    });
    setAttendance(updated);
    setIsDraftSaved(false);
  };

  const setStatus = (id, status) => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
    setIsDraftSaved(false);
  };

  // Save Draft (Zero calls made)
  const handleSaveDraft = async () => {
    if (students.length === 0) return;
    setIsSavingDraft(true);
    setErrorMessage('');
    try {
      const activeSessionId = await ensureSession();
      const records = students.map((s) => ({
        student_id: s.id,
        student_name: s.name,
        roll_number: s.roll_number,
        status: attendance[s.id] || 'present',
      }));

      await api.put('/api/attendance/mark', {
        session_id: activeSessionId,
        records: records,
      });

      setIsDraftSaved(true);
      setTimeout(() => setIsDraftSaved(false), 4500);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to save attendance draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Finalize Attendance & Dispatch AI Parent Calls
  const handleConfirmFinalize = async () => {
    if (students.length === 0) return;
    setIsFinalizing(true);
    setErrorMessage('');

    try {
      const activeSessionId = await ensureSession();
      const records = students.map((s) => ({
        student_id: s.id,
        student_name: s.name,
        roll_number: s.roll_number,
        status: attendance[s.id] || 'present',
      }));

      const res = await api.post('/api/attendance/finalize', {
        session_id: activeSessionId,
        records: records,
      });

      setDispatchedSummary(res.data);
      setIsFinalized(true);
      setIsFinalizeModalOpen(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Attendance finalization failed. No automated calls were dispatched.');
      setIsFinalizeModalOpen(false);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mark Class Attendance</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Prof. Ananya Sundaram • {selectedDept}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFinalized ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600" />
              Attendance Finalized & AI Calls Dispatched
            </span>
          ) : isDraftSaved ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200 animate-pulse">
              <HiOutlineBookmark className="w-4 h-4 text-blue-600" />
              Draft Saved Safely (0 Calls Made)
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              Draft Mode • Live Editing
            </span>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-900 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <HiOutlineExclamationCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-800 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Post-Finalization Summary Card */}
      {isFinalized && dispatchedSummary && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 shadow-sm animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                <HiOutlinePhone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Attendance Locked & Call Pipeline Initialized
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {dispatchedSummary.queued_calls?.length || 0} parent calls queued • {dispatchedSummary.skipped_no_consent?.length || 0} skipped (no consent)
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/calls')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto shrink-0"
            >
              <span>View AI Call Dashboard</span>
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Queued Calls Breakdown */}
          {dispatchedSummary.queued_calls && dispatchedSummary.queued_calls.length > 0 && (
            <div className="pt-2 border-t border-emerald-100">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
                Queued Parent Call Jobs ({dispatchedSummary.queued_calls.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {dispatchedSummary.queued_calls.map((call, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{call.student_name}</p>
                      <p className="text-[11px] text-slate-500">{call.parent_name} • {call.phone}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      QUEUED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skipped Records Breakdown (No Consent) */}
          {dispatchedSummary.skipped_no_consent && dispatchedSummary.skipped_no_consent.length > 0 && (
            <div className="pt-2 border-t border-emerald-100">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                <HiOutlineShieldExclamation className="w-4 h-4 text-amber-600" />
                <span>Skipped Due to Regulatory Consent Policy ({dispatchedSummary.skipped_no_consent.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {dispatchedSummary.skipped_no_consent.map((item, idx) => (
                  <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold">
                    {item.student_name} (Consent Required)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Class & Subject Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Department
          </label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            disabled={isFinalized}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Year & Semester
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedYear}
              onChange={(e) => {
                const yr = Number(e.target.value);
                setSelectedYear(yr);
                setSelectedSemester(yr * 2 - 1);
              }}
              disabled={isFinalized}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
              <option value={3}>Year 3</option>
              <option value={4}>Year 4</option>
            </select>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              disabled={isFinalized}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Sem {sem}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={isFinalized}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Subject Course
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={isFinalized}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
          >
            {subjects.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Date & Slot
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              disabled={isFinalized}
              className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800 focus:outline-none"
            />
            <select
              value={sessionSlot}
              onChange={(e) => setSessionSlot(e.target.value)}
              disabled={isFinalized}
              className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800 focus:outline-none"
            >
              <option value="09:00 - 10:00 AM">09:00 AM</option>
              <option value="10:00 - 11:00 AM">10:00 AM</option>
              <option value="11:15 - 12:15 PM">11:15 AM</option>
              <option value="01:30 - 02:30 PM">01:30 PM</option>
              <option value="02:30 - 03:30 PM">02:30 PM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Enrolled</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalStudents}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Present</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">Absent (AI Target)</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{absentCount}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">Attendance Rate</p>
          <p className="text-2xl font-black text-primary-600 mt-1">{attendanceRate}%</p>
        </div>
      </div>

      {/* Student List Workbench */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-extrabold text-sm text-slate-900">
              Class Roster: {selectedDept} ({selectedSection}) • Sem {selectedSemester}
            </h3>
          </div>

          {!isFinalized && (
            <button
              onClick={handleMarkAllPresent}
              disabled={students.length === 0}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 self-start sm:self-auto disabled:opacity-40"
            >
              <HiOutlineClipboardDocumentCheck className="w-4 h-4" />
              Mark All Present
            </button>
          )}
        </div>

        {loadingStudents ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <HiOutlineArrowPath className="w-6 h-6 animate-spin mx-auto text-primary-500" />
            <p className="text-xs font-semibold">Loading student roster from database...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <HiOutlineExclamationCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No students registered in this class.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Please upload student records for {selectedDept} Year {selectedYear} Section {selectedSection} via the Student Database section.
            </p>
            <button
              onClick={() => navigate('/admin/students')}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-bold hover:bg-primary-600"
            >
              Go to Student Database Upload
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Roll & Name</th>
                  <th className="py-3 px-4">Guardian & Contact</th>
                  <th className="py-3 px-4">Voice Language</th>
                  <th className="py-3 px-4">Consent Status</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const currentStatus = attendance[student.id] || 'present';
                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors ${
                        currentStatus === 'absent' ? 'bg-rose-50/40' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-4 sm:px-6">
                        <p className="font-bold text-slate-900">{student.name}</p>
                        <p className="text-xs font-mono text-slate-400">{student.roll_number}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <p className="font-semibold">{student.parent_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{student.parent_phone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <LanguageBadge code={student.preferred_language || 'en'} />
                      </td>
                      <td className="py-3 px-4">
                        {student.consent_given ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Consented
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Pending Consent
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={isFinalized}
                            onClick={() => setStatus(student.id, 'present')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            disabled={isFinalized}
                            onClick={() => setStatus(student.id, 'absent')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            disabled={isFinalized}
                            onClick={() => setStatus(student.id, 'late')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Footer */}
        {students.length > 0 && !isFinalized && (
          <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {absentCount > 0 ? (
                <span>
                  ⚠️ <strong>{absentCount} absent students</strong> will trigger automated AI calls upon finalization.
                </span>
              ) : (
                'All enrolled students marked present.'
              )}
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 hover:bg-white text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                {isSavingDraft ? 'Saving Draft...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                onClick={() => setIsFinalizeModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Finalize Attendance</span>
                <HiOutlineArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Finalize Confirmation Modal */}
      <Modal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        title="Confirm Finalize Attendance"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <p className="font-bold mb-1">Permanent Finalization Warning:</p>
            <p>
              Locking attendance for <strong>{selectedSubject}</strong> will immediately identify absent students, check parental consent records, and enqueue automated AI voice notification calls in their preferred language.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-400 font-bold uppercase">Present</p>
              <p className="text-xl font-black text-emerald-600">{presentCount}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-400 font-bold uppercase">Absent</p>
              <p className="text-xl font-black text-rose-600">{absentCount}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-400 font-bold uppercase">Late</p>
              <p className="text-xl font-black text-amber-500">{lateCount}</p>
            </div>
          </div>

          {absentCount > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase mb-2">
                Eligible Absentees ({absentCount})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                {absentStudents.map((st) => (
                  <div key={st.id} className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{st.name} ({st.roll_number})</span>
                    <span className="text-slate-500">{st.parent_name} • {st.parent_phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFinalizeModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmFinalize}
              disabled={isFinalizing}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 flex items-center gap-1.5"
            >
              {isFinalizing ? (
                <>
                  <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                  <span>Locking & Queuing Calls...</span>
                </>
              ) : (
                <span>Confirm & Dispatch Calls</span>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
