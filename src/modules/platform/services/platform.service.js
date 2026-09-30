import api from '../../../utils/apiClient';

/**
 * Super Admin platform settings and system status
 * (backend: routes/settings.routes.js, routes/system.routes.js).
 */
const enc = encodeURIComponent;

export const listSettings = () => api.get('/admin/settings');
export const getSetting = (key) => api.get(`/admin/settings/${enc(key)}`);
/** Validate without saving: { valid, errors: [{ field, message }], value }. */
export const checkSetting = (key, value) => api.post(`/admin/settings/${enc(key)}/check`, { value });
export const createDraft = (key, value, note) => api.post(`/admin/settings/${enc(key)}/drafts`, { value, note: note || null });
export const updateDraft = (key, version, value, note) =>
  api.patch(`/admin/settings/${enc(key)}/versions/${version}`, { value, note: note || null });
export const discardDraft = (key, version) => api.delete(`/admin/settings/${enc(key)}/versions/${version}`);
export const publish = (key, version, reason) =>
  api.post(`/admin/settings/${enc(key)}/versions/${version}/publish`, { reason });
export const rollback = (key, version, reason) =>
  api.post(`/admin/settings/${enc(key)}/versions/${version}/rollback`, { reason });

export const systemStatus = () => api.get('/admin/system/status');

/** AI cost and quality over the last `days` (1-90). Counts and money only. */
export const aiUsage = (days = 30) => api.get('/admin/system/ai-usage', { params: { days } });

export default {
  listSettings,
  getSetting,
  checkSetting,
  createDraft,
  updateDraft,
  discardDraft,
  publish,
  rollback,
  systemStatus,
  aiUsage,
};
