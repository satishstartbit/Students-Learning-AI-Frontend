import api from '../../../utils/apiClient';

/**
 * Teacher's own students, and the lookup data used to filter/tag them
 * (subjects, grades, academic years) - same shape convention as
 * `modules/parent/services/parent.service.js`'s lookups, scoped for teachers
 * instead.
 */

function dropEmpty(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
}

/** @param {object} params - { page, limit, search, status, subject, grade, academicYearId } */
export const listMyStudents = (params = {}) => api.get('/teacher/students', { params: dropEmpty(params) });

export const getMyStudent = (id) => api.get(`/teacher/students/${id}`);

/**
 * My Students table: { page, limit, search, subject, grade, view, wellbeing }
 *   view: attention | no_checkin | invited; wellbeing: struggling | okay | none
 */
export const listRoster = (params = {}) => api.get('/teacher/roster', { params: dropEmpty(params) });

/** { all, attention, noCheckin, invited } under the same filters as the table. */
export const getRosterCounts = (params = {}) => api.get('/teacher/roster/counts', { params: dropEmpty(params) });

/** The student's page: header, alert, stats, assignments, this week's check-ins, recent check-ins. */
export const getStudentOverview = (id) => api.get(`/teacher/students/${id}/overview`);

export const markAlertSeen = (studentId, alertId) => api.post(`/teacher/students/${studentId}/alerts/${alertId}/seen`);

export const listLookupSubjects = (params = {}) =>
  api.get('/teacher/lookups/subjects', { params: dropEmpty(params) });

export const listLookupGrades = (params = {}) =>
  api.get('/teacher/lookups/grades', { params: dropEmpty(params) });

export const listLookupAcademicYears = (params = {}) =>
  api.get('/teacher/lookups/academic-years', { params: dropEmpty(params) });

/**
 * Whitelisted master data (subjects, grade_levels, strength_areas,
 * challenge_areas, interest_categories) for the teacher's own forms -
 * mirrors modules/parent/services/parent.service.js#listMasterOptions. The
 * backend rejects any other `type`.
 */
export const listMasterOptions = (type, params = {}) =>
  api.get(`/teacher/lookups/master/${type}`, { params: dropEmpty(params) });

/**
 * Master options shaped for RoleProfileFields' `lookupFetcher` prop
 * ({ value, label }[]) - so the teacher's own "Subjects taught" field (on
 * TeacherProfilePage and the public registration form) uses the same
 * master-backed multi-select the Super Admin edit form uses, instead of
 * free text. Audit fix, see activeContext.md.
 */
export const masterOptionsFetcher = (type) =>
  listMasterOptions(type).then((res) =>
    (res?.data ?? []).map((item) => ({ value: item.name, label: item.name }))
  );

export default {
  listRoster,
  getRosterCounts,
  getStudentOverview,
  markAlertSeen,
  listMyStudents,
  getMyStudent,
  listLookupSubjects,
  listLookupGrades,
  listLookupAcademicYears,
  listMasterOptions,
  masterOptionsFetcher,
};
