import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import weekArt from '../../../../assets/kid/week-hero.webp';
import weekArtSmall from '../../../../assets/kid/week-hero-small.webp';
import weekPaw from '../../../../assets/kid/week-paw.webp';
import { useAuth } from '../../../../hooks/useAuth';
import { cn } from '../../../../lib/utils';
import { addDaysToKey, formatDateKey, getDateKey } from '../../../../utils/date';
import AddWorkDialog from '../../../planner/components/AddWorkDialog';
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
import { Bird3D, BirdSky, Butterfly, DriftingCloud, FallingLeaf, RisingHearts, Sparkle, SunGlow, WaveMarks } from '../../components/kid/BannerBits';
import { KidBannerHero } from '../../components/kid/KidBannerHero';
import { MeadowFooter } from '../../components/kid/MeadowFooter';
import { KidSkeleton, KidOops } from '../../components/kid/KidStates';
import { AddWorkButton, DayOffCard, WeekTaskTile } from '../../components/kid/week/WeekParts';

/** Mon-Fri only - school days, matching "one thing at a time" rather than a full 7-day grid. */
const WEEKDAY_COUNT = 5;
/** A day shows the dashed "+" while it has room (and isn't over). */
const ROOM_FOR_MORE = 3;

/** What K-5 calls the three views. */
const KID_LABELS = { board: 'Sticky notes', list: 'My list', calendar: 'My week' };

/**
 * src/assets/kid/week-hero*.webp - the bunny under the tree, with its raised
 * paw painted out; the paw (forearm) is src/assets/kid/week-paw.webp (the
 * picture's pixels 786-833 x 152-215), laid back on its place so it waves.
 */
const ART = { src: weekArt, srcSmall: weekArtSmall, smallWidth: 1000, bigWidth: 1032, width: 1032, height: 253, sky: '#bee7fd' };

/**
 * K-5 "My week", built to the "My week" mockup - the same schoolwork three
 * ways, chosen in Settings and switchable here any time:
 *
 *   Sticky notes  work as notes in their subject colours: To Do, Doing, Done
 *   My list       one thing after another, most important first
 *   My week       Monday to Friday: what is due each day as picture tiles,
 *                 study times and their own plans (practice, family time),
 *                 "A day off!" when there is nothing, a dashed "+" to add work
 *
 * Every view reads the same plan as the Grade 6+ page; this is its kid look.
 * Laptop and tablet: five columns. Phone: one day under another.
 */
export default function KidMyWeekPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useSchoolworkSettings('me');
  const { preferences, colorOf } = settings;
  const [chosenView, setChosenView] = useState(null);
  const view = chosenView ?? preferences.defaultView;
  const [openWork, setOpenWork] = useState(null);
  const [adding, setAdding] = useState(false);

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
  const afterAdding = () => {
    plan.reload();
    reload();
    schoolwork.reload?.();
  };

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
        <div className="flex justify-end">
          <div role="group" aria-label="Show my work as" className="grid w-full grid-cols-3 rounded-full border border-kid-edge/70 bg-kid-paper-deep/80 p-1 sm:inline-grid sm:w-auto">
            {VIEW_OPTIONS.map((v) => (
              <button
                key={v.key}
                type="button"
                aria-pressed={view === v.key}
                onClick={() => setChosenView(v.key)}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 font-kid-display text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 sm:px-4 sm:text-base',
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
        </div>

        {waitingForSettings ? (
          <KidSkeleton className="mt-5 h-64" />
        ) : view === 'board' || view === 'list' ? (
          <div className="mt-5">
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
          <div className="mt-5">
            <KidOops onRetry={reload} error={error} />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-5 md:gap-3 lg:gap-4">
            {isLoading
              ? Array.from({ length: WEEKDAY_COUNT }, (_, i) => <KidSkeleton key={i} className="h-40 md:h-[26rem]" />)
              : school.map((day, i) => {
                  const isToday = day.key === todayKey;
                  const isPast = day.key < todayKey;
                  const dayBlocks = blocks.get(day.key) ?? [];
                  const dayEvents = events.get(day.key) ?? [];
                  const hasAgenda = dayBlocks.length > 0 || dayEvents.length > 0;
                  const weekday = formatDateKey(day.key, { weekday: 'long', month: undefined, day: undefined, year: undefined });
                  return (
                    <section
                      key={day.key}
                      aria-label={isToday ? `${weekday}, today` : weekday}
                      className={cn(
                        'kh-pop relative flex flex-col gap-3 rounded-[1.6rem] border p-3 pb-4 md:min-h-[26rem]',
                        isToday
                          ? 'border-kid-teal/25 bg-[color-mix(in_srgb,var(--kid-sky)_70%,var(--kid-sheet))] shadow-[0_10px_24px_-18px_var(--kid-teal)]'
                          : 'border-kid-edge/70 bg-kid-paper-deep/60'
                      )}
                      style={{ '--kh-delay': `${0.08 * i}s` }}
                    >
                      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-1 md:flex-col md:items-center md:gap-0.5 md:pt-1 md:text-center">
                        <h2 className="font-kid-display text-lg font-semibold text-kid-ink">{weekday}</h2>
                        <p className="font-kid-body text-sm text-kid-ink-soft">{formatDateKey(day.key, { month: 'short', day: 'numeric', year: undefined })}</p>
                        {isToday && (
                          <span className="kh-pulse rounded-full bg-kid-teal px-3 py-0.5 font-kid-display text-xs font-semibold text-white md:mt-1.5">Today</span>
                        )}
                      </header>

                      {hasAgenda && (
                        // kw-agenda: in narrow columns the kind line ends in "…" rather than splitting a word (kidHome.css).
                        <div className="kw-agenda rounded-[1.1rem] bg-kid-sheet/90 p-2.5 shadow-paper">
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
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-1">
                          {day.items.map((task, j) => (
                            <li key={task.recipientId ?? task.id}>
                              <WeekTaskTile task={task} showStars={preferences.showEstimatedTime} delay={0.15 + 0.08 * i + 0.06 * j} />
                            </li>
                          ))}
                        </ul>
                      ) : !hasAgenda ? (
                        <DayOffCard />
                      ) : null}

                      {!isPast && (day.items.length > 0 || hasAgenda) && day.items.length < ROOM_FOR_MORE && (
                        <AddWorkButton onClick={() => setAdding(true)} />
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

      <AddWorkDialog key={adding ? 'open' : 'closed'} isOpen={adding} guided onClose={() => setAdding(false)} onAdded={afterAdding} />

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
