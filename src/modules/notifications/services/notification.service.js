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

export default {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
