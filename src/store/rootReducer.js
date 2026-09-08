import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import uiReducer from './slices/uiSlice';

/**
 * Root reducer.
 *
 * Add a slice here only when its state is genuinely global - per-screen data
 * belongs to the component via useApi.
 */
const rootReducer = combineReducers({
  auth: authReducer,
  theme: themeReducer,
  ui: uiReducer,
});

export default rootReducer;
