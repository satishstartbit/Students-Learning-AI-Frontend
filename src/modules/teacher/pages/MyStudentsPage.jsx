import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LuCheck, LuSearch, LuUsers } from 'react-icons/lu';
import { PageHeader, DataTable, EmptyState, Toast } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import teacherStudentService from '../services/teacherStudent.service';
import { MoodFace, StudentAvatar, SubjectChips } from '../components/students/StudentBits';
import { fullName, lastActiveLabel, relativeDay } from '../components/students/studentFormat';
import '../components/assignmentsList/assignmentsList.css';
import '../components/students/teacherStudents.css';

/** Tabs, in the mockup's order. */
const TABS = [
  { view: '', label: 'All', countKey: 'all' },
  { view: 'attention', label: 'Needs attention', countKey: 'attention' },
  { view: 'no_checkin', label: 'No check-in today', countKey: 'noCheckin' },
  { view: 'invited', label: 'Invited', countKey: 'invited' },
];
const VIEWS = new Set(TABS.map((t) => t.view));

const WELLBEING_OPTIONS = [
  { value: '', label: 'Any wellbeing' },
  { value: 'struggling', label: 'Finding it hard' },
  { value: 'okay', label: 'Doing okay' },
  { value: 'none', label: 'No check-in this week' },
];

