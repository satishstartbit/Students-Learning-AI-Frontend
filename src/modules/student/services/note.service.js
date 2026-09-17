import api from '../../../utils/apiClient';

/** The signed-in student's own sticky notes (backend: /notes). */

export const list = () => api.get('/notes');

export const create = (payload) => api.post('/notes', payload);

export const update = (id, payload) => api.patch(`/notes/${id}`, payload);

export const remove = (id) => api.delete(`/notes/${id}`);

export default { list, create, update, remove };
