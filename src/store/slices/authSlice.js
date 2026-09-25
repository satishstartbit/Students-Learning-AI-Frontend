import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getCurrentUser,
  isAuthenticated as hasValidSession,
  persistSession,
  logout as clearSession,
} from '../../utils/auth';
import { getAccessToken } from '../../utils/storage';

/**
 * Global authentication state for SUPER_ADMIN / STUDENT / TEACHER / PARENT.
 *
 * Only what genuinely needs to be global is kept here: the user, the access
 * token, and request status. Refresh tokens, password hashes and anything
 * else sensitive stay out of Redux - tokens are read from utils/storage,
 * which owns persistence.
 */

/** Rebuilds state from a persisted session on first load. */
function readPersistedState() {
  if (!hasValidSession()) {
    clearSession();
    return { user: null, token: null, isAuthenticated: false };
  }
  return { user: getCurrentUser(), token: getAccessToken(), isAuthenticated: true };
}

const initialState = {
  ...readPersistedState(),
  loading: false,
  error: null,
};

/**
 * Signs a user in.
 *
 * The HTTP call is injected rather than imported so this slice stays free of
 * API details and modules/auth/services owns the endpoint.
 *
 *   dispatch(login({ credentials, request: authService.login }))
 */
export const login = createAsyncThunk(
  'auth/login',
  async ({ credentials, request }, { rejectWithValue }) => {
    try {
      const response = await request(credentials);
      const session = response?.data ?? response;

      // Persist tokens + user, then hand the user back to the reducer.
      persistSession(session);
      return { user: session.user, token: session.accessToken };
    } catch (error) {
      // status + errors let the login page tell "wrong password, N tries left"
      // from "sign-in is paused" (backend auth.service "sign-in pause").
      return rejectWithValue({
        message: error?.message ?? 'Sign in failed',
        status: error?.status ?? 0,
        errors: Array.isArray(error?.errors) ? error.errors : [],
      });
    }
  }
);

/** Signs the user out. `request` is optional - the local session is cleared either way. */
export const logout = createAsyncThunk('auth/logout', async ({ request } = {}) => {
  try {
    await request?.();
  } finally {
    clearSession();
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Sets the session directly (e.g. after a token refresh). */
    setCredentials(state, action) {
      const { user, token } = action.payload;
      state.user = user ?? state.user;
      state.token = token ?? state.token;
      state.isAuthenticated = Boolean(state.token);
      state.error = null;
    },

    setUser(state, action) {
      state.user = action.payload;
    },

    /** Clears the session locally - used when the API client gives up on refresh. */
    sessionExpired(state) {
      clearSession();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
    },

    clearAuthError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? action.error?.message ?? 'Sign in failed';
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { setCredentials, setUser, sessionExpired, clearAuthError } = authSlice.actions;

// --- Selectors -------------------------------------------------------------
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.user?.role ?? null;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
