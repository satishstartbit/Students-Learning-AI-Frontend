import api from '../../../utils/apiClient';

/** Personalization dedicated masters: Colour Themes, Avatars, Sticky Note Styles, Stickers. */

function clean(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

/** Builds the standard 7-call CRUD surface for one entity's base path. */
function buildEntityApi(basePath) {
  return {
    list: (params = {}) => api.get(basePath, { params: clean(params) }),
    getOne: (id) => api.get(`${basePath}/${id}`),
    create: (payload) => api.post(basePath, payload),
    update: (id, payload) => api.patch(`${basePath}/${id}`, payload),
    activate: (id) => api.post(`${basePath}/${id}/activate`),
    deactivate: (id) => api.post(`${basePath}/${id}/deactivate`),
    remove: (id) => api.delete(`${basePath}/${id}`),
  };
}

export const themes = buildEntityApi('/admin/master/themes');
export const avatars = buildEntityApi('/admin/master/avatars');
export const stickyNoteStyles = buildEntityApi('/admin/master/sticky-note-styles');
export const stickers = buildEntityApi('/admin/master/stickers');

export default { themes, avatars, stickyNoteStyles, stickers };
