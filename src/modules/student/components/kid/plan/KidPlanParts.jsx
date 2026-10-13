import { Link } from 'react-router-dom';
import { LuArrowRight, LuCalendarDays, LuCheck, LuCircleCheck, LuClock3, LuLock } from 'react-icons/lu';
import { subjectPaint } from '../../../../../components/subjects/subjectColor';
import { cn } from '../../../../../lib/utils';
import { formatDateKey } from '../../../../../utils/date';
import { estimateOf, kidDayText, shortMinutes } from '../../../../planner/components/schoolwork/schoolworkFormat';
import { canTick, planSections } from '../../../../planner/schoolwork';
import { EarnedStars } from '../home/HomeBits';
import { opensLabel, starsForMinutes } from '../kidFormat';
import { SubjectPicture } from '../PaperKit';

/**
 * The K-4 My week pieces (pages/kid/KidMyWeekPage.jsx), built to the K-4
 * Notes / List / Calendar mockups. Everything here is the schoolwork list's
 * work shape (GET /students/me/work) - the same data in every view.
 *
 *   KidPlanNote     a taped picture note for the Notes board (SchoolworkBoard renderNote)
 *   KidPlanList     "Next" (a big card with Let's go!), "Then", "Done!"
 *   KidPlanRow      one row: picture, title, minutes, stars, the circle
 *   KidCalendarTile a picture tile in a day column (laptop / tablet)
 *   KidDayStrip     Mon-Fri buttons for the phone calendar
 */

const isTeacher = (w) => w.kind === 'teacher';

/** A chip on a note: white paper, an icon, a few words. */
function Chip({ icon: Icon, tone, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-kid-sheet/95 px-2.5 py-1 font-kid-display text-[13px] font-semibold leading-none shadow-[0_1px_0_rgb(92_70_45/0.08)]',
        tone === 'done' ? 'text-kid-green-deep' : 'text-kid-ink'
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" strokeWidth={2.4} />
      {children}
    </span>
  );
}

/**
 * The Notes mockup's note: tape on top, a pastel of the subject's colour,
 * the subject's picture, the title, and chips for the day it's due and how
 * long it takes. Finished work is plain paper with "Done!". Tapping the title
 * opens it (moving it happens there, or by dragging the note).
 */
