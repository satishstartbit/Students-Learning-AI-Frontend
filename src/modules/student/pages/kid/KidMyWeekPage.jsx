import { Link } from 'react-router-dom';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { cn } from '../../../../lib/utils';
import { formatDateKey, getDateKey } from '../../../../utils/date';
import { useWeekPlan, startOfWeek } from '../../hooks/useWeekPlan';
import { CalendarIcon } from '../../components/kid/KidIcons';
import { KidPageHeader } from '../../components/kid/KidPageHeader';
import { KidSkeleton, KidOops } from '../../components/kid/KidStates';
import { StarRating } from '../../components/kid/PaperKit';
import { getSubjectStyle } from '../../components/kid/subjectStyle';
import { starsForMinutes } from '../../components/kid/kidFormat';

/** Mon-Fri only - school days, matching "one thing at a time" rather than a full 7-day grid. */
const WEEKDAY_COUNT = 5;

function DayTaskCard({ task }) {
  const assignment = task.assignment ?? {};
  const { icon: Icon, tile, ink } = getSubjectStyle(assignment.subject);

  return (
    <Link
      to={`/student/assignments/${assignment.id}`}
      className="flex flex-col items-center gap-2 rounded-[1.5rem] bg-kid-sheet p-4 text-center no-underline shadow-paper transition-transform duration-200 hover:-translate-y-0.5"
    >
      <span className={cn('grid size-12 place-items-center rounded-full', tile, ink)} aria-hidden="true">
        <Icon className="size-7" />
      </span>
      <span className="font-kid-display text-base font-medium leading-snug text-kid-ink">
        {assignment.title}
      </span>
      <StarRating stars={starsForMinutes(assignment.estimatedMinutes)} />
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
 * K-5 "My Week" - Monday through Friday, one column each, from the
 * reference mockup. Tasks are grouped by assignment.dueDate (see
 * hooks/useWeekPlan.js) - no new backend endpoint, this reads the same data
 * the Home page's task list already does.
 */
export default function KidMyWeekPage() {
  const weekStart = startOfWeek();
  const { days, isLoading, error, reload } = useWeekPlan(weekStart);
  const todayKey = getDateKey();
  const school = days.slice(0, WEEKDAY_COUNT);

  return (
    <div data-kid-page className="kid-ui min-h-full">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-8">
        <KidPageHeader icon={CalendarIcon} title="My week" subtitle="Here is what is coming up. One thing at a time." />

        {error ? (
          <div className="mt-6">
            <KidOops onRetry={reload} />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-5">
            {isLoading
              ? Array.from({ length: WEEKDAY_COUNT }, (_, i) => <KidSkeleton key={i} className="h-64" />)
              : school.map((day, i) => {
                  const isToday = day.key === todayKey;
                  return (
                    <BlurFade key={day.key} delay={0.05 * i}>
                      <section
                        aria-label={formatDateKey(day.key, { weekday: 'long', month: undefined, day: undefined, year: undefined })}
                        className={cn(
                          'flex h-full flex-col gap-3 rounded-[1.75rem] bg-kid-paper-deep/40 p-3',
                          isToday && 'ring-[3px] ring-kid-teal'
                        )}
                      >
                        <div className="text-center">
                          <p className="font-kid-display text-lg font-semibold text-kid-ink">
                            {formatDateKey(day.key, { weekday: 'long', month: undefined, day: undefined, year: undefined })}
                          </p>
                          {isToday && <p className="font-kid-hand text-base text-kid-teal">Today</p>}
                        </div>

                        {day.items.length > 0 ? (
                          <div className="flex flex-1 flex-col gap-3">
                            {day.items.map((task) => (
                              <DayTaskCard key={task.recipientId ?? task.id} task={task} />
                            ))}
                          </div>
                        ) : (
                          <DayOffCard />
                        )}
                      </section>
                    </BlurFade>
                  );
                })}
          </div>
        )}
      </div>
    </div>
  );
}
