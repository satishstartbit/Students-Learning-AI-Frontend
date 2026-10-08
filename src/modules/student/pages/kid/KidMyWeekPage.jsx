import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import weekArt from '../../../../assets/kid/week-hero.webp';
import weekArtSmall from '../../../../assets/kid/week-hero-small.webp';
import weekPaw from '../../../../assets/kid/week-paw.webp';
import { useAuth } from '../../../../hooks/useAuth';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { cn } from '../../../../lib/utils';
import { addDaysToKey, formatDateKey, getDateKey } from '../../../../utils/date';
import AddWorkDialog from '../../../planner/components/AddWorkDialog';
import DayAgenda from '../../../planner/components/schoolwork/DayAgenda';
import SchoolworkBoard from '../../../planner/components/schoolwork/SchoolworkBoard';
import SortMenu from '../../../planner/components/schoolwork/SortMenu';
import { ViewIcon } from '../../../planner/components/schoolwork/ViewSwitcher';
import WorkNoteDialog from '../../../planner/components/schoolwork/WorkNoteDialog';
import { usePlan } from '../../../planner/hooks/usePlan';
import { useSchoolwork } from '../../../planner/hooks/useSchoolwork';
import { useSchoolworkSettings } from '../../../planner/hooks/useSchoolworkSettings';
import { blocksByDay } from '../../../planner/planView';
import { DEFAULT_SORT, VIEW_OPTIONS, eventsByDay, sortOptionsFor, workByDueDay } from '../../../planner/schoolwork';
import '../../../planner/components/schoolwork/schoolwork.css';
import { startOfWeek } from '../../hooks/useWeekPlan';
import focusService from '../../services/focus.service';
import { Bird3D, BirdSky, Butterfly, DriftingCloud, FallingLeaf, RisingHearts, Sparkle, SunGlow, WaveMarks } from '../../components/kid/BannerBits';
import { KidBannerHero } from '../../components/kid/KidBannerHero';
import { MeadowFooter } from '../../components/kid/MeadowFooter';
import { KidSkeleton, KidOops } from '../../components/kid/KidStates';
import { KidCalendarTile, KidDayStrip, KidPlanList, KidPlanNote, KidPlanRow } from '../../components/kid/plan/KidPlanParts';
import { AddWorkButton, DayOffCard } from '../../components/kid/week/WeekParts';

/** Mon-Fri only - school days, matching "one thing at a time" rather than a full 7-day grid. */
const WEEKDAY_COUNT = 5;
/** A day shows the dashed "+" while it has room (and isn't over). */
const ROOM_FOR_MORE = 3;
/** Below this width the calendar is one day at a time, picked from a Mon-Fri strip. */
const ONE_DAY_BELOW = 768;

/** What K-4 calls the three views (the mockups). */
const KID_LABELS = { board: 'Notes', list: 'List', calendar: 'Calendar' };
const KID_COLUMNS = { todo: 'To do', doing: 'Doing', done: 'Done!' };

/**
 * src/assets/kid/week-hero*.webp - the bunny under the tree, with its raised
 * paw painted out; the paw (forearm) is src/assets/kid/week-paw.webp (the
 * picture's pixels 786-833 x 152-215), laid back on its place so it waves.
 */
const ART = { src: weekArt, srcSmall: weekArtSmall, smallWidth: 1000, bigWidth: 1032, width: 1032, height: 253, sky: '#bee7fd' };

/**
 * The phone calendar (the K-4 Calendar phone mockups): the Mon-Fri strip,
 * then the picked day - its name with a dashed "+", "Today · 3 tasks" or "A
 * day off", its tasks as rows (a lock on work that opens later), and its
 * study times and plans.
 */
