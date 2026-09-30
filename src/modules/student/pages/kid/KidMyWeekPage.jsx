import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { cn } from '../../../../lib/utils';
import { addDaysToKey, formatDateKey, getDateKey } from '../../../../utils/date';
import DayAgenda from '../../../planner/components/schoolwork/DayAgenda';
import SchoolworkBoard from '../../../planner/components/schoolwork/SchoolworkBoard';
import SchoolworkList from '../../../planner/components/schoolwork/SchoolworkList';
import { ViewIcon } from '../../../planner/components/schoolwork/ViewSwitcher';
import WorkNoteDialog from '../../../planner/components/schoolwork/WorkNoteDialog';
import { usePlan } from '../../../planner/hooks/usePlan';
import { useSchoolwork } from '../../../planner/hooks/useSchoolwork';
import { useSchoolworkSettings } from '../../../planner/hooks/useSchoolworkSettings';
import { blocksByDay } from '../../../planner/planView';
import { VIEW_OPTIONS, eventsByDay } from '../../../planner/schoolwork';
import '../../../planner/components/schoolwork/schoolwork.css';
import { useWeekPlan, startOfWeek } from '../../hooks/useWeekPlan';
import focusService from '../../services/focus.service';
import { CalendarIcon } from '../../components/kid/KidIcons';
import { KidButton } from '../../components/kid/KidButton';
import { KidPageHeader } from '../../components/kid/KidPageHeader';
import { KidSkeleton, KidOops } from '../../components/kid/KidStates';
import { StarRating, SubjectTile } from '../../components/kid/PaperKit';
import { starsForMinutes } from '../../components/kid/kidFormat';

/** Mon-Fri only - school days, matching "one thing at a time" rather than a full 7-day grid. */
const WEEKDAY_COUNT = 5;

/** What K-5 calls the three views. */
const KID_LABELS = { board: 'Sticky notes', list: 'My list', calendar: 'My week' };

function DayTaskCard({ task, showTime }) {
  const assignment = task.assignment ?? {};
  return (
    <Link
      to={`/student/assignments/${assignment.id}`}
      className="flex flex-col items-center gap-2 rounded-[1.5rem] bg-kid-sheet p-4 text-center no-underline shadow-paper transition-transform duration-200 hover:-translate-y-0.5"
    >
      {/* In the subject's colour - the same as on the sticky notes and the list. */}
      <SubjectTile subject={assignment.subject} size="sm" />
      <span className="font-kid-display text-base font-medium leading-snug text-kid-ink">{assignment.title}</span>
      {showTime && <StarRating stars={starsForMinutes(assignment.estimatedMinutes)} />}
    </Link>
  );
}

function DayOffCard() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[1.5rem] bg-kid-sheet/60 p-4 text-center">
      <span aria-hidden="true" className="text-2xl text-kid-ink-soft">
        ♡
      </span>
      <span className="font-kid-display text-base text-kid-ink-soft">A day off</span>
      <span className="font-kid-body text-sm text-kid-ink-soft">Nothing planned</span>
    </div>
  );
}

/**
 * K-5 "My week" - the same schoolwork three ways, chosen in Settings and
 * switchable here any time:
 *
 *   Sticky notes  work as notes in their subject colours: To Do, Doing, Done
 *   My list       one thing after another, most important first
 *   My week       Monday to Friday: study times, their own plans (practice,
 *                 family time) and what is due each day
 *
 * Every view reads the same plan as the Grade 6+ page; this is its kid look.
 */
