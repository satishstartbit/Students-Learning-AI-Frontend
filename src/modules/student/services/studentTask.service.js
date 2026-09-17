import api from '../../../utils/apiClient';

/**
 * Tasks a Grade 6+ student adds for themselves (backend: /my-tasks), plus the
 * saved order of Today's Tasks on Home.
 */

/**
 * Plain JSON unless a photo is attached - then multipart, with every other
 * field as a string (the backend validator converts them back).
 */
function buildTaskBody({ photoFile, ...fields }) {
  if (!photoFile) return fields;
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  formData.append('photo', photoFile);
  return formData;
}

export const list = (params = {}) => api.get('/my-tasks', { params });

export const create = (values) => api.post('/my-tasks', buildTaskBody(values));

export const update = (id, values) => api.patch(`/my-tasks/${id}`, buildTaskBody(values));

export const remove = (id) => api.delete(`/my-tasks/${id}`);

/** `items`: the whole list top to bottom, `[{ type: 'own' | 'assignment', id }]`. */
export const saveOrder = (items) => api.put('/my-tasks/order', { items });

export default { list, create, update, remove, saveOrder };
