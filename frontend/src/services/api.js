/**
 * SmartAttend AI - Axios API Service
 * 
 * This creates a pre-configured Axios instance for making API calls.
 * 
 * WHY A SEPARATE FILE?
 * Instead of writing `axios.get('http://localhost:8000/api/users')` everywhere,
 * we configure Axios once here with the base URL and auth token.
 * Then in any component, we just write: `api.get('/users')`
 */

import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create an Axios instance with default settings
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * 
 * This runs BEFORE every API request.
 * It automatically attaches the JWT token (if the user is logged in)
 * to the Authorization header.
 * 
 * Without this, we'd have to manually add the token to every single API call.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 
 * This runs AFTER every API response.
 * If we get a 401 (Unauthorized) response, it means the token is 
 * expired or invalid. We clear the stored token and redirect to login.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid — clear it and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
