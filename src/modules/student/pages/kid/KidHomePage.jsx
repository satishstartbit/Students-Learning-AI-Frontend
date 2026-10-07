import { BlurFade } from '../../../../components/ui/blur-fade';
import { useAuth } from '../../../../hooks/useAuth';
import meadow from '../../../../assets/kid/home-meadow.webp';
import { useMyTasks } from '../../hooks/useMyTasks';
import BrainBoostersTeaser from '../../components/brainBoosters/BrainBoostersTeaser';
import { Bird3D, BirdSky, Butterfly, FallingLeaf, SeaShimmer, Sparkle } from '../../components/kid/BannerBits';
import { CheckInCard } from '../../components/kid/CheckInCard';
import { HeroScene } from '../../components/kid/HeroScene';
import { KidPlanCard } from '../../components/kid/KidPlanCard';
import { MyProgressCard } from '../../components/kid/MyProgressCard';
import { NextTaskCard } from '../../components/kid/NextTaskCard';
import { HomeFocusCard } from '../../components/kid/home/HomeFocusCard';
import { HomeRememberCard, HomeWeekCard } from '../../components/kid/home/HomeRailCards';
import { MoreToDoCard, OtherTasks, StillToFinish } from '../../components/kid/home/HomeTaskLists';
import { dueDayKey, todayDayKey } from '../../components/kid/home/homeDates';
import { groupHomeTasks } from '../../components/kid/home/homeTasks';

/**
 * K-5 Home - "My Day", built to the "Good morning, Alex!" mockup.
 *
 *   hero          greeting, bear, sun (HeroScene)
 *   main column   Your next task · Still to finish · Other tasks today ·
 *                 Want to do more? · My next step (plan + "Got new work?")
 *   rail          Check-in · My progress · This week · Remember!
 *   full width    Focus time · Brain Boosters, then the meadow
 *
 * Laptop and up (lg): the main column and the rail side by side. Below
 * that the two columns dissolve (`display: contents`) and every card joins
 * one flow, ordered so the next task comes first and the check-in and
 * progress right after it; from a small tablet the rail cards pair up two
 * to a row. Nothing is fetched here that the page didn't use before - the
 * lists are the same task list, grouped (components/kid/home/homeTasks.js).
 */
export default function KidHomePage() {
  const { user } = useAuth();
  const tasks = useMyTasks();
  const ready = !tasks.isLoading && !tasks.error;

  const groups = groupHomeTasks(ready ? tasks.toDo : [], { todayKey: todayDayKey(), dueKeyOf: dueDayKey });

  // "Done today" - handed in or reviewed - out of everything assigned.
  const doneCount = tasks.sent.length + tasks.done.length;
  const totalCount = tasks.toDo.length + doneCount;

  return (
    // overflow-x-clip: a corner sticker mid-twinkle may poke past the edge on a
    // small phone; it must never make the page scroll sideways.
    <div data-kid-page className="kid-ui relative flex min-h-full flex-col overflow-x-clip">
      <HeroScene firstName={user?.firstName} />

      <div className="relative z-[1] mx-auto w-full max-w-[76rem] px-4 pb-6 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_16.5rem] lg:gap-7 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-8">
          {/* Main column. */}
          <div className="contents lg:col-start-1 lg:flex lg:min-w-0 lg:flex-col lg:gap-7">
            <BlurFade delay={0.1} className="order-1 min-w-0 sm:col-span-2">
              <NextTaskCard task={groups.next} isLoading={tasks.isLoading} error={tasks.error} onRetry={tasks.reload} />
            </BlurFade>

            {groups.still.length > 0 && (
              <BlurFade delay={0.15} className="order-4 min-w-0 sm:col-span-2">
                <StillToFinish items={groups.still} />
              </BlurFade>
            )}

            {(tasks.isLoading || groups.others.length > 0) && (
              <BlurFade delay={0.2} className="order-5 min-w-0 sm:col-span-2">
                <OtherTasks tasks={groups.others} isLoading={tasks.isLoading} allToday={groups.othersAllToday} />
              </BlurFade>
            )}

            {ready && (
              <BlurFade delay={0.25} className="order-6 min-w-0 sm:col-span-2">
                <MoreToDoCard tomorrowTask={groups.tomorrowTask} moreCount={groups.moreCount} />
              </BlurFade>
            )}

            <BlurFade delay={0.3} className="order-7 min-w-0 sm:col-span-2">
              <KidPlanCard />
            </BlurFade>
          </div>

          {/* The rail. */}
          <div className="contents lg:col-start-2 lg:row-start-1 lg:flex lg:min-w-0 lg:flex-col lg:gap-5">
            <BlurFade delay={0.15} className="order-2 min-w-0">
              <CheckInCard variant="modal" />
            </BlurFade>
            <BlurFade delay={0.2} className="order-3 min-w-0">
              <MyProgressCard done={doneCount} total={totalCount} />
            </BlurFade>
            <BlurFade delay={0.25} className="order-8 min-w-0">
              <HomeWeekCard toDo={tasks.toDo} isLoading={tasks.isLoading} />
            </BlurFade>
            <BlurFade delay={0.3} className="order-9 min-w-0">
              <HomeRememberCard finishedCount={doneCount} />
            </BlurFade>
          </div>
        </div>

        <div className="mt-8 grid gap-5">
          <BlurFade delay={0.1} inView>
            <HomeFocusCard assignmentId={groups.next?.assignment?.id} />
          </BlurFade>
          <BlurFade delay={0.15} inView>
            <BrainBoostersTeaser isJunior />
          </BlurFade>
        </div>
      </div>

      {/* The meadow sits at the foot even when there is little on the page; it
          comes alive like the hero: light on the lake, butterflies over the
          flower and the bushes, a bird, a leaf on the wind (placed in % of the
          1800x600 picture; a floor in px so they still show on a phone). */}
      <div className="flex-1" />
      <div aria-hidden="true" className="kh-meadow pointer-events-none relative">
        <div className="kh-rise relative">
          <img src={meadow} alt="" loading="lazy" decoding="async" draggable="false" className="block w-full select-none" />
          <SeaShimmer className="left-[50%] top-[66.5%] h-[9%] w-[22%]" waves={3} />
          <Sparkle className="left-[58%] top-[69%] w-[max(0.7%,6px)]" delay={0.4} />
          <Sparkle className="left-[68%] top-[72%] w-[max(0.6%,5px)]" delay={1.9} />
          <Butterfly className="left-[37.5%] top-[68%] w-[max(2%,12px)]" travel="140%" delay={0.6} />
          <Butterfly className="left-[81%] top-[58%] w-[max(1.8%,11px)]" travel="-150%" delay={2.4} time="11s" wings={['#9fc8f2', '#f6c445']} />
          {/* Birds in 3D over the hills, in the picture's clear sky. */}
          <BirdSky>
            <Bird3D path="cross" top="26cqh" size="max(3.4cqw, 20px)" time="21s" delay={-6} />
            <Bird3D path="glide" top="30cqh" size="max(2.9cqw, 18px)" time="26s" delay={-16} facing="left" flap="0.5s" />
          </BirdSky>
          <FallingLeaf className="left-[9%] top-[62%] w-[max(0.8%,6px)]" delay={1.2} dx="40px" dy="50px" time="8s" tone="#9bc26a" />
        </div>
      </div>
    </div>
  );
}
