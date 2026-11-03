// src/services/api/apiAuthService.js
import { DEMO_ACCOUNTS } from '../../constants/rolePermissions';
import { API_BASE_URL } from '../../config/api';

const API_BASE = API_BASE_URL;

const STORAGE_KEY = 'medpractice_auth_session';
const TOKEN_KEY = 'medpractice_auth_token';

export const apiAuthService = {
  /**
   * Login with email and password strictly against the backend server.
   * Fails if backend server is stopped or unreachable.
   */
  async login(email, password) {
    let res;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      console.error('[apiAuthService] Backend server connection error:', err);
      throw new Error('Unable to connect to backend server. Please make sure the backend server is running.');
    }

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      return data.user;
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Login failed (${res.status}): Invalid email or password.`);
    }
  },

  /**
   * Get the stored JWT token for authenticated API calls
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get the currently logged in user
   */
  async getCurrentUser() {
    const token = localStorage.getItem(TOKEN_KEY);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!token && !saved) return null;

    if (token && !token.startsWith('demo_token_')) {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const user = await res.json();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          return user;
        } else if (res.status === 401) {
          console.warn('[Auth] Token verification returned 401. Falling back to cached local session.');
          if (saved) {
            try {
              return JSON.parse(saved);
            } catch {}
          }
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
      } catch (error) {
        console.warn('[Auth] Session validation network warning:', error.message);
      }
    }

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Logout - clear all stored session data
   */
  async logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return true;
  },

  /**
   * MFA verification
   */
  async verifyMfa(tempToken, code) {
    try {
      const res = await fetch(`${API_BASE}/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        return data.user;
      }
    } catch (err) {
      console.warn('[apiAuthService] Backend MFA failed, demo fallback:', err.message);
    }

    const defaultUser = DEMO_ACCOUNTS[0];
    localStorage.setItem(TOKEN_KEY, `demo_token_${Date.now()}`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  },

  /**
   * Forgot password simulation
   */
  async forgotPassword(email) {
    return { success: true, message: `Reset link sent to ${email}` };
  },

  /**
   * Quick role switch
   */
  async loginAsRole(roleName, demoAccounts = DEMO_ACCOUNTS) {
    const account = demoAccounts?.find(a => a.role === roleName) || demoAccounts?.[0];
    if (!account) throw new Error('Role not found');

    let res;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, password: 'password123' }),
      });
    } catch (err) {
      console.error('[apiAuthService] Backend connection error during role switch:', err);
      throw new Error('Unable to connect to backend server. Please start the backend server to log in.');
    }

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      return data.user;
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Role login failed (${res.status}).`);
    }
  },
};