export function KidPlanNote({ work, today, colorOf, preferences, onOpen }) {
  const done = work.progress === 'done';
  const paint = subjectPaint(colorOf(work.subject));
  const day = kidDayText(work.dueDate, today);
  const minutes = preferences.showEstimatedTime ? estimateOf(work) : null;
  return (
    <article
      className={cn(
        'relative flex flex-col gap-3 rounded-[0.6rem_0.6rem_1.1rem_1.1rem] px-4 pb-4 pt-5 shadow-paper transition-transform duration-200 [transform:rotate(var(--sw-tilt,0deg))] hover:[transform:rotate(0deg)_translateY(-2px)]',
        done ? 'bg-kid-sheet' : !paint.style && 'bg-kid-sheet'
      )}
      style={!done && paint.style ? { ...paint.style, backgroundColor: 'color-mix(in srgb, var(--subject-color) 42%, var(--kid-sheet))' } : undefined}
      data-done={done || undefined}
    >
      <span aria-hidden="true" className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 -rotate-2 rounded-[2px] bg-[#f1e0a6]/85 shadow-[0_1px_1px_rgb(92_70_45/0.1)]" />
      <div className="flex items-center gap-3">
        <SubjectPicture subject={work.subject} className={cn('size-11 rounded-full text-[1.45rem]', done && 'opacity-60')} />
        <button
          type="button"
          onClick={() => onOpen(work)}
          className={cn('min-w-0 text-left font-kid-display text-lg font-semibold leading-snug hover:underline', done ? 'text-kid-ink-soft' : 'text-kid-ink')}
        >
          {work.title}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {done ? (
          <Chip icon={LuCircleCheck} tone="done">
            Done!
          </Chip>
        ) : (
          day && <Chip icon={LuCalendarDays}>{day}</Chip>
        )}
        {minutes && <Chip icon={LuClock3}>{shortMinutes(minutes)}</Chip>}
      </div>
    </article>
  );
}

/**
 * The circle at the end of a row: tick own work done (or not done again),
 * open teacher work to hand it in, a green tick once it's finished, a lock
 * while it hasn't opened yet.
 */
function KidTick({ work, busy, locked, onMove, onHandIn }) {
  const done = work.progress === 'done';
  const base = 'grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors';
  if (locked) {
    return (
      <span role="img" aria-label="Not open yet" className={cn(base, 'border-kid-edge bg-kid-sheet text-kid-ink-soft')}>
        <LuLock className="size-4" aria-hidden="true" />
      </span>
    );
  }
  if (canTick(work)) {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Mark “${work.title}” as not done` : `Mark “${work.title}” as done`}
        disabled={busy}
        onClick={() => onMove(work, done ? 'todo' : 'done')}
        className={cn(base, done ? 'border-kid-green-deep bg-kid-green-deep text-white' : 'border-kid-edge bg-kid-sheet hover:border-kid-teal', busy && 'opacity-60')}
      >
        {done && <LuCheck className="size-5" strokeWidth={3} aria-hidden="true" />}
      </button>
    );
  }
  if (isTeacher(work) && !done) {
    return <button type="button" aria-label={`Open “${work.title}” to hand it in`} onClick={() => onHandIn(work)} className={cn(base, 'border-kid-edge bg-kid-sheet hover:border-kid-teal')} />;
  }
  return (
    <span role="img" aria-label={done ? 'Done' : 'Not done yet'} className={cn(base, done ? 'border-kid-green-deep bg-kid-green-deep text-white' : 'border-kid-edge bg-kid-sheet')}>
      {done && <LuCheck className="size-5" strokeWidth={3} aria-hidden="true" />}
    </span>
  );
}

/** Minutes and gold stars (when the student shows time). */
function TimeAndStars({ work, preferences, size = 'sm' }) {
  const minutes = estimateOf(work);
  if (!preferences.showEstimatedTime || !minutes) return null;
  return (
    <>
      <span className="inline-flex items-center gap-1">
        <LuClock3 className="size-3.5" aria-hidden="true" /> {shortMinutes(minutes)}
      </span>
      <EarnedStars stars={starsForMinutes(minutes)} size={size} />
    </>
  );
}

/** One row of the list (and of a day on the phone calendar). */
export function KidPlanRow({ work, preferences, busy, onOpen, onMove, onHandIn }) {
  const done = work.progress === 'done';
  const opens = done ? null : opensLabel(work.startDate);
  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-[1.3rem] border px-3.5 py-3 shadow-paper sm:gap-4 sm:px-4',
        done ? 'border-kid-green-deep/25 bg-[color-mix(in_srgb,var(--kid-mint)_55%,var(--kid-sheet))]' : opens ? 'border-kid-edge/60 bg-kid-sheet/70' : 'border-kid-edge/60 bg-kid-sheet'
      )}
      data-done={done || undefined}
    >
      <SubjectPicture subject={work.subject} className={cn('size-11 rounded-full text-[1.45rem]', opens && 'opacity-60')} />
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => onOpen(work)} className="text-left font-kid-display text-[17px] font-semibold leading-snug text-kid-ink hover:underline">
          {work.title}
        </button>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-kid-body text-sm text-kid-ink-soft">
          {opens ? <span className="font-kid-display font-semibold">{opens}</span> : <TimeAndStars work={work} preferences={preferences} />}
        </p>
      </div>
      <KidTick work={work} busy={busy} locked={Boolean(opens)} onMove={onMove} onHandIn={onHandIn} />
    </li>
  );
}

function SectionTitle({ id, children }) {
  return (
    <h2 id={id} className="font-kid-display text-xl font-semibold text-kid-ink">
      {children}
    </h2>
  );
}

/**
 * The List mockup: "Next" - the first open piece of work in the Sort order,
 * big, with "Let's go!" (onGo: its page, or Focus for own work) - then
 * "Then" (the rest) and "Done!" (finished, most recent first).
 */
export function KidPlanList({ work, priorities, sort, preferences, busyId, onOpen, onMove, onHandIn, onGo }) {
  const { open, done } = planSections(work, priorities, sort);
  const [next, ...then] = open;
  const rowProps = (w) => ({ work: w, preferences, busy: busyId === w.id, onOpen, onMove, onHandIn });

  if (!next && !done.length) {
    return (
      <div className="rounded-[1.6rem] border-2 border-dashed border-kid-edge bg-kid-sheet/60 px-6 py-10 text-center">
        <p className="font-kid-display text-xl font-semibold text-kid-ink">Nothing on your list!</p>
        <p className="mt-1 font-kid-body text-base text-kid-ink-soft">When you get new work, it will show up here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {next ? (
        <section aria-labelledby="kp-next" className="flex flex-col gap-3">
          <SectionTitle id="kp-next">Next</SectionTitle>
          <article className="kh-pop flex flex-col gap-4 rounded-[1.6rem] border border-kid-edge/60 bg-kid-sheet p-4 shadow-paper sm:flex-row sm:items-center sm:gap-6 sm:p-6">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <SubjectPicture subject={next.subject} className="size-16 text-[2.1rem] sm:size-[4.5rem] sm:text-[2.4rem]" />
              <div className="min-w-0">
                <button type="button" onClick={() => onOpen(next)} className="text-left font-kid-display text-[1.45rem] font-semibold leading-tight text-kid-ink hover:underline sm:text-2xl">
                  {next.title}
                </button>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-kid-body text-sm text-kid-ink-soft">
                  {next.subject && <span>{next.subject}</span>}
                  <TimeAndStars work={next} preferences={preferences} size="md" />
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGo(next)}
              className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-kid-teal px-6 font-kid-display text-base font-semibold text-white shadow-[0_3px_0_var(--kid-teal-deep)] transition-transform hover:-translate-y-0.5 sm:min-h-11"
            >
              Let’s go! <LuArrowRight className="kh-nudge size-4.5" aria-hidden="true" />
            </button>
          </article>
        </section>
      ) : (
        <p className="rounded-[1.4rem] bg-kid-sheet/70 px-5 py-4 font-kid-display text-lg font-semibold text-kid-ink">All done for now - great job!</p>
      )}

      {then.length > 0 && (
        <section aria-labelledby="kp-then" className="flex flex-col gap-3">
          <SectionTitle id="kp-then">Then</SectionTitle>
          <ul className="flex flex-col gap-3">
            {then.map((w) => (
              <KidPlanRow key={w.id} {...rowProps(w)} />
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section aria-labelledby="kp-done" className="flex flex-col gap-3">
          <SectionTitle id="kp-done">Done!</SectionTitle>
          <ul className="flex flex-col gap-3">
            {done.map((w) => (
              <KidPlanRow key={w.id} {...rowProps(w)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * A task in its day column (laptop / tablet calendar): the subject's big
 * picture, the title, gold stars; "Opens Friday" with a lock while it hasn't
 * opened (still a link - the backend doesn't lock it); a small tick when
 * finished. Teacher work links to its page; own work opens (onOpen). In 3D:
 * it flips into place and tilts towards you when pointed at (kh-tile3d).
 */
export function KidCalendarTile({ work, preferences, delay = 0, onOpen }) {
  const done = work.progress === 'done';
  const opens = done ? null : opensLabel(work.startDate);
  const minutes = estimateOf(work);
  const body = (
    <>
      {opens && <LuLock aria-hidden="true" className="absolute right-2.5 top-2.5 size-3.5 text-kid-ink-soft" />}
      {done && (
        <span aria-hidden="true" className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-kid-green-deep text-white">
          <LuCheck className="size-3" strokeWidth={3.2} />
        </span>
      )}
      <SubjectPicture
        subject={work.subject}
        className={cn(
          'size-14 text-[1.9rem] transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110 lg:size-16 lg:text-[2.2rem]',
          (opens || done) && 'opacity-60'
        )}
      />
      <span className={cn('line-clamp-3 font-kid-display text-[0.95rem] font-semibold leading-tight', done ? 'text-kid-ink-soft' : 'text-kid-ink')}>{work.title}</span>
      {opens ? (
        <span className="mt-auto font-kid-display text-xs font-semibold text-kid-ink-soft">{opens}</span>
      ) : (
        preferences.showEstimatedTime && minutes > 0 && <EarnedStars stars={starsForMinutes(minutes)} size="sm" className="kh-star-hover mt-auto" />
      )}
      <span className="sr-only">{done ? ' (done)' : ''}</span>
    </>
  );
  const className = cn(
    'kh-tile3d group relative flex h-full w-full flex-col items-center gap-2 rounded-[1.2rem] border border-kid-edge/50 px-2 pb-3 pt-3 text-center no-underline shadow-paper hover:shadow-paper-lg',
    opens || done ? 'bg-kid-sheet/80' : 'bg-kid-sheet'
  );
  return isTeacher(work) ? (
    <Link to={`/student/assignments/${work.id}`} className={className} style={{ '--kh-delay': `${delay}s` }}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={() => onOpen(work)} className={className} style={{ '--kh-delay': `${delay}s` }}>
      {body}
    </button>
  );
}

/**
 * The phone calendar's Mon-Fri strip (the K-4 Calendar phone mockup): the
 * short weekday and the date; the picked day filled teal, today ringed.
 */
export function KidDayStrip({ dayKeys, selectedKey, todayKey, onPick }) {
  return (
    <div role="group" aria-label="Pick a day" className="grid grid-cols-5 gap-2">
      {dayKeys.map((key) => {
        const selected = key === selectedKey;
        const today = key === todayKey;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            aria-label={`${formatDateKey(key, { weekday: 'long', month: 'long', day: 'numeric', year: undefined })}${today ? ', today' : ''}`}
            onClick={() => onPick(key)}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center rounded-2xl border font-kid-display leading-tight transition-colors',
              selected
                ? 'border-kid-teal bg-kid-teal text-white shadow-[0_3px_0_var(--kid-teal-deep)]'
                : today
                  ? 'border-kid-teal/60 bg-kid-sheet text-kid-ink'
                  : 'border-kid-edge/70 bg-kid-sheet text-kid-ink hover:border-kid-teal/50'
            )}
          >
            <span className={cn('text-xs font-medium', selected ? 'text-white/90' : 'text-kid-ink-soft')}>
              {formatDateKey(key, { weekday: 'short', month: undefined, day: undefined, year: undefined })}
            </span>
            <span className="text-lg font-semibold">{formatDateKey(key, { day: 'numeric', month: undefined, year: undefined })}</span>
          </button>
        );
      })}
    </div>
  );
}
