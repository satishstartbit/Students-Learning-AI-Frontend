import { createSlice } from '@reduxjs/toolkit';
import { THEME_MODES, applyThemeMode } from '../../theme';
import { local } from '../../utils/storage';

/**
 * Globally available display preferences.
 *
 * The token values themselves live in theme/variables.css - this slice only
 * records which mode is active and whether the sidebar is collapsed.
 */
const STORAGE_KEY = 'eflp.theme';

function readPersistedTheme() {
  const stored = local.get(STORAGE_KEY);
  const mode = Object.values(THEME_MODES).includes(stored?.mode) ? stored.mode : THEME_MODES.SYSTEM;

  return { mode, sidebarCollapsed: Boolean(stored?.sidebarCollapsed) };
}

const initialState = readPersistedTheme();

// Apply the stored preference before first paint.
applyThemeMode(initialState.mode);

const persist = (state) =>
  local.set(STORAGE_KEY, { mode: state.mode, sidebarCollapsed: state.sidebarCollapsed });

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode(state, action) {
      const mode = action.payload;
      if (!Object.values(THEME_MODES).includes(mode)) return;

      state.mode = mode;
      applyThemeMode(mode);
      persist(state);
    },

    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      persist(state);
    },

    setSidebarCollapsed(state, action) {
      state.sidebarCollapsed = Boolean(action.payload);
      persist(state);
    },
  },
});

export const { setThemeMode, toggleSidebar, setSidebarCollapsed } = themeSlice.actions;

export const selectThemeMode = (state) => state.theme.mode;
export const selectSidebarCollapsed = (state) => state.theme.sidebarCollapsed;

export default themeSlice.reducer;
