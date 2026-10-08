import { Link } from 'react-router-dom';
import { LuHeart, LuLock, LuPlus } from 'react-icons/lu';
import { cn } from '../../../../../lib/utils';
import { daysUntilDateKey, formatDateKey, isDateKey } from '../../../../../utils/date';
import { EarnedStars, HomeSticker } from '../home/HomeBits';
import { starsForMinutes } from '../kidFormat';
import { SubjectPicture } from '../PaperKit';

/**
 * Pieces of the K-4 "My week" days (pages/kid/KidMyWeekPage.jsx), drawn to
 * the "My week" mockup: a picture tile per task, the "A day off!" card with
 * its little hill, and the dashed "+".
 */

const weekdayOf = (key) => formatDateKey(key, { weekday: 'long', year: undefined, month: undefined, day: undefined });

/** "Opens Friday" when the work's start day is still ahead (a teacher can schedule it to start later). */
function opensLabel(startDate) {
  if (!isDateKey(startDate)) return null;
  const days = daysUntilDateKey(startDate);
  if (days === null || days <= 0) return null;
  return days < 7 ? `Opens ${weekdayOf(startDate)}` : `Opens ${formatDateKey(startDate, { year: undefined })}`;
}

/**
 * One task on its day: the subject's big picture, the title, the gold stars
 * (when the student shows time). In 3D (kh-tile3d): it flips down into place
 * when the week opens, and tilts towards you, lifted, when pointed at.
 */
export function WeekTaskTile({ task, showStars, delay = 0 }) {
  const assignment = task.assignment ?? {};
  const opens = opensLabel(assignment.startDate);

  return (
    <Link
      to={`/student/assignments/${assignment.id}`}
      className={cn(
        'kh-tile3d group relative flex h-full flex-col items-center gap-2 rounded-[1.2rem] border border-kid-edge/50 bg-kid-sheet px-2 pb-3 pt-3 text-center no-underline shadow-paper hover:shadow-paper-lg',
        opens && 'bg-kid-sheet/80'
      )}
      style={{ '--kh-delay': `${delay}s` }}
    >
      {opens && <LuLock aria-hidden="true" className="absolute right-2.5 top-2.5 size-3.5 text-kid-ink-soft" />}
      <SubjectPicture
        subject={assignment.subject}
        className={cn(
          'size-14 text-[1.9rem] transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110 lg:size-16 lg:text-[2.2rem]',
          opens && 'opacity-60'
        )}
      />
      <span className="line-clamp-3 font-kid-display text-[0.95rem] font-semibold leading-tight text-kid-ink">{assignment.title}</span>
      {showStars && !opens && (
        <EarnedStars stars={starsForMinutes(assignment.estimatedMinutes)} size="sm" className="kh-star-hover mt-auto" />
      )}
      {opens && <span className="mt-auto font-kid-display text-xs font-semibold text-kid-ink-soft">{opens}</span>}
    </Link>
  );
}

/**
 * "A day off!" - nothing due and nothing planned: rest, a star, and a little
 * hill with a daisy that sways. A tall card in a day column; `stacked` keeps
 * it tall on a phone too (the phone calendar's one-day view).
 */
export function DayOffCard({ stacked = false }) {
  return (
    <div
      className={cn(
        'relative flex flex-1 overflow-hidden rounded-[1.2rem]',
        stacked
          ? 'flex-col items-center gap-1.5 px-2 pt-7 text-center'
          : 'items-center gap-4 px-3 py-3 md:flex-col md:justify-start md:gap-1.5 md:px-2 md:pb-0 md:pt-8 md:text-center'
      )}
    >
      <span className="kh-beat grid size-9 shrink-0 place-items-center text-kid-ink-soft" aria-hidden="true">
        <LuHeart className="size-6" strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="font-kid-display text-base font-semibold text-kid-ink">A day off!</p>
        <p className="font-kid-body text-sm leading-snug text-kid-ink-soft">Rest, play and be proud!</p>
      </div>
      <HomeSticker slug="star" motion="float" tilt={-6} delay={0.4} className={cn('relative size-9', stacked ? 'mt-2 block' : 'hidden md:mt-4 md:block')} />
      <DayOffScene className={cn('shrink-0', stacked ? 'mt-2 w-full max-w-[18rem]' : 'ml-auto w-24 md:ml-0 md:mt-auto md:w-full')} />
    </div>
  );
}

/** A small hill with grass and a white daisy - the foot of the "day off" column. */
function DayOffScene({ className }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 80" className={cn('block', className)}>
      <ellipse cx="60" cy="86" rx="78" ry="34" fill="#a9cd86" />
      <ellipse cx="96" cy="84" rx="40" ry="22" fill="#95c07b" />
      <g className="kh-sway" style={{ '--kh-delay': '0.3s' }}>
        <path d="M22 66 C20 52 24 44 30 40 C28 50 28 58 30 66Z" fill="#5d9c4c" />
        <path d="M30 66 C32 54 38 48 44 46 C40 54 36 60 34 66Z" fill="#6fae5c" />
      </g>
      <g className="kh-sway" style={{ '--kh-delay': '1s' }}>
        <path d="M76 62 C77 50 76 40 74 30" stroke="#4f8a3c" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M76 52 C70 50 66 46 64 40 C70 40 74 44 76 52Z" fill="#7cb65f" />
        <g transform="translate(74 26)">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx="0" cy="-6.5" rx="3.6" ry="6" fill="#ffffff" stroke="#e7e2d6" strokeWidth="0.6" transform={`rotate(${a})`} />
          ))}
          <circle r="3.6" fill="#f6c445" />
        </g>
      </g>
      <g className="kh-sway" style={{ '--kh-delay': '1.7s' }}>
        <path d="M96 66 C95 56 98 50 103 46 C101 54 101 60 102 66Z" fill="#5d9c4c" />
      </g>
    </svg>
  );
}

/** The dashed "+" at the foot of a day: add work the easy way (the same Add work as Home's "Got new work?"). */
export function AddWorkButton({ onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add work"
      title="Add work"
      className={cn(
        'kh-wiggle grid size-11 -rotate-6 place-items-center rounded-xl border-2 border-dashed border-kid-ink-soft/50 bg-kid-sheet/50 text-kid-ink-soft transition-colors hover:border-kid-teal hover:text-kid-teal md:mx-auto md:mt-auto',
        className
      )}
    >
      <LuPlus className="size-5" aria-hidden="true" />
    </button>
  );
}