const STATE_PILL = {
  active: { label: 'Active', tone: 'success' },
  invited: { label: 'Invited', tone: '' },
  suspended: { label: 'Suspended', tone: 'danger' },
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function WellbeingCell({ student }) {
  const c = student.latestCheckIn;
  if (!c) {
    return (
      <span className="ts-wellbeing">
        <MoodFace checkIn={null} />
        <span className="ts-muted">No check-ins yet</span>
      </span>
    );
  }
  return (
    <span className="ts-wellbeing">
      <MoodFace checkIn={c} />
      <span className="ts-wellbeing__text">
        <span>
          {c.moodName} · {relativeDay(c.date)}
        </span>
        {student.alert && <span className="ts-pill ts-pill--danger">Alert</span>}
      </span>
    </span>
  );
}

/**
 * My Students - everyone this teacher teaches, how they're doing today and
 * who needs a look: tabs (All / Needs attention / No check-in today /
 * Invited), search and filters, and a row per student linking to their page.
 */
export default function MyStudentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = VIEWS.has(searchParams.get('view') ?? '') ? (searchParams.get('view') ?? '') : '';

  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [wellbeing, setWellbeing] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const subjects = useApi(teacherStudentService.listLookupSubjects, { immediate: true });
  const grades = useApi(teacherStudentService.listLookupGrades, { immediate: true });

  const filters = useMemo(
    () => ({ search: debouncedSearch || undefined, subject: subject || undefined, grade: grade || undefined, wellbeing: wellbeing || undefined }),
    [debouncedSearch, subject, grade, wellbeing]
  );

  const list = useApi(teacherStudentService.listRoster);
  const counts = useApi(teacherStudentService.getRosterCounts);
  const { run: runList, meta } = list;
  const { run: runCounts } = counts;

  const load = useCallback(() => {
    runCounts(filters).catch(() => {});
    return runList({ ...filters, view: view || undefined, page, limit }).catch(() => {});
  }, [runList, runCounts, filters, view, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const hasFilters = Boolean(search || subject || grade || wellbeing);
  const withReset = (setter) => (value) => {
    setter(value);
    goToPage(1);
  };
  const clearFilters = () => {
    setSearch('');
    setSubject('');
    setGrade('');
    setWellbeing('');
    goToPage(1);
  };
  const pickTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set('view', next);
    else params.delete('view');
    setSearchParams(params, { replace: true });
    goToPage(1);
  };

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (s) => (
        <span className="ts-person">
          <StudentAvatar student={s} />
          <span>
            <Link to={`/teacher/students/${s.id}`} onClick={(e) => e.stopPropagation()}>
              {fullName(s)}
            </Link>
            <span className="ts-email">{s.email}</span>
          </span>
        </span>
      ),
    },
    { key: 'grade', header: 'Grade', render: (s) => (s.grade ? <span className="ts-nowrap">{s.grade}</span> : <span className="ts-muted">—</span>) },
    { key: 'subjects', header: 'Subjects', render: (s) => <SubjectChips subjects={s.subjects} /> },
    { key: 'wellbeing', header: 'Wellbeing', render: (s) => <WellbeingCell student={s} /> },
    {
      key: 'state',
      header: 'Status',
      render: (s) => {
        const pill = STATE_PILL[s.state] ?? STATE_PILL.active;
        return (
          <span className={`ts-pill ${pill.tone ? `ts-pill--${pill.tone}` : ''}`.trim()} title={s.state === 'invited' ? "Hasn't signed in yet" : undefined}>
            {pill.label}
          </span>
        );
      },
    },
    { key: 'lastActive', header: 'Last active', render: (s) => <span className="ts-nowrap">{lastActiveLabel(s.lastActiveAt)}</span> },
  ];

  const rows = Array.isArray(list.data) ? list.data : [];
  const tabCounts = counts.data ?? {};
  const total = pagination.total;
  const nobodyAtAll = !list.isLoading && !hasFilters && !view && tabCounts.all === 0;

  return (
    <div className="al-page td-page">
      <PageHeader title="My Students" description="Everyone you teach, across every subject and grade." style={{ marginBottom: 0 }} />

      {nobodyAtAll ? (
        <div className="ts-card">
          <EmptyState
            icon={
              <span className="ts-face ts-face--lg ts-tone" data-tone="blue" style={{ width: 54, height: 54 }}>
                <LuUsers size={24} aria-hidden="true" />
              </span>
            }
            title="No students yet"
            description="Students appear here once your school adds them to your classes. If someone is missing, ask your school admin."
          />
        </div>
      ) : (
        <>
          <ul className="al-tabs" aria-label="Filter students">
            {TABS.map((t) => {
              const selected = view === t.view;
              const n = tabCounts[t.countKey];
              return (
                <li key={t.countKey}>
                  <button type="button" className="al-tab" aria-pressed={selected} onClick={() => pickTab(t.view)}>
                    {selected && <LuCheck size={13} strokeWidth={2.6} aria-hidden="true" />}
                    {t.label}
                    {n !== undefined && <span aria-label={`, ${n}`}> · {n}</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="al-filters" role="search">
            <label className="al-search">
              <span className="ui-sr-only">Search by name or email</span>
              <LuSearch size={16} aria-hidden="true" />
              <input type="search" placeholder="Search by name or email" value={search} onChange={(e) => withReset(setSearch)(e.target.value)} />
            </label>
            <select className={`al-select ${subject ? '' : 'al-select--placeholder'}`.trim()} aria-label="Subject" value={subject} onChange={(e) => withReset(setSubject)(e.target.value)}>
              <option value="">All subjects</option>
              {(subjects.data ?? []).map((s) => (
                <option key={s.id ?? s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <select className={`al-select ${grade ? '' : 'al-select--placeholder'}`.trim()} aria-label="Grade" value={grade} onChange={(e) => withReset(setGrade)(e.target.value)}>
              <option value="">All grades</option>
              {(grades.data ?? []).map((g) => (
                <option key={g.id ?? g.name} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
            <select
              className={`al-select ${wellbeing ? '' : 'al-select--placeholder'}`.trim()}
              aria-label="Wellbeing"
              value={wellbeing}
              onChange={(e) => withReset(setWellbeing)(e.target.value)}
            >
              {WELLBEING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button type="button" className="al-clear" onClick={clearFilters} disabled={!hasFilters}>
              Clear
            </button>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            isLoading={list.isLoading}
            error={list.error}
            onRetry={load}
            onRowClick={(s) => navigate(`/teacher/students/${s.id}`)}
            pagination={pagination}
            onPageChange={goToPage}
            emptyTitle="No students match"
            emptyDescription={view === 'attention' ? 'No unread check-in alerts right now.' : 'Try another tab, or clear the filters.'}
            caption="My students"
          />

          {pagination.totalPages <= 1 && total > 0 && (
            <p className="al-footer" role="status">
              Showing {rows.length} of {plural(tabCounts.all ?? total, 'student')}
            </p>
          )}
        </>
      )}

      <Toast />
    </div>
  );
}
