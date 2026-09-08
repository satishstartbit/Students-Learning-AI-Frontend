import { createSlice } from '@reduxjs/toolkit';

/**
 * Genuinely global UI state only.
 *
 * Component-local state (open dropdowns, form values, per-list loading) stays
 * in the component - useModal, useForm and useApi cover those. This slice is
 * for state that outlives or crosses a single component:
 *
 *  - globalLoading: full-screen blocking work (e.g. session bootstrap)
 *  - notifications: banners that must survive navigation
 *  - activeModal: a modal opened from somewhere other than its own screen
 *
 * Transient toasts are not here - hooks/useToast owns those.
 */
const initialState = {
  globalLoading: false,
  globalLoadingMessage: null,
  notifications: [],
  activeModal: null,
  modalPayload: null,
};

let notificationId = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    startGlobalLoading(state, action) {
      state.globalLoading = true;
      state.globalLoadingMessage = action.payload ?? null;
    },

    stopGlobalLoading(state) {
      state.globalLoading = false;
      state.globalLoadingMessage = null;
    },

    addNotification: {
      reducer(state, action) {
        state.notifications.push(action.payload);
      },
      prepare({ message, variant = 'info', title }) {
        return { payload: { id: ++notificationId, message, variant, title } };
      },
    },

    dismissNotification(state, action) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },

    clearNotifications(state) {
      state.notifications = [];
    },

    openModal(state, action) {
      const { name, payload = null } =
        typeof action.payload === 'string' ? { name: action.payload } : action.payload;

      state.activeModal = name;
      state.modalPayload = payload;
    },

    closeModal(state) {
      state.activeModal = null;
      state.modalPayload = null;
    },
  },
});

export const {
  startGlobalLoading,
  stopGlobalLoading,
  addNotification,
  dismissNotification,
  clearNotifications,
  openModal,
  closeModal,
} = uiSlice.actions;

export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectGlobalLoadingMessage = (state) => state.ui.globalLoadingMessage;
export const selectNotifications = (state) => state.ui.notifications;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectModalPayload = (state) => state.ui.modalPayload;

export default uiSlice.reducer;
