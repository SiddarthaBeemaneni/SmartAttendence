/**
 * SmartAttend AI - Reports & Deep Analytics Page
 */

import {
  MOCK_ATTENDANCE_ANALYTICS,
  MOCK_STUDENTS,
  DEPARTMENTS,
} from '../../utils/mockData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  HiOutlineChartBar,
  HiOutlineDocumentArrowDown,
  HiOutlineFunnel,
} from 'react-icons/hi2';

export default function ReportsAnalytics() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Analytics & Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Departmental comparisons, student risk distributions, and automated voice outreach metrics.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <HiOutlineDocumentArrowDown className="w-4 h-4" />
          Print Executive Briefing
        </button>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Attendance Rate Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Departmental Attendance Index</h3>
              <p className="text-xs text-slate-500">Average student attendance % by engineering branch</p>
            </div>
            <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
              ECE Leads (94.1%)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_ATTENDANCE_ANALYTICS.department_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis domain={[70, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="rate" fill="#1e3a5f" radius={[6, 6, 0, 0]} name="Attendance Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Call Resolution Velocity Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Calling Volume vs Attendance</h3>
              <p className="text-xs text-slate-500">Daily calls dispatched to absent students' guardians</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
              37 Calls Today
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_ATTENDANCE_ANALYTICS.weekly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Total Calls Placed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Call Duration</p>
          <p className="text-2xl font-black text-slate-900 mt-2">62.4 Seconds</p>
          <p className="text-xs text-emerald-600 mt-1">High efficiency dialog completion</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guardian Response Rate</p>
          <p className="text-2xl font-black text-slate-900 mt-2">83.8%</p>
          <p className="text-xs text-blue-600 mt-1">Answered on 1st or retry attempt</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consent Compliance</p>
          <p className="text-2xl font-black text-slate-900 mt-2">97.2%</p>
          <p className="text-xs text-slate-500 mt-1">Telephony regulatory consent on file</p>
        </div>
      </div>
    </div>
  );
}
