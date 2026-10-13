import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearAuthStorage } from './storage';
import { parseApiError } from './errorHandler';
import { SUBSCRIPTION_REQUIRED_EVENT } from './constants';
import { setServerReachable } from './connectivity';
import { announceSafetyNotice } from '../components/safety/safetyEvents';
import { familyPlanProblem, rememberSignOutReason } from './signOutReason';

/**
 * The single HTTP entry point for the app.
 *
 * The base URL comes from VITE_API_BASE_URL - never hardcode an API URL in a
 * component. Components call module services; services call this client.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 30000),
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// --- Request: attach the bearer token --------------------------------------
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Let the browser set the multipart boundary itself.
  if (config.data instanceof FormData) delete config.headers['Content-Type'];

  return config;
});

// --- Response: unwrap, and refresh once on 401 -----------------------------
let refreshPromise = null;

/** Called when the session cannot be recovered. Set by the auth provider. */
let onSessionExpired = () => {};
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = typeof fn === 'function' ? fn : () => {};
};

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  // A bare axios call - the instance would recurse through this interceptor.
  const { data } = await axios.post(
    `${BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const tokens = data?.data ?? data;
  setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  return tokens.accessToken;
}

/**
 * Keeps utils/connectivity.js current: any HTTP answer means the server is
 * up; no answer at all while the device is online means it isn't (the
 * connection banner then says so, and polls /health until it's back). A
 * request the app cancelled itself says nothing either way.
 */
function noteReachability(error) {
  if (!error) return setServerReachable(true);
  if (error.response) return setServerReachable(true);
  if (axios.isCancel?.(error) || error.code === 'ERR_CANCELED') return undefined;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return undefined;
  return setServerReachable(false);
}

/** The API server's health check (`/health`, outside the /api/v1 prefix). */
export const HEALTH_URL = `${BASE_URL.replace(/\/api\/v\d+\/?$/, '')}/health`;

/** Asks /health whether the server is back; updates the connection store. Never throws. */
export async function checkServer() {
  try {
    await axios.get(HEALTH_URL, { timeout: 8000, headers: { 'Cache-Control': 'no-cache' } });
    setServerReachable(true);
    return true;
  } catch (error) {
    noteReachability(error);
    return Boolean(error?.response);
  }
}

apiClient.interceptors.response.use(
  (response) => {
    noteReachability(null);
    return response;
  },
  async (error) => {
    noteReachability(error);
    const original = error.config;
    const status = error.response?.status;

    const isRefreshCall = original?.url?.includes('/auth/refresh');

    if (status === 401 && original && !original._retried && !isRefreshCall) {
      original._retried = true;

      try {
        // Collapse concurrent 401s into a single refresh.
        refreshPromise = refreshPromise || refreshAccessToken().finally(() => {
          refreshPromise = null;
        });

        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch (refreshError) {
        signOutForFamilyPlan(refreshError.response?.data);
        clearAuthStorage();
        onSessionExpired();
      }
    }

    // A child or extra parent whose family has no plan in force: the server has
    // already ended their sessions; sign out here and say why on /login.
    // (Not the sign-in itself: the sign-in page shows that answer directly.)
    if (status === 403 && !original?.url?.includes('/auth/login') && signOutForFamilyPlan(error.response?.data)) {
      clearAuthStorage();
      onSessionExpired();
    }

    return Promise.reject(error);
  }
);

/** Remembers the FAMILY_PLAN_INACTIVE reason from a response body; true when it was one. */
function signOutForFamilyPlan(body) {
  const problem = familyPlanProblem(body?.errors);
  if (!problem) return false;
  rememberSignOutReason({ code: problem.code, message: body?.message });
  return true;
}

/** Unwraps the standard { success, message, data, meta } envelope. */
function unwrap(response) {
  const body = response?.data;
  if (body && typeof body === 'object' && 'success' in body) {
    return { data: body.data, meta: body.meta ?? {}, message: body.message };
  }
  return { data: body, meta: {}, message: undefined };
}

async function request(config) {
  try {
    const result = unwrap(await apiClient.request(config));
    // A safety-screened save (note, check-in, step, answer) that raised a
    // concern: SafetyNoticeHost shows it, whichever screen saved it.
    if (result.data && typeof result.data === 'object' && result.data.safetyNotice) {
      announceSafetyNotice(result.data.safetyNotice);
    }
    return result;
  } catch (error) {
    const parsed = parseApiError(error);
    if (parsed.status === 403 && parsed.errors.some((e) => e?.code === 'SUBSCRIPTION_REQUIRED')) {
      window.dispatchEvent(new CustomEvent(SUBSCRIPTION_REQUIRED_EVENT));
    }
    throw parsed;
  }
}

export const api = {
  get: (url, config = {}) => request({ ...config, method: 'GET', url }),
  post: (url, data, config = {}) => request({ ...config, method: 'POST', url, data }),
  put: (url, data, config = {}) => request({ ...config, method: 'PUT', url, data }),
  patch: (url, data, config = {}) => request({ ...config, method: 'PATCH', url, data }),
  delete: (url, config = {}) => request({ ...config, method: 'DELETE', url }),

  /** Multipart upload with optional progress reporting. */
  upload: (url, formData, { onProgress, ...config } = {}) =>
    request({
      ...config,
      method: 'POST',
      url,
      data: formData,
      onUploadProgress: onProgress
        ? (e) => onProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0)
        : undefined,
    }),
};

export default api;
