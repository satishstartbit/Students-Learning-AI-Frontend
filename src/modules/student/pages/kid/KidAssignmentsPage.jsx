import { useMemo, useState } from 'react';
import { LuSend } from 'react-icons/lu';
import workFooter from '../../../../assets/kid/work-footer.webp';
import workArt from '../../../../assets/kid/work-hero.webp';
import workArtSmall from '../../../../assets/kid/work-hero-small.webp';
import workTurtle from '../../../../assets/kid/work-turtle.webp';
import { AnimatedCircularProgressBar } from '../../../../components/ui/animated-circular-progress-bar';
import AddWorkDialog from '../../../planner/components/AddWorkDialog';
import { useSchoolwork } from '../../../planner/hooks/useSchoolwork';
import { useMyTasks } from '../../hooks/useMyTasks';
import {
  Bird3D,
  BirdSky,
  DriftingCloud,
  FallingLeaf,
  RisingHearts,
  Sailboat,
  SceneryFooter,
  SeaShimmer,
  Sparkle,
  SunGlow,
} from '../../components/kid/BannerBits';
import { HomeSticker, HomeTape } from '../../components/kid/home/HomeBits';
import { KidBannerHero } from '../../components/kid/KidBannerHero';
import { KidOops, KidSkeleton } from '../../components/kid/KidStates';
import { AddWorkButton } from '../../components/kid/week/WeekParts';
import { WorkCard, WorkEmpty } from '../../components/kid/work/WorkParts';

/**
 * src/assets/kid/work-hero*.webp - the beach under the palm, with the turtle
 * painted out; the turtle itself is src/assets/kid/work-turtle.webp (the
 * picture's pixels 780-986 x 96-249), laid back on exactly that place so it
 * can walk and come out of the picture.
 */
const ART = { src: workArt, srcSmall: workArtSmall, smallWidth: 1000, bigWidth: 1033, width: 1033, height: 250, sky: '#bde7fe' };
/** src/assets/kid/work-footer.webp - the cove with the cliffs (clear sky). */
const FOOTER = { src: workFooter, width: 1039, height: 148 };

/** "2 of 7 handed in" with a small ring - a young student reads the words, the ring shows it at a glance. */
function HandedIn({ finished, total }) {
  if (!total) return null;
  return (
    <div className="ml-auto flex items-center gap-2.5">
      <div aria-hidden="true">
        <AnimatedCircularProgressBar
          value={finished}
          max={total}
          gaugePrimaryColor="var(--kid-green-deep)"
          gaugeSecondaryColor="var(--kid-paper-deep)"
          className="size-11 [&_[data-current-value]]:hidden"
        />
      </div>
      <p className="font-kid-display text-base font-medium leading-tight text-kid-ink">
        {finished} of {total}
        <span className="block font-kid-body text-sm font-normal text-kid-ink-soft">handed in</span>
      </p>
    </div>
  );
}

/**
 * K-4 "My work" (/student/assignments), built to the "My work" mockup: the
 * turtle banner, then every piece of work in three groups - Still going,
 * With my teacher (handed in, waiting), Finished - as picture cards with
 * dots for the steps done, and the cove at the foot. Opening a card goes to
 * the assignment page, as always; the dashed "+" adds work the easy way
 * (the same Add work as Home's "Got new work?").
 *
 * Steps come from the plan's work list (read only, as on My week); without
 * them a card still says where the work is. One column on a phone, two from
 * a tablet (768px), three on a very wide screen.
 */
