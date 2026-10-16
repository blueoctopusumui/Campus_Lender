// CampusLend API Client
import axios from 'axios';

// In production: use the deployed backend URL from .env
// In local dev:  use /api so Vite proxy forwards to localhost:5000
console.log('API BASE URL:', import.meta.env.VITE_API_BASE_URL);
const baseURL = '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,           // Always send the httpOnly session cookie
  headers: { 'Content-Type': 'application/json' }
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Do NOT attach anything from localStorage. Auth is handled by the httpOnly
// cookie set by the backend. Adding a Bearer token from localStorage was
// causing stale sessions to "auto-login" as the last user even after logout.
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────
// On 401 from any protected route, redirect to login.
// Skip redirect for /auth/me (the initial session check) and /auth/login
// (failed logins should surface their error to the form, not redirect).
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthCheckOrLogin =
      url.includes('/auth/me') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/enroll') ||
      url.includes('/auth/meta') ||
      url.includes('/auth/departments');

    if (err.response?.status === 401 && !isAuthCheckOrLogin) {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

export default api;
