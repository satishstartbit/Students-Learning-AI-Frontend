import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { LuCheck, LuLock, LuSmile, LuStar } from 'react-icons/lu';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { Confetti } from '../../../../components/ui/confetti';
import { cn } from '../../../../lib/utils';
import { useAuth } from '../../../../hooks/useAuth';
import { isTodayInTimezone } from '../../../../utils/date';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { useRewards } from '../../hooks/useRewards';
import { useStudentSettings } from '../../hooks/useStudentSettings';
import RewardArt from '../../components/rewards/RewardArt';
import { Bunny } from '../../components/kid/Bunny';
import { FooterScene, Landscape, Sun } from '../../components/kid/KidScenery';
import { PaperCard } from '../../components/kid/PaperKit';
import { KidOops, KidSkeleton } from '../../components/kid/KidStates';

/**
 * K-5 Rewards - "Collect stickers, earn stars and unlock new rewards!", built
 * to the K-5 rewards mockup. Points are called stars here. Rewards are
 * collectibles, unlocked automatically when a student's stars reach their
 * level (backend services/reward.service.js) - nothing to buy, nothing to
 * lose. Anything collected today gets a "New!" tag and a small confetti
 * burst when the page opens (never in calm mode / reduced motion).
 */

const TABS = [
  { key: 'stickers', label: 'Stickers', icon: LuStar },
  { key: 'emojis', label: 'Emojis', icon: LuSmile },
];

const CONFETTI_COLOURS = ['#f6c445', '#2a9d8f', '#f28482', '#84c5f4', '#9bd08b'];
const RING = 96;
const STROKE = 12;

function StarsRing({ value, stars }) {
  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-24 shrink-0 place-items-center" aria-hidden="true">
      <svg viewBox={`0 0 ${RING} ${RING}`} className="absolute inset-0 size-full -rotate-90">
        <circle cx={RING / 2} cy={RING / 2} r={r} fill="none" stroke="#cfe8ee" strokeWidth={STROKE} />
        <motion.circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          fill="none"
          className="stroke-kid-teal-deep"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <span className="text-center leading-none">
        <span className="block font-kid-display text-2xl font-semibold text-kid-ink">{stars}</span>
        <span className="mt-0.5 block font-kid-body text-xs text-kid-ink-soft">stars</span>
      </span>
    </div>
  );
}

function RewardTile({ reward, index }) {
  const isNew = reward.collected && isTodayInTimezone(reward.collectedAt);

  return (
    <li>
      <motion.div
        role="group"
        aria-label={reward.collected ? `${reward.name}, collected` : `${reward.name}, ${reward.pointsCost} stars to unlock`}
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.04 * index, ease: 'easeOut' }}
        whileHover={reward.collected ? { y: -4 } : undefined}
        className={cn(
          'relative flex h-full flex-col items-center gap-1.5 rounded-[1.25rem] border-2 px-2 pb-3 pt-4 text-center shadow-paper',
          reward.collected ? 'border-[#eadfca] bg-[#fffaf0]' : 'border-[#ece4d4] bg-[#fbf7ee]',
          isNew && 'border-kid-sun'
        )}
      >
        {!reward.collected && (
          <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-[#ece4d4] text-kid-ink-soft">
            <LuLock className="size-3.5" aria-hidden="true" />
          </span>
        )}
        {isNew && (
          <motion.span
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-kid-sun px-2 py-0.5 font-kid-display text-xs font-semibold text-kid-ink"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.25, 1] }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            New!
          </motion.span>
        )}

        <RewardArt imageUrl={reward.imageUrl} size={68} locked={!reward.collected} delay={(index % 6) * 0.3} />

        <span className="mt-1 font-kid-display text-base font-semibold leading-tight text-kid-ink">{reward.name}</span>

        {reward.collected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f3e6] px-2 py-0.5 font-kid-body text-xs font-bold text-[#1f7a3a]">
            <span className="grid size-3.5 place-items-center rounded-full bg-[#2e9a4e] text-white">
              <LuCheck className="size-2.5" strokeWidth={4} aria-hidden="true" />
            </span>
            Collected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-kid-body text-xs font-semibold text-kid-ink-soft">
            {reward.pointsCost}
            <LuStar className="size-3.5 fill-kid-sun text-[#e0a800]" aria-hidden="true" />
            to unlock
          </span>
        )}
      </motion.div>
    </li>
  );
}

