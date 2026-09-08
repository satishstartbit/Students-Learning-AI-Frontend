import api from '../../../utils/apiClient';

/**
 * Authentication API calls.
 *
 * The only place the auth endpoints are named. Components and pages call
 * these; they never touch apiClient directly.
 */

/** Shared sign-in for Student, Teacher and Parent. */
export const login = (credentials) => api.post('/auth/login', credentials);

/** Sign-in for Super Admin only - the dedicated admin endpoint. */
export const adminLogin = (credentials) => api.post('/auth/admin/login', credentials);

export const register = (payload) => api.post('/auth/register', payload);

export const logout = () => api.post('/auth/logout');
export const logoutAll = () => api.post('/auth/logout-all');

export const getMe = () => api.get('/auth/me');

export const verifyEmail = (token) => api.post('/auth/verify-email', { token });
export const resendVerification = (email) => api.post('/auth/resend-verification', { email });

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

export const resetPassword = ({ token, password, confirmPassword }) =>
  api.post('/auth/reset-password', { token, password, confirmPassword });

export const changePassword = ({ currentPassword, newPassword }) =>
  api.post('/auth/change-password', { currentPassword, newPassword });

export default {
  login,
  adminLogin,
  register,
  logout,
  logoutAll,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
};
