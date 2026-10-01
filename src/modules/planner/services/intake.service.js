import api from '../../../utils/apiClient';

/**
 * Adding work (backend: /work-intakes, /voice/transcriptions).
 * A student adds for themself; a parent passes their child's `studentId`.
 */

/**
 * @param {object} p
 * @param {'typed'|'voice'|'photo'|'document'} p.method
 * @param {string} [p.text]        typed or transcribed words
 * @param {object} [p.fields]      typed quick-add: { title, dueDate, subject, estimatedMinutes }
 * @param {File[]} [p.files]       photos / PDFs
 * @param {string} [p.studentId]   a parent adding for their child
 */
export function createIntake({ method, text, fields, files = [], studentId, onProgress } = {}) {
  if (!files.length) return api.post('/work-intakes', { method, text: text || undefined, fields, studentId });
  const form = new FormData();
  form.append('method', method);
  if (studentId) form.append('studentId', studentId);
  if (text) form.append('text', text);
  if (fields) form.append('fields', JSON.stringify(fields));
  files.forEach((file) => form.append('files', file));
  return api.upload('/work-intakes', form, { onProgress });
}

export const getIntake = (id) => api.get(`/work-intakes/${id}`);

export const listIntakes = (params = {}) => api.get('/work-intakes', { params });

/** The person's answers. They always win over anything read, even after a re-read. */
export const confirmIntake = (id, fields) => api.patch(`/work-intakes/${id}/confirmation`, { fields });

export const reextract = (id) => api.post(`/work-intakes/${id}/reextract`);

export const cancelIntake = (id) => api.post(`/work-intakes/${id}/cancel`);

const EXTENSIONS = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav' };

/** A short voice note to text. The audio isn't kept; the person checks the words. */
export function transcribe({ blob, seconds, studentId }) {
  const type = String(blob.type || 'audio/webm').split(';')[0];
  const form = new FormData();
  form.append('file', blob, `voice-note.${EXTENSIONS[type] ?? 'webm'}`);
  form.append('seconds', String(Math.max(1, Math.round(seconds))));
  if (studentId) form.append('studentId', studentId);
  return api.upload('/voice/transcriptions', form);
}

export default { createIntake, getIntake, listIntakes, confirmIntake, reextract, cancelIntake, transcribe };
