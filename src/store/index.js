import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { sessionExpired } from './slices/authSlice';
import { setSessionExpiredHandler } from '../utils/apiClient';

export const store = configureStore({
  reducer: rootReducer,
  devTools: import.meta.env.DEV,
});

/**
 * When the API client cannot refresh an expired token it gives up on the
 * session; mirror that into Redux so the guards re-render and redirect.
 *
 * Registered here rather than in a component so it is wired exactly once,
 * independently of the React tree.
 */
setSessionExpiredHandler(() => store.dispatch(sessionExpired()));

export default store;
