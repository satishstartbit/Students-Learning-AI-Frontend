import { Link } from 'react-router-dom';
import { LuCalendarDays, LuListChecks } from 'react-icons/lu';
import { NumberTicker } from '../../../../../components/ui/number-ticker';
import { cn } from '../../../../../lib/utils';
import { formatDateKey } from '../../../../../utils/date';
import { useMotionAllowed } from '../../../hooks/useKidPreferences';
import { StarIcon } from '../KidIcons';
import { KidSkeleton } from '../KidStates';
import { HomeCard, HomeCardIcon, HomeSticker } from './HomeBits';
import { dueDayKey, todayDayKey } from './homeDates';
import { weekAtAGlance } from './homeTasks';

const dayName = (key, weekday) => formatDateKey(key, { weekday, year: undefined, month: undefined, day: undefined });

/**
 * "This week" - Monday to Friday with today ringed, a dot under each day
 * something is due, and what comes next (tomorrow's task, from the mockup).
 * Read from the same task list as the rest of the page.
 */
export function HomeWeekCard({ toDo, isLoading }) {
  const week = weekAtAGlance(toDo, { todayKey: todayDayKey(), dueKeyOf: dueDayKey });
  const upcoming = week.upcoming;

  return (
    <HomeCard aria-labelledby="kid-week-title" className="px-5 pb-5 pt-5">
      <div className="flex items-center gap-3">
        <HomeCardIcon icon={LuCalendarDays} tone="yellow" />
        <h2 id="kid-week-title" className="font-kid-display text-lg font-semibold text-kid-ink">
          {week.nextWeek ? 'Next week' : 'This week'}
        </h2>
      </div>

      <ol className="mt-4 flex justify-between gap-1">
        {week.days.map((day) => (
          <li key={day.key} className="flex flex-col items-center">
            <span
              aria-hidden="true"
              className={cn(
                'grid size-9 place-items-center rounded-full font-kid-display text-sm font-semibold',
                day.isToday ? 'kh-pulse bg-kid-teal text-white shadow-[0_3px_0_var(--kid-teal-deep)]' : 'bg-kid-paper-deep text-kid-ink',
                day.isPast && 'opacity-55'
              )}
            >
              {dayName(day.key, 'narrow')}
            </span>
            <span aria-hidden="true" className={cn('mt-1.5 block size-1.5 rounded-full', day.due ? 'bg-kid-sun' : 'bg-transparent')} />
            <span className="sr-only">
              {dayName(day.key, 'long')}
              {day.isToday ? ', today' : ''}: {day.due ? `${day.due} ${day.due === 1 ? 'task' : 'tasks'} due` : 'nothing due'}
            </span>
          </li>
        ))}
      </ol>

      {isLoading ? (
        <KidSkeleton className="mt-4 h-[3.75rem]" />
      ) : upcoming ? (
        <Link
          to={`/student/assignments/${upcoming.task.assignment?.id}`}
          className="group mt-4 block rounded-2xl bg-kid-paper-deep/70 px-3.5 py-2.5 no-underline transition-colors hover:bg-kid-paper-deep"
        >
          <span className="block font-kid-display text-[0.7rem] font-bold uppercase tracking-[0.12em] text-kid-ink-soft">
            {upcoming.tomorrow ? 'Tomorrow' : dayName(upcoming.key, 'long')}
          </span>
          <span className="mt-0.5 flex items-center gap-2 font-kid-display text-base font-semibold text-kid-ink">
            <LuListChecks className="size-4 shrink-0 text-kid-ink-soft" aria-hidden="true" />
            <span className="truncate">{upcoming.task.assignment?.title}</span>
          </span>
        </Link>
      ) : (
        <p className="mt-4 rounded-2xl bg-kid-paper-deep/70 px-3.5 py-3 font-kid-body text-sm text-kid-ink-soft">
          Nothing else due this week.
        </p>
      )}
    </HomeCard>
  );
}

/**
 * "Remember!" - the mockup's note pinned at the foot of the rail: a kind
 * reminder, and how many tasks the student has handed in (counting up, or
 * the plain number in calm mode). The heart sticker beats gently.
 */
export function HomeRememberCard({ finishedCount = 0 }) {
  const motionAllowed = useMotionAllowed();

  return (
    <HomeCard aria-labelledby="kid-remember-title" className="px-5 pb-6 pt-7">
      <span aria-hidden="true" className="kh-tape kh-tape--yellow -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-2" />

      <h2 id="kid-remember-title" className="font-kid-hand text-2xl leading-none text-kid-ink">
        Remember!
      </h2>
      <p className="mt-2 pr-8 font-kid-body text-base leading-snug text-kid-ink">Small steps add up. Every bit of effort helps you grow.</p>

      {finishedCount > 0 && (
        <p className="mt-3 flex items-center gap-2 pr-8 font-kid-display text-base text-kid-ink">
          <StarIcon className="size-6 shrink-0" />
          <span>
            You handed in{' '}
            {motionAllowed ? (
              <NumberTicker value={finishedCount} className="font-semibold tracking-normal text-inherit" />
            ) : (
              <span className="font-semibold">{finishedCount}</span>
            )}{' '}
            {finishedCount === 1 ? 'task' : 'tasks'}!
          </span>
        </p>
      )}

      <HomeSticker slug="heart" motion="beat" tilt={-8} className="bottom-3 right-3 size-9" />
    </HomeCard>
  );
}
