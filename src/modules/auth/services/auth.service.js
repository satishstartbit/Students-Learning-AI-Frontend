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

/**
 * Profile Management self-service update. When a photo is attached the
 * request must be multipart/form-data - the nested `profile` object travels
 * as a JSON string field, which the backend parses back into an object (see
 * middlewares/parseMultipartJson.middleware.js) - same convention as
 * modules/parent/services/parent.service.js#buildChildBody.
 */
function buildProfileBody({ profile, photoFile, ...rest }) {
  if (!photoFile) return { ...rest, profile };

  const formData = new FormData();
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  formData.append('profile', JSON.stringify(profile ?? {}));
  formData.append('profileImage', photoFile);
  return formData;
}

export const updateMe = (payload) => api.patch('/auth/me', buildProfileBody(payload));

export const verifyEmail = (token) => api.post('/auth/verify-email', { token });
export const resendVerification = (email) => api.post('/auth/resend-verification', { email });
/** The 6-digit code from the sign-up 'Check your email' step. */
export const verifyEmailCode = (email, code) => api.post('/auth/verify-email-code', { email, code });

/** "Forgot your password?" - a username or email; a 6-digit code goes out (a student's to their parent). */
export const forgotPassword = (identifier) => api.post('/auth/forgot-password', { identifier });
/** The 6-digit reset code; a right one comes back as `data.resetToken` for resetPassword. */
export const verifyResetCode = (identifier, code) => api.post('/auth/verify-reset-code', { identifier, code });

export const resetPassword = ({ token, password, confirmPassword }) =>
  api.post('/auth/reset-password', { token, password, confirmPassword });

export const changePassword = ({ currentPassword, newPassword }) =>
  api.post('/auth/change-password', { currentPassword, newPassword });

// --- public, whitelisted lookups for the registration form -----------------

/**
 * Whitelisted master data (subjects, grade_levels only) for the public
 * registration form's "About you as a teacher" section - no auth, there's
 * no session yet at this point in the signup flow. See
 * services/auth.service.js#PUBLIC_LOOKUP_TYPES on the backend.
 */
export const listPublicLookup = (type) => api.get(`/auth/lookups/master/${type}`);

/**
 * Master options shaped for RoleProfileFields' `lookupFetcher` prop
 * ({ value, label }[]) - same convention as
 * modules/parent/services/parent.service.js#masterOptionsFetcher, so the
 * teacher signup form's "Subjects taught" field uses the same master-backed
 * multi-select as everywhere else it appears. Audit fix, see activeContext.md.
 */
export const masterOptionsFetcher = (type) =>
  listPublicLookup(type).then((res) => (res?.data ?? []).map((item) => ({ value: item.name, label: item.name })));

export default {
  login,
  adminLogin,
  register,
  logout,
  logoutAll,
  getMe,
  updateMe,
  verifyEmail,
  resendVerification,
  verifyEmailCode,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  changePassword,
  listPublicLookup,
  masterOptionsFetcher,
};
