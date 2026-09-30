import { LuCheck, LuStar } from 'react-icons/lu';
import { subjectPaint } from '../../../../components/subjects/subjectColor';
import { useSubjectColors } from '../../../../components/subjects/useSubjectColors';
import { cn } from '../../../../lib/utils';
import { ASSIGNMENT_RECIPIENT_STATUS as STATUS } from '../../../../utils/constants';
import { getSubjectStyle } from './subjectStyle';
import { STATUS_WORDS, getDueInfo } from './kidFormat';

/**
 * The flat, soft-illustration building blocks of the K-5 theme: cards,
 * pill badges, subject tiles, status circles and due-date chips. Tailwind
 * only, on the kid tokens from styles/kid-theme.css.
 */

const PAPER_TONES = {
  sheet: 'bg-kid-sheet',
  yellow: 'bg-kid-yellow',
  green: 'bg-kid-green',
  pink: 'bg-kid-pink',
  sky: 'bg-kid-sky',
  lavender: 'bg-kid-lavender',
};

/** A plain, softly-shadowed rounded card - the base surface for every K-5 panel. */
export function PaperCard({ as: Component = 'div', tone = 'sheet', className, children, ...props }) {
  return (
    <Component className={cn('relative rounded-[1.75rem] shadow-paper', PAPER_TONES[tone], className)} {...props}>
      {children}
    </Component>
  );
}

const TAPE_TONES = {
  pink: 'bg-kid-pink text-[#8f2f45]',
  yellow: 'bg-kid-yellow text-[#6b4f05]',
  lavender: 'bg-kid-lavender text-kid-purple',
  green: 'bg-kid-green text-kid-green-deep',
};

/** A small floating pill badge - e.g. "Your next task" above a card. */
export function Tape({ tone = 'yellow', className, children }) {
  return (
    <span
      aria-hidden={children ? undefined : 'true'}
      className={cn(
        'inline-flex items-center rounded-full px-4 py-1 font-kid-display text-sm font-semibold shadow-paper',
        TAPE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** A rounded pill label floating above a card - "Your next task". */
export function TapeLabel({ as: Component = 'span', tone = 'pink', className, children, ...props }) {
  return (
    <Component
      className={cn(
        'inline-flex items-center rounded-full px-4 py-1.5 font-kid-display text-base font-semibold leading-tight shadow-paper',
        TAPE_TONES[tone],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

const TILE_SIZES = {
  sm: 'size-12 rounded-full [&_svg]:size-6',
  md: 'size-14 rounded-full [&_svg]:size-7',
  xl: 'size-20 rounded-full sm:size-24 [&_svg]:size-10 sm:[&_svg]:size-11',
};

/**
 * The subject's picture on a coloured paper circle. Decorative - the subject
 * name is printed nearby. The paper is the subject's own colour when one is
 * known (Subjects master or the student's choice - the same colour as on
 * their sticky notes and calendar), else the kid palette's.
 */
export function SubjectTile({ subject, size = 'md', className }) {
  const { icon: Icon, tile, ink } = getSubjectStyle(subject);
  const { colorOf } = useSubjectColors();
  const paint = subjectPaint(colorOf(subject));

  return (
    <span
      aria-hidden="true"
      className={cn('grid shrink-0 place-items-center shadow-paper', !paint.style && tile, !paint.style && ink, TILE_SIZES[size], className)}
      style={
        paint.style
          ? { ...paint.style, backgroundColor: 'var(--subject-color)', color: paint['data-ink'] === 'light' ? 'var(--color-text-on-dark)' : 'var(--color-text-on-light)' }
          : undefined
      }
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
    [STATUS.ASSIGNED]: 'border-[#d7dbe0] bg-kid-sheet',
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

const STAR_SIZES = {
  sm: '[&_svg]:size-3.5',
  md: '[&_svg]:size-4.5',
};

/** 1-3 gold stars, from kidFormat.js#starsForMinutes - "how big is this task", in a picture a five-year-old reads. */
export function StarRating({ stars, max = 3, size = 'md', className }) {
  return (
    <span aria-label={`${stars} out of ${max}`} className={cn('inline-flex items-center gap-0.5', STAR_SIZES[size], className)}>
      {Array.from({ length: max }, (_, i) => (
        <LuStar
          key={i}
          strokeWidth={0}
          className={i < stars ? 'fill-kid-sun text-kid-sun' : 'fill-kid-paper-deep text-kid-paper-deep'}
        />
      ))}
    </span>
  );
}
