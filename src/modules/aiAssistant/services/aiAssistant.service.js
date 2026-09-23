import api from '../../../utils/apiClient';

/**
 * AI Learning Assistant API calls.
 *
 * Every session/message call is scoped to the signed-in student by the
 * backend session; the teacher and parent read-only endpoints live here too
 * since they belong to the same feature and share nothing with other
 * modules.
 */

function dropEmpty(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
}

// --- Subjects ---------------------------------------------------------------

export const listSubjects = () => api.get('/learning-assistant/subjects');

// --- Sessions -----------------------------------------------------------------

/** @param {object} payload - { subject, topic? } */
export const startSession = (payload) => api.post('/learning-assistant/sessions', payload);

/** @param {object} params - { page, limit, status } */
export const listSessions = (params = {}) =>
  api.get('/learning-assistant/sessions', { params: dropEmpty(params) });

/** The student's current active session, or data: null if none. */
export const getActiveSession = () => api.get('/learning-assistant/sessions/active');

export const getSession = (id) => api.get(`/learning-assistant/sessions/${id}`);

export const endSession = (id) => api.post(`/learning-assistant/sessions/${id}/end`);

// --- Messages -----------------------------------------------------------------

export const postMessage = (id, content) =>
  api.post(`/learning-assistant/sessions/${id}/messages`, { content });

export const explainTopic = (id, topic) =>
  api.post(`/learning-assistant/sessions/${id}/explain`, { topic });

/** @param {'easy'|'medium'|'hard'} [difficulty] */
export const requestPracticeQuestion = (id, difficulty) =>
  api.post(`/learning-assistant/sessions/${id}/practice-questions`, difficulty ? { difficulty } : {});

export const submitPracticeAnswer = (id, messageId, answer) =>
  api.post(`/learning-assistant/sessions/${id}/practice-questions/answer`, { messageId, answer });

export const getHint = (id, messageId) =>
  api.post(`/learning-assistant/sessions/${id}/hint`, { messageId });

// --- Teacher / Parent read-only views -------------------------------------

/** @param {object} params - { studentId, subject } */
export const getTeacherLearningActivity = (params = {}) =>
  api.get('/teacher/learning-activity', { params: dropEmpty(params) });

export const getParentLearningSummary = (childId) =>
  api.get(`/parent/children/${childId}/learning-summary`);

/** One row per child (name, grade, sessions this month) for the summary's child picker. */
export const getParentLearningOverview = () => api.get('/parent/learning-summary');

export default {
  listSubjects,
  startSession,
  listSessions,
  getActiveSession,
  getSession,
  endSession,
  postMessage,
  explainTopic,
  requestPracticeQuestion,
  submitPracticeAnswer,
  getHint,
  getTeacherLearningActivity,
  getParentLearningSummary,
  getParentLearningOverview,
};
