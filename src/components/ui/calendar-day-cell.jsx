import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { formatDateKey, getDateKey } from '@/utils/date';

/**
 * Calendar Day Cell - one day in the planner (Phase 1 scope, p.5:
 * "Calendar and daily planner", daily and weekly views).
 * Figma: AI-Learning-Platform, node 16-31.
 *
 *   <CalendarDayCell date="2026-10-14" workload={2} isSelected onSelect={setDay} />
 *
 * Design rules this component encodes:
 *
 * - Workload is dots, not a count. Up to three dots say "a little / some /
 *   a lot" at a glance, without asking the student to read and compare
 *   numbers across a grid. They stop at three, so a heavy day never looks
 *   infinitely bad. The exact count is still in the accessible name.
 * - Today and Selected are different things. Today is a fact (a ring);
 *   Selected is a choice (a filled accent). When both are true the ring
 *   moves outside the fill, so each stays readable on its own.
 * - Overdue uses the warning tokens, like the Assignment Card: a past-due day
 *   is something to recover from, never styled as an error.
 *
 * Colours come from the semantic tokens in styles/tailwind.css (primary,
 * primary-soft, warning*), so the cell follows the app theme, its dark mode,
 * and the K-4 kid theme without any changes here.
 */

/** Dots stop here - more planned work never draws more dots. */
const MAX_WORKLOAD_DOTS = 3;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const cellVariants = cva(
  [
    'relative inline-flex shrink-0 select-none flex-col items-center justify-center gap-1',
    'appearance-none border-[1.5px] border-transparent bg-transparent p-0 font-[inherit] leading-none tabular-nums',
    'cursor-pointer transition-colors duration-150',
    'disabled:cursor-not-allowed disabled:opacity-40',
  ],
  {
    variants: {
      size: {
        // Month grid: the date alone.
        compact: 'size-10 rounded-[0.5rem]',
        // Week strip / daily view: weekday above the date.
        regular: 'size-[4.25rem] rounded-[0.75rem]',
      },
      tone: {
        default: 'text-foreground enabled:hover:bg-primary-soft',
        selected: 'bg-primary text-primary-foreground enabled:hover:bg-primary/90',
        overdue:
          'border-warning-border bg-warning-soft text-warning enabled:hover:bg-[color-mix(in_oklab,var(--warning-soft),var(--warning)_10%)]',
        // Days outside the month being shown, and disabled days.
        muted: 'text-muted-foreground enabled:hover:bg-primary-soft/60',
      },
      today: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // Today on its own: the ring is the cell's border.
      { today: true, tone: ['default', 'muted'], className: 'border-primary' },
      // Today plus a fill: the ring steps outside, so "today" and "selected"
      // (or "overdue") never merge into one look.
      {
        today: true,
        tone: ['selected', 'overdue'],
        className: 'ring-2 ring-primary ring-offset-2 ring-offset-card',
      },
    ],
    defaultVariants: { size: 'compact', tone: 'default', today: false },
  }
);

const DOT_TONES = {
  default: 'bg-primary',
  selected: 'bg-primary-foreground',
  overdue: 'bg-warning',
  muted: 'bg-muted-foreground',
};

function toDateKey(date) {
  if (typeof date === 'string' && DATE_KEY_PATTERN.test(date)) return date;
  // A Date / ISO timestamp is an instant - take its calendar day in the user's timezone.
  return getDateKey(date);
}

function describeDay({ dateKey, isToday, workload, isOverdue }) {
  const parts = [formatDateKey(dateKey, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })];
  if (isToday) parts.push('today');
  if (workload > 0) parts.push(`${workload} ${workload === 1 ? 'thing' : 'things'} planned`);
  if (isOverdue) parts.push('has overdue work');
  return parts.join(', ');
}

/**
 * @param {object}  props
 * @param {string|Date} props.date   "YYYY-MM-DD", or a Date/ISO timestamp (read in the user's timezone)
 * @param {'compact'|'regular'} [props.size]  compact = month grid, regular = week strip (adds the weekday)
 * @param {number}  [props.workload]      planned items that day; drawn as 0-3 dots
 * @param {boolean} [props.isToday]       defaults to comparing `date` with today in the user's timezone
 * @param {boolean} [props.isSelected]
 * @param {boolean} [props.isOverdue]     the day has past-due work
 * @param {boolean} [props.isOutsideMonth] a leading/trailing day from the next or previous month
 * @param {(dateKey: string) => void} [props.onSelect]  called with "YYYY-MM-DD"
 *
 * Any other props (disabled, aria-*, data-*, onKeyDown, ...) go to the <button>.
 */
export function CalendarDayCell({
  date,
  size = 'compact',
  workload = 0,
  isToday,
  isSelected = false,
  isOverdue = false,
  isOutsideMonth = false,
  disabled = false,
  onSelect,
  onClick,
  className,
  ...props
}) {
  const dateKey = toDateKey(date);
  const today = isToday ?? dateKey === getDateKey();
  const plannedCount = Math.max(0, Math.floor(Number(workload) || 0));
  const dots = Math.min(plannedCount, MAX_WORKLOAD_DOTS);

  // A selection outranks overdue: it's the student's current focus. Overdue
  // is still announced in the accessible name.
  let tone = 'default';
  if (isSelected) tone = 'selected';
  else if (isOverdue) tone = 'overdue';
  else if (isOutsideMonth || disabled) tone = 'muted';

  const emphasised = today || isSelected || isOverdue || plannedCount > 0;

  return (
    <button
      type="button"
      data-slot="calendar-day-cell"
      data-date={dateKey}
      aria-label={describeDay({ dateKey, isToday: today, workload: plannedCount, isOverdue })}
      aria-pressed={isSelected}
      aria-current={today ? 'date' : undefined}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onSelect?.(dateKey);
      }}
      className={cn(cellVariants({ size, tone, today }), className)}
      {...props}
    >
      {size === 'regular' && (
        <span aria-hidden="true" className="text-[0.625rem] font-medium uppercase tracking-[0.08em] opacity-85">
          {formatDateKey(dateKey, { weekday: 'short', year: undefined, month: undefined, day: undefined })}
        </span>
      )}

      <span
        aria-hidden="true"
        className={cn(size === 'regular' ? 'text-lg' : 'text-sm', emphasised ? 'font-bold' : 'font-normal')}
      >
        {formatDateKey(dateKey, { day: 'numeric', year: undefined, month: undefined })}
      </span>

      {/* The dot row always takes its space, so dates line up across a row whether or not a day has work. */}
      <span aria-hidden="true" className="flex h-1 items-center gap-[3px]">
        {Array.from({ length: dots }, (_, i) => (
          <span
            key={i}
            className={cn('rounded-full', size === 'regular' ? 'size-1' : 'size-[3px]', DOT_TONES[tone])}
          />
        ))}
      </span>
    </button>
  );
}

export default CalendarDayCell;
