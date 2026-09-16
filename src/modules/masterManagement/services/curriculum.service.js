import api from '../../../utils/apiClient';

/**
 * Curriculum & Task Setup dedicated masters: Task Types, Subjects, Topics and
 * the Background Audio library. Every master has the same list / get / create /
 * update / activate / deactivate / delete calls, built here per base path.
 */

function clean(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

function crud(base) {
  return {
    list: (params = {}) => api.get(`/admin/master/${base}`, { params: clean(params) }),
    get: (id) => api.get(`/admin/master/${base}/${id}`),
    create: (payload) => api.post(`/admin/master/${base}`, payload),
    update: (id, payload) => api.patch(`/admin/master/${base}/${id}`, payload),
    activate: (id) => api.post(`/admin/master/${base}/${id}/activate`),
    deactivate: (id) => api.post(`/admin/master/${base}/${id}/deactivate`),
    remove: (id) => api.delete(`/admin/master/${base}/${id}`),
  };
}

export const taskTypeService = crud('task-types');
export const curriculumSubjectService = crud('curriculum-subjects');
export const topicService = crud('topics');
export const audioTrackService = {
  ...crud('audio-tracks'),
  /** Multipart, field "file". Returns { id, url, originalFilename, mimeType, fileSize } to save as the track's fileId. */
  upload: (formData, options = {}) => api.upload('/admin/master/audio-tracks/upload', formData, options),
};
// Its 4 rows map 1:1 to a hardcoded builder UI (assignmentQuestion.service.js#ANSWER_TYPES) - deactivate-only,
// no delete route exists server-side, so `remove` is deliberately not exposed here.
export const questionTypeService = Object.fromEntries(Object.entries(crud('question-types')).filter(([key]) => key !== 'remove'));

/** Grade Levels (generic master) - the scale grade ranges are measured on. */
export const listGradeLevels = () =>
  api.get('/admin/master/grade_levels/items', { params: { status: 'active', limit: 100, sortBy: 'display_order', sortOrder: 'asc' } });

export default { taskTypeService, curriculumSubjectService, topicService, audioTrackService, questionTypeService, listGradeLevels };
