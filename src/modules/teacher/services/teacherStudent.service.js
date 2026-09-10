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

export const listLookupSubjects = (params = {}) =>
  api.get('/teacher/lookups/subjects', { params: dropEmpty(params) });

export const listLookupGrades = (params = {}) =>
  api.get('/teacher/lookups/grades', { params: dropEmpty(params) });

export const listLookupAcademicYears = (params = {}) =>
  api.get('/teacher/lookups/academic-years', { params: dropEmpty(params) });

export default {
  listMyStudents,
  getMyStudent,
  listLookupSubjects,
  listLookupGrades,
  listLookupAcademicYears,
};
