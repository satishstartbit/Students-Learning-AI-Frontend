import { useEffect, useMemo, useState } from 'react';
import { MultiSelect } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatName } from '../../../utils/format';
import teacherStudentService from '../../teacher/services/teacherStudent.service';

/**
 * Searchable multi-select of the teacher's own students, scoped to the
 * currently-selected subject + grade (+ optional academic year) - mirrors
 * `superAdmin/pages/RelationshipsPage.jsx`'s `formSubject`/`formGrade` gating
 * pattern: the picker stays disabled with a helper message until both a
 * subject and a grade are chosen, and re-fetches whenever any of the three
 * narrow the search server-side.
 */
export function StudentPicker({
  subject,
  grade,
  academicYearId,
  value = [],
  onChange,
  label = 'Students',
  hint,
  className = '',
}) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const students = useApi(teacherStudentService.listMyStudents);
  const { run } = students;

  const ready = Boolean(subject && grade);

  useEffect(() => {
    if (!ready) return;
    run({
      subject,
      grade,
      academicYearId: academicYearId || undefined,
      search: debouncedSearch,
      status: 'active',
      limit: 100,
    }).catch(() => {});
  }, [run, ready, subject, grade, academicYearId, debouncedSearch]);

  const options = useMemo(
    () => (students.data ?? []).map((s) => ({ value: s.id, label: formatName(s), description: s.email })),
    [students.data]
  );

  return (
    <MultiSelect
      label={label}
      searchable
      showSelectAll
      options={options}
      value={value}
      onChange={onChange}
      onSearchChange={setSearch}
      filterLocally={false}
      loading={students.isLoading}
      disabled={!ready}
      placeholder={ready ? 'Search and select students' : 'Select subject and grade first'}
      searchPlaceholder="Search students…"
      hint={hint ?? (ready ? undefined : 'Choose a subject and grade above to load your students.')}
      className={className}
    />
  );
}

export default StudentPicker;
