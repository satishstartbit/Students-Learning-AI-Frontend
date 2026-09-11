import { LuCheck } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { ASSIGNMENT_RECIPIENT_STATUS as STATUS } from '../../../../utils/constants';
import { getSubjectStyle } from './subjectStyle';
import { STATUS_WORDS, getDueInfo } from './kidFormat';

/**
 * The cut-paper building blocks of the K-5 theme: paper cards, washi tape,
 * subject tiles, status circles and due-date chips. Tailwind only, on the
 * kid tokens from styles/kid-theme.css.
 */

const PAPER_TONES = {
  sheet: 'bg-kid-sheet',
  yellow: 'bg-kid-yellow',
  green: 'bg-kid-green',
  pink: 'bg-kid-pink',
  sky: 'bg-kid-sky',
  lavender: 'bg-kid-lavender',
};

/**
 * A sheet of paper. `backing` slips a second, slightly skewed sheet of that
 * tone underneath (the stacked look of the "next task" card); `className`
 * styles the top sheet, `wrapperClassName` places the whole stack.
 */
export function PaperCard({
  as: Component = 'div',
  tone = 'sheet',
  backing,
  className,
  wrapperClassName,
  children,
  ...props
}) {
  const sheet = (
    <Component
      className={cn(
        'relative rounded-[1.75rem] shadow-paper',
        PAPER_TONES[tone],
        !backing && wrapperClassName,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );

  if (!backing) return sheet;

  return (
    <div className={cn('relative isolate', wrapperClassName)}>
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 translate-x-1.5 translate-y-2.5 -rotate-[1.4deg] rounded-[1.75rem] shadow-paper',
          PAPER_TONES[backing]
        )}
      />
      {sheet}
    </div>
  );
}

const TAPE_TONES = {
  pink: 'bg-kid-pink/90',
  yellow: 'bg-[#f1d97a]/85',
  lavender: 'bg-[#c9bdf0]/85',
  green: 'bg-[#b9d7a0]/85',
};

/** Torn short ends, like tape pulled off a roll. */
const TAPE_CLIP =
  'polygon(2% 0, 98% 0, 100% 18%, 97% 36%, 100% 54%, 97% 72%, 100% 90%, 98% 100%, 2% 100%, 0 82%, 3% 64%, 0 46%, 3% 28%, 0 10%)';

/** A decorative strip of washi tape. Position it with `className`. */
export function Tape({ tone = 'yellow', className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute block h-7 w-24', TAPE_TONES[tone], className)}
      style={{ clipPath: TAPE_CLIP }}
    />
  );
}

/** A handwritten label on a strip of tape - "Your next task". */
export function TapeLabel({ as: Component = 'span', tone = 'pink', className, children, ...props }) {
  return (
    <Component
      className={cn(
        'inline-block px-6 py-1.5 font-kid-hand text-[1.6rem] leading-tight text-kid-ink',
        TAPE_TONES[tone],
        className
      )}
      style={{ clipPath: TAPE_CLIP }}
      {...props}
    >
      {children}
    </Component>
  );
}

const TILE_SIZES = {
  sm: 'size-14 rounded-2xl [&_svg]:size-7',
  md: 'size-16 rounded-2xl [&_svg]:size-8',
  xl: 'size-24 rounded-[1.75rem] sm:size-28 [&_svg]:size-12 sm:[&_svg]:size-14',
};

/** The subject's picture on a coloured paper square. Decorative - the subject name is printed nearby. */
export function SubjectTile({ subject, size = 'md', className }) {
  const { icon: Icon, tile, ink } = getSubjectStyle(subject);

  return (
    <span
      aria-hidden="true"
      className={cn('grid shrink-0 place-items-center shadow-paper', tile, ink, TILE_SIZES[size], className)}
    >
      <Icon strokeWidth={2.2} />
    </span>
  );
}

/**
 * The circle at the end of a task card (the mockup's radio circle). It
 * shows progress rather than being a checkbox - a student can't tick work
 * off here, it's finished by handing it in.
 */
export function StatusCircle({ status, className }) {
  const base = 'grid size-9 shrink-0 place-items-center rounded-full border-[3px]';
  const label = STATUS_WORDS[status] ?? '';

  const look = {
    [STATUS.ASSIGNED]: 'border-[#b9ab93] bg-kid-sheet',
    [STATUS.IN_PROGRESS]: 'border-kid-teal bg-[conic-gradient(var(--kid-teal)_0_50%,transparent_50%_100%)]',
    [STATUS.RETURNED]: 'border-kid-coral bg-kid-coral-soft text-kid-coral',
    [STATUS.SUBMITTED]: 'border-kid-teal bg-kid-teal text-white',
    [STATUS.REVIEWED]: 'border-kid-green-deep bg-kid-green-deep text-white',
    [STATUS.COMPLETED]: 'border-kid-green-deep bg-kid-green-deep text-white',
  }[status];

  return (
    <span role="img" aria-label={label} title={label} className={cn(base, look, className)}>
      {status === STATUS.RETURNED && <span className="font-kid-display text-lg font-bold leading-none">!</span>}
      {[STATUS.SUBMITTED, STATUS.REVIEWED, STATUS.COMPLETED].includes(status) && (
        <LuCheck strokeWidth={3.5} className="size-5" />
      )}
    </span>
  );
}

const DUE_TONES = {
  late: 'bg-kid-coral-soft text-kid-coral',
  today: 'bg-kid-yellow text-[#6b4f05]',
  soon: 'bg-kid-sky text-kid-navy',
  later: 'bg-kid-paper-deep text-kid-ink-soft',
};

/** "Due today" / "Late" / "Due Friday" on a small paper tag. */
export function DueChip({ dueDate, status, className }) {
  const due = getDueInfo(dueDate, status);
  if (!due) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-0.5 font-kid-display text-sm font-medium',
        DUE_TONES[due.tone],
        className
      )}
    >
      {due.label}
    </span>
  );
}
