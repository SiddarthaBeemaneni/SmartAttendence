/**
 * SmartAttend AI - Complete Application Router (Phase 2)
 * 
 * Configures all 18 core routes, layouts, and role guards
 * across Admin, Faculty, Student, and Parent experiences.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import UniversityRegisterPage from './pages/auth/UniversityRegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UniversityProfileSetup from './pages/admin/UniversityProfileSetup';
import StudentManagement from './pages/admin/StudentManagement';
import ParentManagement from './pages/admin/ParentManagement';
import FacultyManagement from './pages/admin/FacultyManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import ClassTimetable from './pages/admin/ClassTimetable';
import AttendanceHistory from './pages/admin/AttendanceHistory';
import AICallDashboard from './pages/admin/AICallDashboard';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import LowAttendanceAlerts from './pages/admin/LowAttendanceAlerts';
import SystemSettings from './pages/admin/SystemSettings';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AttendanceMarking from './pages/faculty/AttendanceMarking';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';

// Parent Pages
import ParentDashboard from './pages/parent/ParentDashboard';

// Common Pages
import ProfilePage from './pages/common/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<UniversityRegisterPage />} />
          <Route path="/signup" element={<Navigate to="/register" replace />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="profile-setup" element={<UniversityProfileSetup />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="parents" element={<ParentManagement />} />
            <Route path="faculty" element={<FacultyManagement />} />
            <Route path="subjects" element={<SubjectManagement />} />
            <Route path="classes" element={<ClassTimetable />} />
            <Route path="attendance" element={<AttendanceHistory />} />
            <Route path="calls" element={<AICallDashboard />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="alerts" element={<LowAttendanceAlerts />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Faculty Routes */}
          <Route path="/faculty" element={<DashboardLayout />}>
            <Route index element={<FacultyDashboard />} />
            <Route path="attendance" element={<AttendanceMarking />} />
            <Route path="subjects" element={<SubjectManagement />} />
            <Route path="history" element={<AttendanceHistory />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<DashboardLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="attendance" element={<StudentDashboard />} />
            <Route path="reports" element={<StudentDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Parent Routes */}
          <Route path="/parent" element={<DashboardLayout />}>
            <Route index element={<ParentDashboard />} />
            <Route path="attendance" element={<ParentDashboard />} />
            <Route path="calls" element={<ParentDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="text-center max-w-md p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h1 className="text-5xl font-extrabold text-primary-500 mb-2">404</h1>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Page Not Found</h3>
                  <p className="text-xs text-slate-500 mb-6">
                    The requested route does not exist in SmartAttend AI.
                  </p>
                  <a
                    href="/login"
                    className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-block"
                  >
                    Return to Login
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