export default function KidRewardsPage() {
  const { user } = useAuth();
  const { settings } = useStudentSettings();
  const rewards = useRewards();
  const [tab, setTab] = useState('stickers');
  const motionAllowed = useMotionAllowed();
  const confettiRef = useRef(null);
  const celebrated = useRef(false);

  const newToday = rewards.items.filter((r) => r.collected && isTodayInTimezone(r.collectedAt)).length;

  // Once per visit, only when something was collected today.
  useEffect(() => {
    if (celebrated.current || !newToday || !motionAllowed) return undefined;
    celebrated.current = true;
    const timer = setTimeout(() => {
      confettiRef.current?.fire({
        particleCount: 80,
        spread: 90,
        startVelocity: 28,
        scalar: 0.9,
        origin: { y: 0.3 },
        colors: CONFETTI_COLOURS,
        disableForReducedMotion: true,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [newToday, motionAllowed]);

  const name = settings?.preferredName || user?.firstName;
  const list = tab === 'emojis' ? rewards.emojis : rewards.stickers;
  const next = rewards.next;

  return (
    <div data-kid-page className="kid-ui relative min-h-full">
      <Confetti
        ref={confettiRef}
        manualstart
        globalOptions={{ resize: true, useWorker: false }}
        className="pointer-events-none absolute inset-0 z-30 size-full"
      />

      {/* Hero */}
      <section aria-labelledby="kid-rewards-title" className="relative isolate overflow-hidden">
        <Landscape className="absolute inset-0 -z-10 size-full" />
        <div className="mx-auto flex min-h-[12rem] max-w-6xl items-start justify-between gap-4 px-5 pb-10 pt-10 sm:min-h-[14rem] sm:px-8">
          <div className="max-w-md">
            <h1 id="kid-rewards-title" className="font-kid-display text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-none text-kid-ink">
              Rewards
            </h1>
            <p className="mt-3 font-kid-body text-lg text-kid-ink sm:text-xl">
              Collect stickers, earn stars and unlock new rewards!
            </p>
          </div>
          <div className="pointer-events-none hidden items-start gap-2 sm:flex">
            <Sun className="mt-0 size-20 lg:size-24" />
            <Bunny className="-mb-10 w-36 lg:w-44" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-8">
        {/* Progress */}
        <BlurFade delay={0.05}>
          {rewards.error ? (
            <KidOops message="We couldn't load your rewards right now." onRetry={rewards.reload} />
          ) : rewards.isLoading ? (
            <KidSkeleton className="h-36" />
          ) : (
            <PaperCard
              as="section"
              aria-label="Your stars"
              className="flex flex-col items-center gap-5 border-2 border-[#cfe3ea] bg-[#e4f2f6] px-6 py-6 text-center sm:flex-row sm:text-left"
            >
              <StarsRing value={rewards.progress} stars={rewards.points} />
              <div className="w-full min-w-0 flex-1">
                <h2 className="font-kid-display text-2xl font-semibold text-kid-ink sm:text-3xl">
                  {rewards.points > 0 ? "You're doing amazing" : "Let's get started"}
                  {name ? `, ${name}` : ''}!
                </h2>
                <p className="mt-1 font-kid-body text-base text-kid-ink sm:text-lg">
                  {next
                    ? `Next up: the ${next.name} ${next.rewardType === 'emoji' ? 'emoji' : 'sticker'} at ${next.pointsCost} stars. Only ${rewards.toGo} to go!`
                    : rewards.items.length
                      ? 'You collected every single reward. Wow!'
                      : 'New rewards are coming soon.'}
                </p>
                <div
                  className="mt-3 h-3 w-full max-w-md overflow-hidden rounded-full bg-[#c8e3ea]"
                  role="progressbar"
                  aria-label={next ? `Stars towards ${next.name}` : 'Stars progress'}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(rewards.progress * 100)}
                >
                  <motion.div
                    className="h-full rounded-full bg-kid-teal-deep"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(rewards.progress * 100)}%` }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </PaperCard>
          )}
        </BlurFade>

        {/* Tabs */}
        <div role="tablist" aria-label="Reward type" className="mt-6 inline-flex gap-1 rounded-full bg-[#ece4d4] p-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const selected = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`kid-rw-tab-${key}`}
                aria-controls="kid-rw-panel"
                aria-selected={selected}
                onClick={() => setTab(key)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-kid-display text-base font-semibold text-kid-ink transition-colors',
                  selected ? 'bg-kid-sheet shadow-paper' : 'hover:bg-kid-paper-deep/60'
                )}
              >
                <Icon
                  className={cn('size-5', key === 'stickers' && 'fill-kid-sun text-[#e0a800]')}
                  aria-hidden="true"
                />
                {label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div id="kid-rw-panel" role="tabpanel" aria-labelledby={`kid-rw-tab-${tab}`} className="mt-5">
          {rewards.isLoading ? (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i}>
                  <KidSkeleton className="h-40" />
                </li>
              ))}
            </ul>
          ) : list.length === 0 ? (
            <PaperCard className="px-6 py-10 text-center font-kid-body text-lg text-kid-ink-soft">
              No {tab} yet - they&apos;re on their way!
            </PaperCard>
          ) : (
            <ul key={tab} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {list.map((reward, i) => (
                <RewardTile key={reward.id} reward={reward} index={i} />
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="relative isolate h-40 overflow-hidden sm:h-48" aria-hidden="true">
        <FooterScene className="absolute inset-0 -z-10 size-full" />
      </div>
    </div>
  );
}
