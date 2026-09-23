import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LuCheck } from 'react-icons/lu';
import { Avatar, Badge, Button, EmptyState, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatName } from '../../../utils/format';
import { describeMood } from '../../checkIn/moods';
import StudentProgressDetail from '../../progress/components/StudentProgressDetail';
import parentService from '../services/parent.service';
import '../components/parentPanels.css';

/**
 * Parent-facing wording for the task stages. The shared TASK_STAGES labels
 * (modules/progress/stages.js) are written for the teacher who set the work -
 * a parent reads "Handed in", not "Submitted". Tones stay shared, so a stage
 * is the same colour for both.
 */
const PARENT_STAGE_LABEL = {
  not_started: 'Not started',
  in_progress: 'In progress',
  returned: 'Sent back to fix',
  submitted: 'Handed in',
  reviewed: 'Marked',
};

/**
 * /parent/progress - pick a child, then see how they are arriving each day and
 * how their work is going.
 *
 * The detail itself is the shared StudentProgressDetail (today's cards, the
 * check-in strip, the task table) that the Teacher Progress modal also
 * renders; this page adds the child picker and the panel around it.
 */
export default function ParentProgressPage() {
  const summaries = useApi(parentService.getProgress, { immediate: true });
  const detail = useApi(parentService.getChildProgress);
  const { run: runDetail } = detail;

  // Which child is shown lives in the URL (?childId=), so "View progress" on
  // a My Children card opens on that child and the choice survives a reload
  // or a shared link.
  const [searchParams, setSearchParams] = useSearchParams();
  const childId = searchParams.get('childId') ?? '';
  const setChildId = (id) => setSearchParams(id ? { childId: id } : {}, { replace: true });

  const children = summaries.data ?? [];
  // First child by default, derived rather than synced from an effect. An id
  // that isn't one of this parent's children falls back the same way.
  const known = children.some((c) => c.student.id === childId);
  const selectedId = (known ? childId : '') || children[0]?.student.id || '';

  useEffect(() => {
    if (selectedId) runDetail(selectedId).catch(() => {});
  }, [selectedId, runDetail]);

  if (summaries.isLoading && !summaries.data) return <Loader message="Loading progress…" />;

  if (summaries.error && !summaries.data) {
    return (
      <div className="td-page">
        <PageHeader title="Progress" />
        <ErrorState title="We couldn't load progress" error={summaries.error} onRetry={() => summaries.run().catch(() => {})} />
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="td-page">
        <PageHeader title="Progress" />
        <EmptyState
          icon="👨‍👩‍👧"
          title="No children on your account yet"
          description="Once you add a child, their check-ins and task progress will show up here."
          action={
            <Button as={Link} to="/parent/children">
              Go to My Children
            </Button>
          }
        />
      </div>
    );
  }

  const selected = children.find((c) => c.student.id === selectedId);
  const selectedName = selected ? formatName(selected.student) : '';
  const firstName = selected?.student?.firstName ?? selectedName;
  const ready = !detail.isLoading && !detail.error && detail.data?.student?.id === selectedId;

  return (
    <div className="td-page">
      <PageHeader title="Progress" description="How each child is arriving each day, and how their work is going." />

      <section>
        <p className="pp-picker__label" id="pp-choose-child">
          Choose a child
        </p>
        <div className="pp-picker" role="group" aria-labelledby="pp-choose-child">
          {children.map((child) => {
            const active = child.student.id === selectedId;
            const name = formatName(child.student);
            const checkIn = child.today?.checkIn;
            const counts = child.counts ?? {};
            const done = (counts.submitted ?? 0) + (counts.reviewed ?? 0);

            return (
              <button
                key={child.student.id}
                type="button"
                className="pp-child"
                aria-pressed={active}
                onClick={() => setChildId(child.student.id)}
              >
                <Avatar name={name} size="md" />

                <span className="pp-child__body">
                  <span className="pp-child__name">{name}</span>
                  {child.student.grade && <span className="pp-child__grade">{child.student.grade}</span>}

                  <span className="pp-child__chips">
                    {checkIn ? (
                      <Badge variant="success">Checked in · {describeMood(checkIn.mood).name}</Badge>
                    ) : (
                      <Badge variant="neutral">Not checked in yet</Badge>
                    )}
                    <Badge variant="neutral">
                      {counts.total ? `${done} of ${counts.total} tasks today` : 'No tasks yet'}
                    </Badge>
                  </span>
                </span>

                {active && (
                  <span className="pp-child__tick" aria-hidden="true">
                    <LuCheck size={13} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="pp-panel">
        <div className="pp-panel__head">
          <Avatar name={selectedName} size="md" />
          <div>
            <h2 className="pp-panel__title">{selectedName}&rsquo;s progress</h2>
            <p className="pp-panel__sub">
              {[selected?.student?.grade, `Everything below is about ${firstName}.`].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {detail.isLoading && <Loader message="Loading…" />}

        {detail.error && !detail.isLoading && (
          <ErrorState
            title="We couldn't load this child's progress"
            error={detail.error}
            onRetry={() => runDetail(selectedId).catch(() => {})}
          />
        )}

        {ready && (
          <StudentProgressDetail
            progress={detail.data}
            showTeacher
            stageLabels={PARENT_STAGE_LABEL}
            name={firstName}
          />
        )}
      </section>
    </div>
  );
}
