/**
 * SmartAttend AI - Faculty Dashboard
 */

import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { MOCK_SUBJECTS, MOCK_TIMETABLE } from '../../utils/mockData';
import {
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentList,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

export default function FacultyDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Faculty Teaching Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome, Prof. Ananya Sundaram (FAC-CSE-042) • Computer Science & Engineering
          </p>
        </div>
        <button
          onClick={() => navigate('/faculty/attendance')}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all self-start sm:self-auto"
        >
          <HiOutlineClipboardDocumentList className="w-4 h-4" />
          Mark Attendance Now
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Assigned Subjects"
          value="2"
          change="CSE-5A & 5B"
          changeType="positive"
          icon={HiOutlineBookOpen}
          color="blue"
        />
        <StatCard
          title="Classes Scheduled Today"
          value="2"
          change="09:00 AM & 01:30 PM"
          changeType="positive"
          icon={HiOutlineCalendarDays}
          color="purple"
        />
        <StatCard
          title="Attendance Finalized"
          value="1 / 2"
          change="1 Pending"
          changeType="positive"
          icon={HiOutlineCheckCircle}
          color="green"
        />
        <StatCard
          title="Absences Logged Today"
          value="3"
          change="AI Calling Done"
          changeType="negative"
          icon={HiOutlineClipboardDocumentList}
          color="red"
        />
      </div>

      {/* Two Column Layout: Today's Schedule & Quick Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Lecture Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HiOutlineClock className="w-5 h-5 text-primary-500" />
              Today's Teaching Sessions (Monday)
            </h3>
            <span className="text-xs text-slate-400">Class Section: CSE-5A</span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase px-2 py-0.5 rounded-md bg-emerald-100">
                  Completed & Finalized
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                  CS501 - Distributed Systems & Microservices
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  09:00 AM - 10:00 AM • Classroom C-302 • 59 / 62 Present
                </p>
              </div>
              <button
                onClick={() => navigate('/faculty/history')}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
              >
                Review Log
              </button>
            </div>

            <div className="p-4 rounded-xl border border-primary-200 bg-primary-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-primary-800 uppercase px-2 py-0.5 rounded-md bg-primary-100">
                  Upcoming Session
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                  CS501 - Distributed Systems Practical Lab
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  01:30 PM - 03:30 PM • Systems Computing Lab 4
                </p>
              </div>
              <button
                onClick={() => navigate('/faculty/attendance')}
                className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-sm self-start sm:self-auto"
              >
                Take Attendance
              </button>
            </div>
          </div>
        </div>

        {/* Assigned Courses Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HiOutlineBookOpen className="w-5 h-5 text-primary-500" />
              My Courses
            </h3>

            <div className="space-y-3">
              {MOCK_SUBJECTS.slice(0, 2).map((sub) => (
                <div key={sub.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="font-mono text-primary-700">{sub.code}</span>
                    <span className="text-emerald-700">{sub.avg_attendance}% Avg</span>
                  </div>
                  <p className="font-semibold text-slate-800 mt-1 truncate">{sub.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {sub.total_sessions_held} sessions completed
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/faculty/attendance')}
            className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Open Attendance Workbench</span>
            <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
