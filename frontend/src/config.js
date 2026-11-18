/**
 * SmartAttend AI - Frontend Configuration
 * 
 * Central place for all frontend settings.
 * The API_BASE_URL tells Axios where to send requests.
 */

// In development, Vite's proxy forwards /auth and /api calls to the backend at port 8001
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// Application and College Institutional Identity
export const APP_NAME = 'SmartAttend AI';
export const APP_DESCRIPTION = 'AI-Powered Attendance Monitoring & Parent Calling System';

// Configurable College / Institution Identity Placeholders
export const COLLEGE_CONFIG = {
  name: 'ABC Institute of Technology & Management',
  accreditation: 'Affiliated to Anna University • NAAC A++ Accredited',
  code: 'COLLEGE-TN-042',
  supportEmail: 'attendance-support@abctech.edu',
  emergencyDesk: '+91 (044) 2855-4000',
  campusLocation: 'Chennai, Tamil Nadu, India',
};

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  FACULTY: 'faculty',
  STUDENT: 'student',
  PARENT: 'parent',
};

// Supported languages for AI calling
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'kn', name: 'Kannada' },
];
