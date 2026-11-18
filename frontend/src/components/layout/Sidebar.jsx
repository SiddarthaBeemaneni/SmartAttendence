/**
 * SmartAttend AI - Sidebar Navigation Component
 * 
 * The sidebar appears on the left side of every dashboard page.
 * It shows different menu items based on the user's role.
 * It collapses on mobile and can be toggled with a hamburger button.
 */

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../config';
import {
  HiOutlineAcademicCap,
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentList,
  HiOutlinePhone,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBellAlert,
  HiOutlineCalendarDays,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineDocumentText,
  HiOutlineUserCircle,
  HiOutlineBuildingLibrary,
} from 'react-icons/hi2';

// Define menu items for each role
const menuConfig = {
  admin: [
    { label: 'Dashboard', path: '/admin', icon: HiOutlineHome },
    { label: 'Campus Profile', path: '/admin/profile-setup', icon: HiOutlineBuildingLibrary },
    { label: 'Students', path: '/admin/students', icon: HiOutlineUsers },
    { label: 'Parents', path: '/admin/parents', icon: HiOutlineUserGroup },
    { label: 'Faculty', path: '/admin/faculty', icon: HiOutlineUserCircle },
    { label: 'Subjects', path: '/admin/subjects', icon: HiOutlineBookOpen },
    { label: 'Classes', path: '/admin/classes', icon: HiOutlineCalendarDays },
    { label: 'Attendance', path: '/admin/attendance', icon: HiOutlineClipboardDocumentList },
    { label: 'AI Calls', path: '/admin/calls', icon: HiOutlinePhone },
    { label: 'Reports', path: '/admin/reports', icon: HiOutlineChartBar },
    { label: 'Alerts', path: '/admin/alerts', icon: HiOutlineBellAlert },
    { label: 'Settings', path: '/admin/settings', icon: HiOutlineCog6Tooth },
  ],
  faculty: [
    { label: 'Dashboard', path: '/faculty', icon: HiOutlineHome },
    { label: 'Mark Attendance', path: '/faculty/attendance', icon: HiOutlineClipboardDocumentList },
    { label: 'My Subjects', path: '/faculty/subjects', icon: HiOutlineBookOpen },
    { label: 'History', path: '/faculty/history', icon: HiOutlineDocumentText },
    { label: 'Profile', path: '/faculty/profile', icon: HiOutlineUserCircle },
  ],
  student: [
    { label: 'Dashboard', path: '/student', icon: HiOutlineHome },
    { label: 'My Attendance', path: '/student/attendance', icon: HiOutlineClipboardDocumentList },
    { label: 'Reports', path: '/student/reports', icon: HiOutlineChartBar },
    { label: 'Profile', path: '/student/profile', icon: HiOutlineUserCircle },
  ],
  parent: [
    { label: 'Dashboard', path: '/parent', icon: HiOutlineHome },
    { label: 'Attendance', path: '/parent/attendance', icon: HiOutlineClipboardDocumentList },
    { label: 'Call History', path: '/parent/calls', icon: HiOutlinePhone },
    { label: 'Profile', path: '/parent/profile', icon: HiOutlineUserCircle },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get menu items based on user role
  const menuItems = menuConfig[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Shared sidebar content (used in both desktop and mobile)
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-primary-400/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <HiOutlineAcademicCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{APP_NAME}</h1>
            <p className="text-xs text-primary-200 capitalize">{user?.role} Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === `/${user?.role}`}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg shadow-black/10'
                      : 'text-primary-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info and logout */}
      <div className="p-4 border-t border-primary-400/20">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-primary-200 truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-primary-100 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200"
        >
          <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-500 text-white rounded-xl shadow-lg"
      >
        <HiOutlineBars3 className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] bg-gradient-to-b from-primary-500 via-primary-700 to-primary-900 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-white/70 hover:text-white"
        >
          <HiOutlineXMark className="w-6 h-6" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[var(--sidebar-width)] bg-gradient-to-b from-primary-500 via-primary-700 to-primary-900 shadow-2xl">
        {sidebarContent}
      </aside>
    </>
  );
}