export default function KidMyWeekPage() {
  const navigate = useNavigate();
  const settings = useSchoolworkSettings('me');
  const { preferences, colorOf } = settings;
  const [chosenView, setChosenView] = useState(null);
  const view = chosenView ?? preferences.defaultView;
  const [openWork, setOpenWork] = useState(null);

  const weekStart = startOfWeek();
  const { days, isLoading, error, reload } = useWeekPlan(weekStart);
  const todayKey = getDateKey();
  const school = days.slice(0, WEEKDAY_COUNT);
  const weekStartKey = school[0]?.key ?? todayKey;

  const plan = usePlan('me', { from: weekStartKey, to: addDaysToKey(weekStartKey, 13) });
  const blocks = useMemo(() => blocksByDay(plan.plan?.blocks ?? []), [plan.plan]);
  const events = useMemo(() => eventsByDay(plan.plan?.personalEvents ?? []), [plan.plan]);
  const schoolwork = useSchoolwork('me', {
    onChanged: () => {
      plan.reload();
      reload();
    },
  });

  const openAssignment = (work) => navigate(`/student/assignments/${work.id}`);
  const waitingForSettings = !settings.loaded && settings.isLoading;

  return (
    <div data-kid-page className="kid-ui min-h-full">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-8">
        <KidPageHeader icon={CalendarIcon} title="My week" subtitle="Here is what is coming up. One thing at a time." />

        <div className="mt-5 flex flex-wrap gap-3" role="group" aria-label="Show my work as">
          {VIEW_OPTIONS.map((v) => (
            <KidButton key={v.key} size="md" variant={view === v.key ? 'primary' : 'soft'} aria-pressed={view === v.key} onClick={() => setChosenView(v.key)}>
              <ViewIcon view={v.key} size={20} />
              {KID_LABELS[v.key]}
            </KidButton>
          ))}
        </div>

        {waitingForSettings ? (
          <KidSkeleton className="mt-6 h-64" />
        ) : view === 'board' || view === 'list' ? (
          <div className="mt-6">
            {schoolwork.error && !schoolwork.loaded ? (
              <KidOops onRetry={schoolwork.reload} error={schoolwork.error} />
            ) : !schoolwork.loaded ? (
              <KidSkeleton className="h-64" />
            ) : view === 'board' ? (
              <SchoolworkBoard
                variant="kid"
                work={schoolwork.work}
                priorities={plan.plan?.priorities ?? []}
                today={todayKey}
                colorOf={colorOf}
                preferences={preferences}
                personalEvents={plan.plan?.personalEvents ?? []}
                busyId={schoolwork.busyId}
                onOpen={setOpenWork}
                onMove={schoolwork.move}
                onHandIn={openAssignment}
              />
            ) : (
              <div className="rounded-[1.75rem] bg-kid-sheet p-4 shadow-paper sm:p-6">
                <SchoolworkList
                  variant="kid"
                  work={schoolwork.work}
                  priorities={plan.plan?.priorities ?? []}
                  today={todayKey}
                  colorOf={colorOf}
                  preferences={preferences}
                  personalEvents={plan.plan?.personalEvents ?? []}
                  busyId={schoolwork.busyId}
                  onOpen={setOpenWork}
                  onMove={schoolwork.move}
                  onHandIn={openAssignment}
                />
              </div>
            )}
          </div>
        ) : error ? (
          <div className="mt-6">
            <KidOops onRetry={reload} error={error} />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-5">
            {isLoading
              ? Array.from({ length: WEEKDAY_COUNT }, (_, i) => <KidSkeleton key={i} className="h-64" />)
              : school.map((day, i) => {
                  const isToday = day.key === todayKey;
                  const dayBlocks = blocks.get(day.key) ?? [];
                  const dayEvents = events.get(day.key) ?? [];
                  return (
                    <BlurFade key={day.key} delay={0.05 * i}>
                      <section
                        aria-label={formatDateKey(day.key, { weekday: 'long', month: undefined, day: undefined, year: undefined })}
                        className={cn('flex h-full flex-col gap-3 rounded-[1.75rem] bg-kid-paper-deep/40 p-3', isToday && 'ring-[3px] ring-kid-teal')}
                      >
                        <div className="text-center">
                          <p className="font-kid-display text-lg font-semibold text-kid-ink">
                            {formatDateKey(day.key, { weekday: 'long', month: undefined, day: undefined, year: undefined })}
                          </p>
                          {isToday && <p className="font-kid-hand text-base text-kid-teal">Today</p>}
                        </div>

                        {(dayBlocks.length > 0 || dayEvents.length > 0) && (
                          <div className="rounded-[1.25rem] bg-kid-sheet p-3">
                            <DayAgenda
                              blocks={dayBlocks}
                              events={dayEvents}
                              timeZone={plan.plan?.timezone}
                              colorOf={colorOf}
                              showTypeIcons={preferences.showTypeIcons}
                              compact
                            />
                          </div>
                        )}

                        {day.items.length > 0 ? (
                          <div className="flex flex-1 flex-col gap-3">
                            {day.items.map((task) => (
                              <DayTaskCard key={task.recipientId ?? task.id} task={task} showTime={preferences.showEstimatedTime} />
                            ))}
                          </div>
                        ) : dayBlocks.length === 0 && dayEvents.length === 0 ? (
                          <DayOffCard />
                        ) : null}
                      </section>
                    </BlurFade>
                  );
                })}
          </div>
        )}
      </div>

      <WorkNoteDialog
        key={openWork?.id ?? 'closed'}
        work={openWork}
        today={todayKey}
        colorOf={colorOf}
        preferences={preferences}
        movable
        busy={schoolwork.busyId === openWork?.id}
        loadSteps={focusService.listSteps}
        onClose={() => setOpenWork(null)}
        onMove={async (w, to) => {
          setOpenWork(null);
          await schoolwork.move(w, to);
        }}
        onHandIn={(w) => {
          setOpenWork(null);
          openAssignment(w);
        }}
        onOpenPage={(w) => {
          setOpenWork(null);
          if (w.kind === 'teacher') openAssignment(w);
          else navigate('/student/assignments');
        }}
        onFocus={(w) => {
          setOpenWork(null);
          navigate(`/student/focus?assignment=${w.id}`);
        }}
      />
    </div>
  );
}
