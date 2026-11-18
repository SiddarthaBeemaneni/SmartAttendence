/**
 * SmartAttend AI - Comprehensive Admin Dashboard
 * 
 * Includes:
 * - High-level KPIs (Attendance %, Total calls, Absences, Alerts)
 * - Interactive Recharts visualizations (weekly trend & language distribution)
 * - Live AI Calling Monitor
 * - Recent Absences with Call Transcript inspection
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import LanguageBadge from '../../components/common/LanguageBadge';
import CallTranscriptModal from '../../components/common/CallTranscriptModal';
import {
  MOCK_CALL_LOGS,
  MOCK_ATTENDANCE_ANALYTICS,
  MOCK_STUDENTS,
} from '../../utils/mockData';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlinePhone,
  HiOutlineExclamationTriangle,
  HiOutlineArrowUpRight,
  HiOutlineSparkles,
  HiOutlinePlay,
  HiOutlineFunnel,
  HiOutlineBuildingLibrary,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedCallLog, setSelectedCallLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [univProfile, setUnivProfile] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    const checkUnivProfile = async () => {
      try {
        const res = await api.get('/api/university/profile');
        setUnivProfile(res.data);
        // Auto-redirect to profile setup if this is a first-time login (profile not yet completed)
        if (!res.data.profile_completed) {
          // Check if user just came from registration (flag in sessionStorage)
          const isFirstLogin = sessionStorage.getItem('first_login') === 'true';
          if (isFirstLogin) {
            sessionStorage.removeItem('first_login');
            navigate('/admin/profile-setup', { replace: true });
            return;
          }
        }
      } catch (err) {
        // Fallback or ignore if not logged in
      } finally {
        setProfileChecked(true);
      }
    };
    checkUnivProfile();
  }, [navigate]);

  const openTranscript = (callLog) => {
    setSelectedCallLog(callLog);
    setIsModalOpen(true);
  };

  const criticalStudents = MOCK_STUDENTS.filter((s) => s.attendance_pct < 75);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Institutional Onboarding Notice if profile is incomplete */}
      {univProfile && !univProfile.profile_completed && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <HiOutlineBuildingLibrary className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Institutional Onboarding Required: Profile Incomplete
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete your official contact number, campus address, and institutional logo to activate automated parent calling headers.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/profile-setup')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            Setup Campus Profile
            <HiOutlineArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Title & Calling System Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrative Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time college attendance analytics and automated multi-lingual parent calling status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/calls')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all"
          >
            <HiOutlineSparkles className="w-4 h-4 text-amber-300" />
            AI Calling Live Monitor
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Today's Attendance Rate"
          value="94.2%"
          change="+1.8%"
          changeType="positive"
          icon={HiOutlineClipboardDocumentList}
          color="green"
        />
        <StatCard
          title="AI Parent Calls Initiated"
          value="37"
          change="31 Answered"
          changeType="positive"
          icon={HiOutlinePhone}
          color="cyan"
        />
        <StatCard
          title="Students Under 75% Limit"
          value={criticalStudents.length.toString()}
          change="Action Required"
          changeType="negative"
          icon={HiOutlineExclamationTriangle}
          color="red"
        />
        <StatCard
          title="Active Enrolled Students"
          value="1,248"
          change="6 Departments"
          changeType="positive"
          icon={HiOutlineUsers}
          color="blue"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Attendance Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Attendance & AI Call Correlation</h3>
              <p className="text-xs text-slate-500">Weekly student attendance % vs automated calls placed</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              Avg 92.9% This Week
            </span>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_ATTENDANCE_ANALYTICS.weekly_trend}>
                <defs>
                  <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis domain={[80, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="attendance" stroke="#1e3a5f" strokeWidth={3} fillOpacity={1} fill="url(#attendGrad)" name="Attendance %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Breakdown of AI Calls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Voice Language Mix</h3>
              <span className="text-xs text-slate-400">6 Indian Languages</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Parent preference distribution for voice synthesis</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_ATTENDANCE_ANALYTICS.language_distribution}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {MOCK_ATTENDANCE_ANALYTICS.language_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-100">
            {MOCK_ATTENDANCE_ANALYTICS.language_distribution.map((lang) => (
              <div key={lang.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                <span className="text-slate-600 truncate">{lang.name}:</span>
                <span className="font-bold text-slate-800">{lang.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Absences & Live AI Calls Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HiOutlinePhone className="w-5 h-5 text-primary-500" />
              Today's Finalized Absences & Automated AI Call Feed
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant inspection of parent authorization, phone verification, and recorded reasons.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/calls')}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              View Full Logs
              <HiOutlineArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Student & Roll No.</th>
                <th className="py-3.5 px-4">Subject & Session</th>
                <th className="py-3.5 px-4">Parent Contact</th>
                <th className="py-3.5 px-4">Language</th>
                <th className="py-3.5 px-4">Call Outcome</th>
                <th className="py-3.5 px-4">Recorded Reason</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Transcript</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_CALL_LOGS.map((call) => (
                <tr key={call.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    <div>{call.student_name}</div>
                    <div className="text-xs text-slate-400 font-normal">{call.student_roll}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="font-medium truncate max-w-[180px]">{call.subject}</div>
                    <div className="text-xs text-slate-400">{call.session_time}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="font-medium">{call.parent_name}</div>
                    <div className="text-xs text-slate-400 font-mono">{call.parent_phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <LanguageBadge code={call.language} />
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={call.call_status}>{call.call_status.toUpperCase()}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={call.absence_reason}>
                    {call.absence_reason}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <button
                      onClick={() => openTranscript(call)}
                      className="px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-500 hover:text-white text-primary-700 font-bold text-xs transition-all"
                    >
                      View AI Dialog
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Attendance Warning Box */}
      {criticalStudents.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <HiOutlineExclamationTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                Low Attendance Flag: {criticalStudents.length} Students Below 75% Mandatory Cutoff
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                These students are at risk of exam debarment. Automated alerts have been queued for parents.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/alerts')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
          >
            Review Critical List
          </button>
        </div>
      )}

      {/* Transcript Modal */}
      <CallTranscriptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        callLog={selectedCallLog}
      />
    </div>
  );
}
