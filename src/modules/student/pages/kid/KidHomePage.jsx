import { Link } from 'react-router-dom';
import { LuArrowRight } from 'react-icons/lu';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { useAuth } from '../../../../hooks/useAuth';
import { useMyTasks } from '../../hooks/useMyTasks';
import BrainBoostersTeaser from '../../components/brainBoosters/BrainBoostersTeaser';
import { CheckInCard } from '../../components/kid/CheckInCard';
import { FocusTeaserCard } from '../../components/kid/FocusTeaserCard';
import { HeroScene } from '../../components/kid/HeroScene';
import { MyProgressCard } from '../../components/kid/MyProgressCard';
import { FooterScene, WoodenSign, Heart } from '../../components/kid/KidScenery';
import { KidSkeleton } from '../../components/kid/KidStates';
import { KidPlanCard } from '../../components/kid/KidPlanCard';
import { NextTaskCard } from '../../components/kid/NextTaskCard';
import { TaskCard } from '../../components/kid/TaskCard';

/** How many "other tasks" the home page shows - enough to plan, not enough to overwhelm. */
const OTHER_TASKS_SHOWN = 4;

/**
 * K-5 Home - "My Day", from the mockup.
 *
 * One next task in the spotlight, a short list of what comes after it, a
 * feelings check-in and a note of encouragement. Everything else is one tap
 * away in the navigation, so the page never asks a young student to choose
 * between more than a handful of things.
 */
export default function KidHomePage() {
  const { user } = useAuth();
  const tasks = useMyTasks();

  const [nextTask, ...laterTasks] = tasks.toDo;
  const otherTasks = laterTasks.slice(0, OTHER_TASKS_SHOWN);
  const moreCount = laterTasks.length - otherTasks.length;

  // "Done today" - handed in or reviewed - out of everything assigned.
  const doneCount = tasks.sent.length + tasks.done.length;
  const totalCount = tasks.toDo.length + doneCount;

  return (
    <div data-kid-page className="kid-ui min-h-full">
      <HeroScene firstName={user?.firstName} />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-6 pt-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-9">
          <BlurFade delay={0.1}>
            <NextTaskCard
              task={nextTask}
              isLoading={tasks.isLoading}
              error={tasks.error}
              onRetry={tasks.reload}
            />
          </BlurFade>

          <BlurFade delay={0.15}>
            <KidPlanCard />
          </BlurFade>

          {(tasks.isLoading || otherTasks.length > 0) && (
            <section aria-labelledby="kid-other-tasks">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="kid-other-tasks" className="font-kid-hand text-[1.75rem] text-kid-ink">
                  Other tasks
                </h2>
                {moreCount > 0 && (
                  <Link
                    to="/student/assignments"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-kid-display text-lg text-kid-teal no-underline hover:bg-kid-paper-deep/70"
                  >
                    See all my tasks
                    <LuArrowRight className="size-5" aria-hidden="true" />
                  </Link>
                )}
              </div>

              <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                {tasks.isLoading
                  ? [0, 1].map((i) => (
                      <li key={i}>
                        <KidSkeleton className="h-24" />
                      </li>
                    ))
                  : otherTasks.map((task, i) => (
                      <li key={task.recipientId}>
                        <BlurFade delay={0.2 + i * 0.06}>
                          <TaskCard task={task} />
                        </BlurFade>
                      </li>
                    ))}
              </ul>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-8 sm:flex-row lg:flex-col">
          <BlurFade delay={0.2} className="sm:flex-1 lg:flex-none">
            <CheckInCard variant="modal" />
          </BlurFade>
          <BlurFade delay={0.3} className="sm:flex-1 lg:flex-none">
            <MyProgressCard done={doneCount} total={totalCount} />
          </BlurFade>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-8">
        <BlurFade delay={0.35}>
          <FocusTeaserCard />
        </BlurFade>
        <BrainBoostersTeaser isJunior />
      </div>

      <div className="relative isolate mx-4 mb-4 mt-2 h-40 overflow-hidden rounded-[2rem] shadow-paper sm:mx-8 sm:h-48">
        <FooterScene className="absolute inset-0 -z-10 size-full" />
        <WoodenSign
          className="absolute bottom-0 right-6 hidden sm:flex lg:right-16"
          boardClassName="w-44 text-lg uppercase tracking-wide"
        >
          A brighter you, a brighter tomorrow <Heart className="inline size-4 align-[-2px]" />
        </WoodenSign>
      </div>
    </div>
  );
}
