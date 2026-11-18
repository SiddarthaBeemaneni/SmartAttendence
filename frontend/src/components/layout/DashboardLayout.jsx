/**
 * SmartAttend AI - Enhanced Dashboard Layout Component
 * 
 * Provides:
 * - Responsive desktop & mobile sidebar
 * - Sticky top navbar with active role switcher (1-click role testing for Phase 2)
 * - Notification drawer / badge
 * - Profile indicator
 */

import { useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineArrowsRightLeft,
  HiOutlineUserCircle,
} from 'react-icons/hi2';

export default function DashboardLayout() {
  const { user, loading, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading SmartAttend AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleRoleSwitch = (role) => {
    switchRole(role);
    navigate(`/${role}`);
  };

  const notifications = [
    { id: 1, text: 'AI Call to Mr. Subramanian completed. Reason saved.', time: '10m ago', unread: true },
    { id: 2, text: 'CS501 attendance finalized for session 09:00 AM.', time: '25m ago', unread: true },
    { id: 3, text: 'Low attendance alert triggered for Rahul R. Menon (68.2%).', time: '1h ago', unread: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="lg:ml-[var(--sidebar-width)] flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 transition-all">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Spacer for mobile hamburger */}
            <div className="lg:hidden w-8" />

            {/* Middle: Active Role Switcher Pill Bar (Convenient for testing Phase 2) */}
            <div className="hidden sm:flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <span className="px-2 py-1 text-slate-500 flex items-center gap-1">
                <HiOutlineArrowsRightLeft className="w-3.5 h-3.5" />
                Preview As:
              </span>
              {[
                { role: 'admin', label: 'Admin' },
                { role: 'faculty', label: 'Faculty' },
                { role: 'student', label: 'Student' },
                { role: 'parent', label: 'Parent' },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleRoleSwitch(item.role)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    user.role === item.role
                      ? 'bg-primary-500 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Right: Quick actions, notifications, user avatar */}
            <div className="flex items-center gap-3">
              {/* Notifications Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Notifications"
                >
                  <HiOutlineBell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 ring-2 ring-white rounded-full" />
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="font-bold text-sm text-slate-800">System Notifications</h4>
                      <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                        2 New
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 py-1">
                      {notifications.map((n) => (
                        <div key={n.id} className="py-2.5 px-2 hover:bg-slate-50 rounded-lg text-xs">
                          <p className={`text-slate-700 ${n.unread ? 'font-semibold' : ''}`}>{n.text}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity Pill */}
              <div
                onClick={() => navigate(`/${user.role}/profile`)}
                className="flex items-center gap-2.5 pl-3 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
