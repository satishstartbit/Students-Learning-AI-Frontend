import academicService from '../../masterManagement/services/academic.service';

/**
 * A student's academic year (required on Add child since 2026-10-21): the
 * switched-on years of the Academic Years master, in their Order, the current
 * one marked. The value is the year's id - what the API stores in
 * student_profiles.academic_year_id.
 */
export const toAcademicYearOptions = (years = []) =>
  years.map((year) => ({
    value: year.id,
    label: year.isCurrent ? `${year.name} (current)` : year.name,
  }));

/** The default source: Master Management, for Super Admin sessions. Parents pass parentService.academicYearOptionsFetcher. */
export const adminAcademicYearFetcher = () =>
  academicService
    .listAcademicYears({ status: 'active', sortBy: 'display_order', sortOrder: 'asc', limit: 100 })
    .then((res) => toAcademicYearOptions(res?.data ?? []));

/**
 * The year already saved stays choosable after Super Admin switches it off
 * (the API keeps accepting it), so an older child's form doesn't look blank.
 */
export const withSavedYear = (options, savedYear) =>
  savedYear?.id && !options.some((option) => option.value === savedYear.id)
    ? [...options, { value: savedYear.id, label: `${savedYear.name} (switched off)` }]
    : options;