function KidOneDay({ school, pickedKey, onPick, todayKey, items, dayBlocks, dayEvents, weekIsEmpty, timeZone, colorOf, preferences, rowHandlers, onAdd }) {
  const isToday = pickedKey === todayKey;
  const isPast = pickedKey < todayKey;
  const hasAgenda = dayBlocks.length > 0 || dayEvents.length > 0;
  const count = `${items.length} ${items.length === 1 ? 'task' : 'tasks'}`;
  const summary = items.length ? (isToday ? `Today · ${count}` : count) : weekIsEmpty ? 'Nothing yet' : isToday ? 'Today · a day off' : 'A day off';
  return (
    <div className="mt-5 flex flex-col gap-4">
      <KidDayStrip dayKeys={school} selectedKey={pickedKey} todayKey={todayKey} onPick={onPick} />
      <section aria-labelledby="kid-day-title" className="flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 id="kid-day-title" className="font-kid-display text-[1.6rem] font-semibold leading-tight text-kid-ink">
              {formatDateKey(pickedKey, { weekday: 'long', month: 'long', day: 'numeric', year: undefined })}
            </h2>
            {!isPast && <AddWorkButton onClick={() => onAdd(pickedKey)} className="size-10 shrink-0" />}
          </div>
          <p className="mt-0.5 font-kid-body text-sm text-kid-ink-soft">{summary}</p>
        </div>

        {items.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {items.map((w) => (
              <KidPlanRow key={w.id} work={w} preferences={preferences} busy={rowHandlers.busyId === w.id} {...rowHandlers} />
            ))}
          </ul>
        ) : weekIsEmpty ? (
          <div className="rounded-[1.6rem] border-2 border-dashed border-kid-edge bg-kid-sheet/60 px-5 py-8 text-center">
            <p className="font-kid-display text-lg font-semibold text-kid-ink">Nothing yet</p>
            <p className="mt-1 font-kid-body text-sm text-kid-ink-soft">Tap + to add work for this day.</p>
          </div>
        ) : (
          !hasAgenda && (
            <div className="overflow-hidden rounded-[1.6rem] border border-kid-edge/70 bg-kid-sheet shadow-paper">
              <DayOffCard stacked />
            </div>
          )
        )}

        {hasAgenda && (
          <div className="rounded-[1.3rem] bg-kid-sheet/90 p-3 shadow-paper">
            <DayAgenda blocks={dayBlocks} events={dayEvents} timeZone={timeZone} colorOf={colorOf} showTypeIcons={preferences.showTypeIcons} />
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * K-4 "My week", built to the K-4 Notes / List / Calendar mockups - the same
 * schoolwork three ways, chosen in Settings and switchable here any time,
 * with a Sort menu ("What's next", "Due first", "Subject"):
 *
 *   Notes     taped picture notes in their subject colours: To do, Doing,
 *             Done! (drag one, or open it to move it)
 *   List      "Next" - big, with Let's go! - then "Then" and "Done!"
 *   Calendar  Monday to Friday: what is due each day as picture tiles, study
 *             times and their own plans, "A day off!" when there is nothing
 *             ("Nothing yet" when the whole week is empty), a dashed "+" to
 *             add work. On a phone: a Mon-Fri strip and one day at a time.
 *
 * Every view reads the same work and plan as the Grade 6+ page (GET
 * /students/me/work - teacher work and their own); this is its kid look.
 */
export default function KidMyWeekPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useSchoolworkSettings('me');
  const { preferences, colorOf } = settings;
  const [chosenView, setChosenView] = useState(null);
  const view = chosenView ?? preferences.defaultView;
  const [sorts, setSorts] = useState(DEFAULT_SORT);
  const sort = sorts[view] ?? 'plan';
  const [openWork, setOpenWork] = useState(null);
  // Add work: null = closed, else { dueDate } (a day's "+") or {}.
  const [adding, setAdding] = useState(null);
  const oneDay = useIsMobile(ONE_DAY_BELOW);

  const todayKey = getDateKey();
  const weekStartKey = getDateKey(startOfWeek());
  const school = Array.from({ length: WEEKDAY_COUNT }, (_, i) => addDaysToKey(weekStartKey, i));
  // The phone's picked day: today on a school day, else Monday.
  const [pickedKey, setPickedKey] = useState(() => (school.includes(todayKey) ? todayKey : weekStartKey));

  const plan = usePlan('me', { from: weekStartKey, to: addDaysToKey(weekStartKey, 13) });
  const blocks = useMemo(() => blocksByDay(plan.plan?.blocks ?? []), [plan.plan]);
  const events = useMemo(() => eventsByDay(plan.plan?.personalEvents ?? []), [plan.plan]);
  const schoolwork = useSchoolwork('me', { onChanged: () => plan.reload() });
  const priorities = useMemo(() => plan.plan?.priorities ?? [], [plan.plan]);
  const byDay = useMemo(() => workByDueDay(schoolwork.work, priorities, sort), [schoolwork.work, priorities, sort]);
  const weekIsEmpty = school.every((key) => !(byDay.get(key)?.length > 0) && !(blocks.get(key)?.length > 0) && !(events.get(key)?.length > 0));

  const openAssignment = (work) => navigate(`/student/assignments/${work.id}`);
  // Let's go!: teacher work opens its page; their own work starts a focus session on it.
  const go = (work) => (work.kind === 'teacher' ? openAssignment(work) : navigate(`/student/focus?assignment=${encodeURIComponent(work.id)}`));
  const waitingForSettings = !settings.loaded && settings.isLoading;
  const afterAdding = () => {
    plan.reload();
    schoolwork.reload?.();
  };
  const rowHandlers = { busyId: schoolwork.busyId, onOpen: setOpenWork, onMove: schoolwork.move, onHandIn: openAssignment };

  return (
    <div data-kid-page className="kid-ui relative flex min-h-full flex-col overflow-x-clip">
      <KidBannerHero
        art={ART}
        titleId="kid-week-title"
        title="My week"
        textAt="top"
        subtitle={user?.firstName ? `Here is what you are doing this week, ${user.firstName}!` : 'Here is what you are doing this week!'}
      >
        <SunGlow className="left-[65.5%] top-[29.6%] w-[10%]" />
        <Sparkle className="left-[58.5%] top-[10%] w-[1.5%]" />
        <Sparkle className="left-[72.5%] top-[14%] w-[1.1%]" delay={1.2} />
        <Sparkle className="left-[60%] top-[52%] w-[1%]" delay={2.1} />
        <DriftingCloud className="left-[22%] top-[8%] w-[7%]" travel="250%" time="30s" />
        {/* Birds in 3D: two far across the sky, one gliding back, one out from behind the
            hills towards you (the words stay in front of them). */}
        <BirdSky>
          <Bird3D path="cross" size="3.8cqw" time="20s" delay={-6} />
          <Bird3D path="glide" top="4cqh" size="3.4cqw" time="27s" delay={-11} facing="left" flap="0.55s" />
          <Bird3D path="swoop" size="4cqw" time="13s" delay={2.5} facing="toward" flap="0.6s" />
        </BirdSky>
        <FallingLeaf className="left-[77%] top-[20%] w-[1.2%]" delay={0.8} dx="-26px" dy="90px" />
        <FallingLeaf className="left-[94%] top-[28%] w-[1%]" delay={4} dx="-18px" dy="80px" tone="#7cb65f" />
        <Butterfly className="left-[69%] top-[72%] w-[2%]" travel="130%" delay={0.5} />
        {/* The bunny waves: its raised paw, back on its painted place, swings out from the elbow. */}
        <img
          src={weekPaw}
          alt=""
          aria-hidden="true"
          draggable="false"
          decoding="async"
          className="kh-paw kh-paw--week absolute left-[76.163%] top-[60.079%] w-[4.651%] select-none"
        />
        {/* Beside the bunny's raised paw (about 77.5%, 63%), over the little cloud. */}
        <WaveMarks className="left-[74.6%] top-[49%] h-[12%] -rotate-[30deg]" ink="#8a6a52" />
        <RisingHearts className="left-[80.5%] top-[30%] h-[10%] w-[4%]" />
      </KidBannerHero>

      <div className="relative z-[1] mx-auto w-full max-w-[76rem] px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Show my work as"
            className="grid w-full grid-cols-3 rounded-full border border-kid-edge/70 bg-kid-paper-deep/80 p-1 sm:inline-grid sm:w-auto"
          >
            {VIEW_OPTIONS.map((v) => (
              <button
                key={v.key}
                type="button"
                aria-pressed={view === v.key}
                onClick={() => setChosenView(v.key)}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 font-kid-display text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 sm:px-5 sm:text-base',
                  view === v.key ? 'bg-kid-sheet text-kid-ink shadow-paper' : 'text-kid-ink-soft hover:text-kid-ink'
                )}
              >
                {/* The words matter more than the icon on a narrow phone. */}
                <span className="hidden sm:inline-flex" aria-hidden="true">
                  <ViewIcon view={v.key} size={18} />
                </span>
                {KID_LABELS[v.key]}
              </button>
            ))}
          </div>
          <SortMenu variant="kid" value={sort} options={sortOptionsFor(view, { kid: true })} onChange={(key) => setSorts((s) => ({ ...s, [view]: key }))} />
        </div>

        {waitingForSettings ? (
          <KidSkeleton className="mt-5 h-64" />
        ) : schoolwork.error && !schoolwork.loaded ? (
          <div className="mt-5">
            <KidOops onRetry={schoolwork.reload} error={schoolwork.error} />
          </div>
        ) : !schoolwork.loaded ? (
          <KidSkeleton className="mt-5 h-64" />
        ) : view === 'board' ? (
          <div className="mt-6">
            <SchoolworkBoard
              variant="kid"
              work={schoolwork.work}
              priorities={priorities}
              sort={sort}
              today={todayKey}
              colorOf={colorOf}
              preferences={preferences}
              personalEvents={plan.plan?.personalEvents ?? []}
              busyId={schoolwork.busyId}
              showCounts={false}
              columnLabels={KID_COLUMNS}
              renderNote={(w) => <KidPlanNote work={w} today={todayKey} colorOf={colorOf} preferences={preferences} onOpen={setOpenWork} />}
              onOpen={setOpenWork}
              onMove={schoolwork.move}
              onHandIn={openAssignment}
            />
          </div>
        ) : view === 'list' ? (
          <div className="mt-6">
            <KidPlanList work={schoolwork.work} priorities={priorities} sort={sort} preferences={preferences} {...rowHandlers} onGo={go} />
          </div>
        ) : oneDay ? (
          <KidOneDay
            school={school}
            pickedKey={pickedKey}
            onPick={setPickedKey}
            todayKey={todayKey}
            items={byDay.get(pickedKey) ?? []}
            dayBlocks={blocks.get(pickedKey) ?? []}
            dayEvents={events.get(pickedKey) ?? []}
            weekIsEmpty={weekIsEmpty}
            timeZone={plan.plan?.timezone}
            colorOf={colorOf}
            preferences={preferences}
            rowHandlers={rowHandlers}
            onAdd={(dueDate) => setAdding({ dueDate })}
          />
        ) : (
          <div className="mt-6 grid grid-cols-5 gap-3 lg:gap-4">
            {school.map((key, i) => {
              const items = byDay.get(key) ?? [];
              const isToday = key === todayKey;
              const isPast = key < todayKey;
              const dayBlocks = blocks.get(key) ?? [];
              const dayEvents = events.get(key) ?? [];
              const hasAgenda = dayBlocks.length > 0 || dayEvents.length > 0;
              const weekday = formatDateKey(key, { weekday: 'long', month: undefined, day: undefined, year: undefined });
              return (
                <section
                  key={key}
                  aria-label={isToday ? `${weekday}, today` : weekday}
                  className={cn(
                    'kh-pop relative flex min-h-[26rem] flex-col gap-3 rounded-[1.6rem] border p-3 pb-4',
                    isToday
                      ? 'border-kid-teal/25 bg-[color-mix(in_srgb,var(--kid-sky)_70%,var(--kid-sheet))] shadow-[0_10px_24px_-18px_var(--kid-teal)]'
                      : 'border-kid-edge/70 bg-kid-paper-deep/60'
                  )}
                  style={{ '--kh-delay': `${0.08 * i}s` }}
                >
                  <header className="flex flex-col items-center gap-0.5 px-1 pt-1 text-center">
                    <h2 className="font-kid-display text-lg font-semibold text-kid-ink">{weekday}</h2>
                    <p className="font-kid-body text-sm text-kid-ink-soft">{formatDateKey(key, { month: 'short', day: 'numeric', year: undefined })}</p>
                    {isToday && <span className="kh-pulse mt-1.5 rounded-full bg-kid-teal px-3 py-0.5 font-kid-display text-xs font-semibold text-white">Today</span>}
                  </header>

                  {items.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-3">
                      {items.map((w, j) => (
                        <li key={w.id}>
                          <KidCalendarTile work={w} preferences={preferences} delay={0.15 + 0.08 * i + 0.06 * j} onOpen={setOpenWork} />
                        </li>
                      ))}
                    </ul>
                  ) : weekIsEmpty ? (
                    <p className="mt-6 text-center font-kid-body text-sm text-kid-ink-soft">Nothing yet</p>
                  ) : !hasAgenda ? (
                    <DayOffCard />
                  ) : null}

                  {hasAgenda && (
                    // kw-agenda: in narrow columns the kind line ends in "…" rather than splitting a word (kidHome.css).
                    <div className="kw-agenda rounded-[1.1rem] bg-kid-sheet/90 p-2.5 shadow-paper">
                      <DayAgenda blocks={dayBlocks} events={dayEvents} timeZone={plan.plan?.timezone} colorOf={colorOf} showTypeIcons={preferences.showTypeIcons} compact />
                    </div>
                  )}

                  {!isPast && (items.length > 0 || hasAgenda || weekIsEmpty) && items.length < ROOM_FOR_MORE && (
                    <AddWorkButton onClick={() => setAdding({ dueDate: key })} className="mx-auto mt-auto" />
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* The meadow sits at the foot even when there is little on the page, alive (lake, butterflies, 3D birds). */}
      <div className="flex-1" />
      <MeadowFooter />

      <AddWorkDialog
        key={adding ? `add-${adding.dueDate ?? 'any'}` : 'closed'}
        isOpen={Boolean(adding)}
        guided
        defaultDueDate={adding?.dueDate}
        onClose={() => setAdding(null)}
        onAdded={afterAdding}
      />

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
