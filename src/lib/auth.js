import { apiRequest } from './api';

const TOKEN_KEY = 'patronus_auth_token';
const USER_KEY = 'patronus_auth_user';

const saveSession = ({ token, user }) => {
  if (!token) {
    return { token, user };
  }
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { token, user };
};

export const authService = {
  async register(email, password, fullName) {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
  },

  async login(email, password) {
    const session = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (session.requiresTwoFactor) {
      return session;
    }
    return saveSession(session);
  },

  async verifyTwoFactor(email, otp) {
    const session = await apiRequest('/api/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    return saveSession(session);
  },

  async verifyEmail(token) {
    return apiRequest(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  },

  async logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async resetPassword(email) {
    return apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async completePasswordReset(token, password) {
    return apiRequest('/api/auth/reset-password/complete', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  async updateProfile(profile) {
    const user = await apiRequest('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async getCurrentUser() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
      const user = await apiRequest('/api/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      throw error;
    }
  },

  async getCurrentSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);
    return token && user ? { token, user: JSON.parse(user) } : null;
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
};
