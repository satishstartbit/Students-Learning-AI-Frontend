import api from '../../../utils/apiClient';

/**
 * The signed-in student's own sticky notes (backend: /notes).
 *
 * A note is either general (the Home board) or tied to one assignment (the
 * assignment page's Notes panel) - `assignmentId` filters to one assignment's
 * notes, `generalOnly` to the ones with no assignment.
 */

export const list = (params = {}) => api.get('/notes', { params });

export const create = (payload) => api.post('/notes', payload);

export const update = (id, payload) => api.patch(`/notes/${id}`, payload);

export const remove = (id) => api.delete(`/notes/${id}`);

/**
 * Delivers the student's due note reminders (each once) and says when the
 * next one is: `{ delivered: Note[] (with `missed`), next: { id, remindAt } | null }`.
 * `remindAt` on create/update is a UTC ISO string, or null for no reminder.
 */
export const deliverReminders = () => api.post('/notes/reminders/deliver');

export default { list, create, update, remove, deliverReminders };
