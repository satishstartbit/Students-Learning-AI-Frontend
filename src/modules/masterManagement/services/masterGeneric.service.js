import api from '../../../utils/apiClient';

/**
 * Generic master engine API calls - one implementation shared by every
 * simple lookup master (Subjects, Emotional States, Focus Duration, ...).
 * Listing is server-side paginated, filtered and searched.
 */

export const listTypes = () => api.get('/admin/master/types');

export function listItems(masterType, params = {}) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  return api.get(`/admin/master/${masterType}/items`, { params: query });
}

export const getItem = (masterType, id) => api.get(`/admin/master/${masterType}/items/${id}`);

export const createItem = (masterType, payload) =>
  api.post(`/admin/master/${masterType}/items`, payload);

export const updateItem = (masterType, id, payload) =>
  api.patch(`/admin/master/${masterType}/items/${id}`, payload);

export const activateItem = (masterType, id) =>
  api.post(`/admin/master/${masterType}/items/${id}/activate`);

export const deactivateItem = (masterType, id) =>
  api.post(`/admin/master/${masterType}/items/${id}/deactivate`);

/** Permanent; blocked with a 409 while the record is in use. */
export const deleteItem = (masterType, id) => api.delete(`/admin/master/${masterType}/items/${id}`);

export default {
  listTypes,
  listItems,
  getItem,
  createItem,
  updateItem,
  activateItem,
  deactivateItem,
  deleteItem,
};