export default function KidAssignmentsPage() {
  const tasks = useMyTasks();
  const schoolwork = useSchoolwork('me');
  const [adding, setAdding] = useState(false);

  // Steps done per assignment, from the plan's work list.
  const stepsById = useMemo(() => {
    const map = new Map();
    for (const w of schoolwork.work) {
      if (w.kind === 'teacher' && w.stepsTotal > 0) map.set(w.id, { total: w.stepsTotal, done: w.stepsDone ?? 0 });
    }
    return map;
  }, [schoolwork.work]);

  const finished = tasks.sent.length + tasks.done.length;
  const total = finished + tasks.toDo.length;
  const ready = !tasks.isLoading && !tasks.error;
  const stepsFor = (task) => stepsById.get(task.assignment?.id);

  const afterAdding = () => {
    tasks.reload();
    schoolwork.reload?.();
  };

  return (
    <div data-kid-page className="kid-ui relative flex min-h-full flex-col overflow-x-clip">
      <KidBannerHero
        art={ART}
        titleId="kid-work-title"
        title="My work"
        sticker="bookworm"
        textAt="top"
        subtitle="Everything you are working on. Tap one to see the steps inside."
        popOut
      >
        <SunGlow className="left-[48.4%] top-[31%] w-[11%]" />
        <Sparkle className="left-[42.5%] top-[11%] w-[1.5%]" />
        <Sparkle className="left-[54.5%] top-[14%] w-[1.1%]" delay={1.2} />
        <Sparkle className="left-[57%] top-[52%] w-[1%]" delay={2.2} />
        {/* Moving bits stay right of 40%: from a small tablet up the words sit over the left of the picture. */}
        <DriftingCloud className="left-[58%] top-[3%] w-[5.5%]" travel="160%" time="30s" />
        {/* Gulls in 3D, far over the sea (the words stay in front of them). */}
        <BirdSky>
          <Bird3D path="cross" size="3.6cqw" time="20s" delay={-5} />
          <Bird3D path="glide" top="4cqh" size="3.2cqw" time="26s" delay={-12} facing="left" flap="0.55s" />
        </BirdSky>
        {/* The sea along the bottom-left, and a boat sailing the horizon under the sun. */}
        <SeaShimmer className="left-[3%] top-[74%] h-[22%] w-[56%]" waves={4} />
        <Sailboat motion="drift" className="left-[43%] top-[57%] w-[2.4%]" delay={2} />
        <FallingLeaf className="left-[87%] top-[20%] w-[1.2%]" delay={1.5} dx="-30px" dy="90px" tone="#3f8a3c" />
        {/* The turtle, back on its painted place: it walks along the sand, turns round in 3D,
            walks home, and now and then comes out of the picture towards you (kh-turtle).
            Its hearts go where it goes. */}
        <span aria-hidden="true" className="kh-turtle absolute left-[75.508%] top-[38.4%] block w-[20.039%]">
          <span className="kh-turtle-step block">
            <img src={workTurtle} alt="" draggable="false" decoding="async" className="block w-full select-none" />
          </span>
          <RisingHearts className="left-[20%] top-[-22%] h-[38%] w-[18%]" />
        </span>
      </KidBannerHero>

      <div className="relative z-[1] mx-auto w-full max-w-[76rem] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {tasks.isLoading ? (
          <ul className="mt-2 grid gap-4 md:grid-cols-2" aria-label="Loading your work">
            {[0, 1, 2, 3].map((i) => (
              <li key={i}>
                <KidSkeleton className="h-28" />
              </li>
            ))}
          </ul>
        ) : tasks.error ? (
          <KidOops message="We couldn't load your tasks." onRetry={tasks.reload} error={tasks.error} />
        ) : (
          <div className="flex flex-col gap-9">
            <section aria-labelledby="kid-going-title">
              <div className="flex flex-wrap items-center gap-3">
                <HomeTape as="h2" id="kid-going-title" tone="sky" className="kh-tape--inline -rotate-2 px-4 py-1.5 text-lg">
                  Still going
                </HomeTape>
                <AddWorkButton onClick={() => setAdding(true)} className="md:mx-0 md:mt-0" />
                {ready && <HandedIn finished={finished} total={total} />}
              </div>
              {tasks.toDo.length > 0 ? (
                <ul className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {tasks.toDo.map((task, i) => (
                    <li key={task.recipientId}>
                      <WorkCard task={task} steps={stepsFor(task)} delay={Math.min(i, 8) * 0.06} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4">
                  <WorkEmpty title="Nothing to do right now!">When your teacher gives you a task, it will show up here.</WorkEmpty>
                </div>
              )}
            </section>

            {tasks.sent.length > 0 && (
              <section aria-labelledby="kid-sent-title">
                <HomeTape as="h2" id="kid-sent-title" tone="lavender" className="kh-tape--inline -rotate-1 px-4 py-1.5 text-lg">
                  <LuSend className="size-4" aria-hidden="true" />
                  With my teacher
                </HomeTape>
                <ul className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {tasks.sent.map((task, i) => (
                    <li key={task.recipientId}>
                      <WorkCard task={task} steps={stepsFor(task)} delay={0.1 + Math.min(i, 8) * 0.06} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="kid-done-title">
              <div className="flex items-center gap-2">
                <HomeTape as="h2" id="kid-done-title" tone="green" className="kh-tape--inline -rotate-1 px-4 py-1.5 text-lg">
                  Finished
                </HomeTape>
                <HomeSticker slug="trophy" tilt={-8} delay={0.5} className="relative size-10" />
              </div>
              {tasks.done.length > 0 ? (
                <ul className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {tasks.done.map((task, i) => (
                    <li key={task.recipientId}>
                      <WorkCard task={task} steps={stepsFor(task)} delay={0.15 + Math.min(i, 8) * 0.06} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4">
                  <WorkEmpty title="No finished work yet">When your teacher checks your work, it moves here.</WorkEmpty>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* The cove sits at the foot even when there is little on the page. */}
      <div className="flex-1" />
      <SceneryFooter {...FOOTER} overlap={1}>
        <SeaShimmer className="left-[24%] top-[52%] h-[36%] w-[42%]" waves={3} />
        <Sparkle className="left-[36%] top-[66%] w-[1%]" delay={0.6} />
        <Sparkle className="left-[52%] top-[58%] w-[0.8%]" delay={1.9} />
        <Sailboat className="left-[44%] top-[22%] w-[3.2%]" delay={0.8} />
        <BirdSky>
          <Bird3D path="cross" top="-4cqh" size="max(3cqw, 16px)" time="22s" delay={-7} />
        </BirdSky>
      </SceneryFooter>

      <AddWorkDialog key={adding ? 'open' : 'closed'} isOpen={adding} guided onClose={() => setAdding(false)} onAdded={afterAdding} />
    </div>
  );
}
