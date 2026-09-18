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

/**
 * Plain JSON, or multipart when `imageFile` (an uploaded picture) is present -
 * every other field then travels as a string the backend validator converts
 * back. Same shape as the reward-picture body (reward.service.js).
 */
function buildPictureBody({ imageFile, ...fields }) {
  if (!imageFile) return fields;
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  formData.append('image', imageFile);
  return formData;
}

export const themes = buildEntityApi('/admin/master/themes');

/** Avatars take an uploaded picture as well as the shared CRUD. */
export const avatars = {
  ...buildEntityApi('/admin/master/avatars'),
  create: (payload) => api.post('/admin/master/avatars', buildPictureBody(payload)),
  update: (id, payload) => api.patch(`/admin/master/avatars/${id}`, buildPictureBody(payload)),
};
export const stickyNoteStyles = buildEntityApi('/admin/master/sticky-note-styles');
export const stickers = buildEntityApi('/admin/master/stickers');

export default { themes, avatars, stickyNoteStyles, stickers };
