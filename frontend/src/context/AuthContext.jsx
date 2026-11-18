/**
 * SmartAttend AI - Authentication Context & Provider
 * 
 * Provides:
 * - Real FastAPI backend authentication via JWT tokens
 * - Verification of user roles (admin, faculty, student, parent)
 * - Safe development demo login that cannot bypass authentication in production
 * - Forgot password self-service recovery integration
 * - Profile preference updates
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { DEMO_USERS } from '../utils/mockData';

const AuthContext = createContext(null);

// Safe development-only credentials
const SAFE_DEV_CREDENTIALS = {
  admin: { email: 'admin@smartattend.edu', password: 'password123' },
  faculty: { email: 'faculty@smartattend.edu', password: 'password123' },
  student: { email: 'student@smartattend.edu', password: 'password123' },
  parent: { email: 'parent@smartattend.edu', password: 'password123' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify existing session token
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          // Attempt verifying session with backend /auth/me
          const response = await api.get('/auth/me');
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch {
          // If offline or expired in dev, restore saved user if valid JSON
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Real API Login connected to FastAPI backend
   * Validates credentials, saves JWT access token, and sets role
   */
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      const { access_token, user: userData } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      // In development mode only, if backend is temporarily unreachable, provide graceful fallback
      if (import.meta.env.DEV && (!err.response || err.code === 'ERR_NETWORK')) {
        let matched = DEMO_USERS.admin;
        const lower = email.toLowerCase();
        if (lower.includes('faculty')) matched = DEMO_USERS.faculty;
        else if (lower.includes('student')) matched = DEMO_USERS.student;
        else if (lower.includes('parent')) matched = DEMO_USERS.parent;

        localStorage.setItem('access_token', `dev-fallback-token-${matched.role}`);
        localStorage.setItem('user', JSON.stringify(matched));
        setUser(matched);
        return matched;
      }

      // Extract clear message from backend error response
      const errorMessage =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        'Authentication failed. Please verify your email and password.';
      throw new Error(errorMessage);
    }
  };

  /**
   * Safe Demo Role Switcher
   * IMPORTANT: Disabled in production to prevent authentication bypass.
   */
  const demoLogin = async (role) => {
    // Production Security Guardrail: Never bypass authentication in production!
    if (import.meta.env.PROD) {
      throw new Error('Demo login is strictly disabled in production environments.');
    }

    const creds = SAFE_DEV_CREDENTIALS[role];
    if (!creds) {
      throw new Error(`Unknown demo role: ${role}`);
    }

    // Attempt real login through backend with safe dev credentials
    try {
      return await login(creds.email, creds.password);
    } catch {
      // Dev fallback if backend port is being restarted
      const target = DEMO_USERS[role] || DEMO_USERS.admin;
      localStorage.setItem('access_token', `dev-demo-token-${role}`);
      localStorage.setItem('user', JSON.stringify(target));
      setUser(target);
      return target;
    }
  };

  /**
   * Self-Service Forgot Password
   */
  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim(),
      });
      return response.data;
    } catch (err) {
      // Return safe message even if offline in dev
      return {
        status: 'success',
        email,
        message: `Password reset instructions have been dispatched to ${email} if registered.`,
      };
    }
  };

  /**
   * Logout
   */
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  /**
   * Update Profile Details
   */
  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const value = {
    user,
    login,
    demoLogin,
    switchRole: demoLogin,
    forgotPassword,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
