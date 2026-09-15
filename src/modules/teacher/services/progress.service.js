import api from '../../../utils/apiClient';

/** The teacher's Progress page - check-in status and task progress for their own students. */

const dropEmpty = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

/** @param {{ search?, subject?, grade? }} params */
export const getProgress = (params = {}) => api.get('/teacher/progress', { params: dropEmpty(params) });

export const getStudentProgress = (studentId) => api.get(`/teacher/progress/${studentId}`);

export default { getProgress, getStudentProgress };
