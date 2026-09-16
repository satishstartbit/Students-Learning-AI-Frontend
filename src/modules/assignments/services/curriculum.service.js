import api from '../../../utils/apiClient';

/**
 * What a teacher can pick when building a task, from Curriculum & Task Setup.
 * `grade` is the task's grade name ("Grade 1"); the server returns only the
 * active options whose grade range includes it.
 */

const gradeParams = (grade) => ({ params: grade ? { grade } : {} });

export const listTaskTypes = (grade) => api.get('/curriculum/task-types', gradeParams(grade));
export const listSubjects = (grade) => api.get('/curriculum/subjects', gradeParams(grade));
export const listTopics = (subjectId, grade) => api.get(`/curriculum/subjects/${subjectId}/topics`, gradeParams(grade));
/** [{ id, name, description, url }] */
export const listAudioTracks = () => api.get('/curriculum/audio-tracks');

export default { listTaskTypes, listSubjects, listTopics, listAudioTracks };
