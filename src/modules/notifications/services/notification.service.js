import api from '../../../utils/apiClient';

/** In-app notifications API calls - shared by every role. */

function dropEmpty(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
}

/** @param {object} params - { page, limit, unreadOnly } */
export const listNotifications = (params = {}) => api.get('/notifications', { params: dropEmpty(params) });

export const getUnreadCount = () => api.get('/notifications/unread-count');

export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => api.patch('/notifications/read-all');

/** What this person hears about, per type and channel: [{ type, label, description, locked, channels, inApp, email, push }]. */
export const getPreferences = () => api.get('/notifications/preferences');

/** items: [{ type, inApp?, email?, push? }] */
export const updatePreferences = (items) => api.patch('/notifications/preferences', { items });

/** Browser push: { enabled, publicKey, devices }. */
export const getPushStatus = () => api.get('/notifications/push');

export const savePushSubscription = (subscription) => api.post('/notifications/push/subscriptions', { subscription });

export const removePushSubscription = (endpoint) => api.post('/notifications/push/unsubscribe', { endpoint });

export default {
  getPreferences,
  updatePreferences,
  getPushStatus,
  savePushSubscription,
  removePushSubscription,
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
