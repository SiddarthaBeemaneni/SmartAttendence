/**
 * SmartAttend AI - Student Dashboard
 * 
 * Features:
 * - Overall attendance gauge & progress
 * - Subject-wise attendance breakdown with warning indicators (< 75%)
 * - Absence history & faculty remarks
 * - Exam eligibility status
 */

import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { MOCK_STUDENT_SUBJECT_ATTENDANCE } from '../../utils/mockData';
import {
  HiOutlineChartBar,
  HiOutlineAcademicCap,
  HiOutlineExclamationTriangle,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

export default function StudentDashboard() {
  const overallPct = 72.4;
  const isEligible = overallPct >= 75.0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Academic & Attendance Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Karthik Subramanian • 2023-CSE-089 • Semester 5 Section A
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
            isEligible
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
          }`}
        >
          {isEligible ? (
            <>
              <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600" />
              Eligible for End-Semester Examinations
            </>
          ) : (
            <>
              <HiOutlineExclamationTriangle className="w-4 h-4 text-rose-600" />
              Attendance Warning: Below 75% Cutoff
            </>
          )}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Overall Attendance"
          value="72.4%"
          change="Need 75% Cutoff"
          changeType="negative"
          icon={HiOutlineChartBar}
          color="red"
        />
        <StatCard
          title="Total Lectures Conducted"
          value="160"
          change="5 Enrolled Courses"
          changeType="positive"
          icon={HiOutlineCalendarDays}
          color="blue"
        />
        <StatCard
          title="Total Classes Attended"
          value="118"
          change="Attended"
          changeType="positive"
          icon={HiOutlineAcademicCap}
          color="green"
        />
        <StatCard
          title="Sessions Missed"
          value="42"
          change="Calls Placed to Parent"
          changeType="negative"
          icon={HiOutlineExclamationTriangle}
          color="orange"
        />
      </div>

      {/* Subject-Wise Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Subject-Wise Attendance Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Must maintain 75% minimum in every enrolled course to appear for exams
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Course Code & Name</th>
                <th className="py-3.5 px-4">Held</th>
                <th className="py-3.5 px-4">Attended</th>
                <th className="py-3.5 px-4">Attendance %</th>
                <th className="py-3.5 px-4">Exam Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_STUDENT_SUBJECT_ATTENDANCE.map((sub) => (
                <tr key={sub.code} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6">
                    <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md mr-2">
                      {sub.code}
                    </span>
                    <span className="font-bold text-slate-900">{sub.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{sub.held}</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-700">{sub.attended}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            sub.pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${sub.pct}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-slate-800">{sub.pct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {sub.pct >= 75 ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Eligible
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        Debarment Warning
                      </span>
                    )}
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
