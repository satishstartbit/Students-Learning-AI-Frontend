import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { LuCheck, LuLock, LuSmile, LuStar } from 'react-icons/lu';
import rewardsBunny from '../../../../assets/kid/rewards-bunny.webp';
import rewardsFooter from '../../../../assets/kid/rewards-footer.webp';
import rewardsArt from '../../../../assets/kid/rewards-hero.webp';
import { Confetti } from '../../../../components/ui/confetti';
import { cn } from '../../../../lib/utils';
import { useAuth } from '../../../../hooks/useAuth';
import { isTodayInTimezone } from '../../../../utils/date';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { useRewards } from '../../hooks/useRewards';
import { useStudentSettings } from '../../hooks/useStudentSettings';
import RewardArt from '../../components/rewards/RewardArt';
import {
  Bird3D,
  BirdSky,
  Butterfly,
  DriftingCloud,
  FallingLeaf,
  RisingHearts,
  SceneryFooter,
  SeaShimmer,
  Sparkle,
  SunGlow,
} from '../../components/kid/BannerBits';
import { HomeSticker } from '../../components/kid/home/HomeBits';
import { KidBannerHero } from '../../components/kid/KidBannerHero';
import { KidOops, KidSkeleton } from '../../components/kid/KidStates';
import { PaperCard } from '../../components/kid/PaperKit';

/**
 * K-4 Rewards - "Collect stickers, earn stars and unlock new rewards!", built
 * to the K-4 Rewards mockup: the bunny banner, the stars card (ring, "Next
 * up", a bar), Stickers / Emojis, a grid of reward tiles, the forest and
 * river at the foot. Points are called stars here. Rewards are collectibles,
 * unlocked automatically when a student's stars reach their level (backend
 * services/reward.service.js) - nothing to buy, nothing to lose. Anything
 * collected today gets a "New!" tag and a small confetti burst when the page
 * opens (never in calm mode / reduced motion).
 *
 * Tiles: two to a row on a phone, three on a small tablet, four from a
 * laptop with the sidebar, six from 1280px.
 */

/**
 * src/assets/kid/rewards-hero.webp - the meadow, cut from the mockup (words
 * painted out) with the bunny painted out too; the bunny itself is
 * src/assets/kid/rewards-bunny.webp (the picture's pixels 901-1062 x 76-331),
 * laid back on its stone so it can jump.
 */
const ART = { src: rewardsArt, width: 1078, height: 344, sky: '#c6eafd' };

/**
 * The bunny on its stone: it hops while a mouse is over it, and a couple of
 * times when it's tapped. A hop crouches, springs up with a little 3D twist,
 * lands with a squash; its shadow on the stone shrinks while it's in the air.
 * When the pointer leaves it finishes the hop it is in, then sits. Idle, it
 * breathes. Decorative (aria-hidden); in calm mode it simply sits.
 */
function JumpingBunny() {
  const [jumping, setJumping] = useState(false);
  const wanted = useRef(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    wanted.current = true;
    setJumping(true);
  };
  const stop = () => {
    wanted.current = false;
  };

  return (
    <span
      aria-hidden="true"
      className="kh-bunny absolute left-[83.581%] top-[22.093%] block w-[15.028%] cursor-pointer"
      data-jumping={jumping || undefined}
      onPointerEnter={(e) => e.pointerType === 'mouse' && start()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && stop()}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse') return;
        start();
        clearTimeout(timer.current);
        timer.current = setTimeout(stop, 1500);
      }}
      onAnimationIteration={(e) => {
        if (e.animationName === 'kh-bunny-hop' && !wanted.current) setJumping(false);
      }}
    >
      <span className="kh-bunny__shadow" />
      <span className="kh-bunny__body block">
        <img src={rewardsBunny} alt="" draggable="false" decoding="async" className="block w-full select-none" />
      </span>
      <RisingHearts className="-left-[14%] top-[22%] h-[20%] w-[24%]" />
    </span>
  );
}
/** src/assets/kid/rewards-footer.webp - pines, hills and a river (clear sky). */
const FOOTER = { src: rewardsFooter, width: 1178, height: 169 };

const TABS = [
  { key: 'stickers', label: 'Stickers', icon: LuStar },
  { key: 'emojis', label: 'Emojis', icon: LuSmile },
];

const CONFETTI_COLOURS = ['#f6c445', '#2a9d8f', '#f28482', '#84c5f4', '#9bd08b'];
const RING = 120;
const STROKE = 13;
/* The stars card is the mockup's pale sky-teal: the accent mixed into white (so it follows the accent). */
const TRACK = 'color-mix(in srgb, var(--kid-teal) 20%, white)';

function StarsRing({ value, stars }) {
  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-28 shrink-0 place-items-center sm:size-32" aria-hidden="true">
      <svg viewBox={`0 0 ${RING} ${RING}`} className="absolute inset-0 size-full -rotate-90">
        <circle cx={RING / 2} cy={RING / 2} r={r} fill="none" stroke={TRACK} strokeWidth={STROKE} />
        <motion.circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          fill="none"
          className="stroke-kid-teal"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <span className="text-center leading-none">
        <span className="block font-kid-display text-[2rem] font-semibold text-kid-ink sm:text-[2.3rem]">{stars}</span>
        <span className="mt-1 block font-kid-body text-sm text-kid-ink-soft">stars</span>
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
          'group relative flex h-full flex-col items-center gap-1 rounded-[1.25rem] border px-2 pb-3.5 pt-5 text-center shadow-paper',
          reward.collected ? 'border-kid-edge/70 bg-kid-sheet' : 'border-kid-edge/50 bg-[color-mix(in_srgb,var(--kid-sheet)_60%,var(--kid-paper))]',
          isNew && 'border-2 border-kid-sun'
        )}
      >
        {!reward.collected && (
          <span className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-kid-paper-deep text-kid-ink-soft">
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

        {/* A collected sticker flips round in 3D when you point at its tile. */}
        <span className={cn('inline-block', reward.collected && 'kh-sticker-flip')}>
          <RewardArt imageUrl={reward.imageUrl} size={76} locked={!reward.collected} delay={(index % 6) * 0.3} />
        </span>

        <span className="mt-1.5 font-kid-display text-[1.05rem] font-semibold leading-tight text-kid-ink">{reward.name}</span>

        {reward.collected ? (
          <span className="mt-0.5 inline-flex items-center gap-1.5 font-kid-body text-sm font-bold text-kid-green-deep">
            <span className="grid size-4 place-items-center rounded-full bg-kid-green-deep text-white">
              <LuCheck className="size-2.5" strokeWidth={4} aria-hidden="true" />
            </span>
            Collected
          </span>
        ) : (
          <span className="mt-0.5 inline-flex items-center gap-1 font-kid-body text-sm font-semibold text-kid-ink-soft">
            {reward.pointsCost}
            <LuStar className="size-4 fill-kid-sun text-kid-sun" aria-hidden="true" />
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
    <div data-kid-page className="kid-ui relative flex min-h-full flex-col overflow-x-clip">
      <Confetti
        ref={confettiRef}
        manualstart
        globalOptions={{ resize: true, useWorker: false }}
        className="pointer-events-none absolute inset-0 z-30 size-full"
      />

      <KidBannerHero
        art={ART}
        titleId="kid-rewards-title"
        title="Rewards"
        sticker="trophy"
        subtitle="Collect stickers, earn stars and unlock new rewards!"
      >
        <SunGlow className="left-[75.1%] top-[29%] w-[12%]" />
        <Sparkle className="left-[67.5%] top-[9%] w-[1.3%]" />
        <Sparkle className="left-[71%] top-[50%] w-[0.9%]" delay={1.2} />
        <Sparkle className="left-[62%] top-[76%] w-[1%]" delay={2.1} />
        {/* Moving bits stay right of 50%: from a small tablet the words sit over the left of the picture. */}
        <DriftingCloud className="left-[52%] top-[7%] w-[6%]" travel="140%" time="30s" />
        {/* Birds in 3D: two far across the top of the sky, one gliding back, one out from
            behind the hills towards you (the words stay in front of them). */}
        <BirdSky>
          <Bird3D path="cross" size="3.8cqw" time="20s" delay={-4} />
          <Bird3D path="glide" top="3cqh" size="3.4cqw" time="27s" delay={-13} facing="left" flap="0.55s" />
          <Bird3D path="swoop" size="4cqw" time="13s" delay={3} facing="toward" flap="0.6s" />
        </BirdSky>
        {/* The tree drops a leaf; a butterfly visits the tulip; the bunny hops when you point at it. */}
        <FallingLeaf className="left-[88%] top-[14%] w-[1.3%]" delay={2} dx="-36px" dy="100px" tone="#4f9a45" />
        <Butterfly className="left-[69%] top-[60%] w-[2.2%]" travel="120%" delay={0.6} />
        <JumpingBunny />
      </KidBannerHero>

      <div className="relative z-[1] mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {/* Stars */}
        {rewards.error ? (
          <KidOops message="We couldn't load your rewards right now." onRetry={rewards.reload} error={rewards.error} />
        ) : rewards.isLoading ? (
          <KidSkeleton className="h-40" />
        ) : (
          <section
            aria-label="Your stars"
            className="kh-pop relative flex flex-col items-center gap-5 rounded-[1.6rem] border-2 border-[color-mix(in_srgb,var(--kid-teal)_20%,white)] bg-[color-mix(in_srgb,var(--kid-teal)_10%,white)] px-5 py-6 text-center shadow-paper sm:flex-row sm:gap-7 sm:px-8 sm:text-left"
          >
            <HomeSticker slug="heart" motion="beat" tilt={10} className="right-3 top-3 size-9 sm:right-5 sm:top-4 sm:size-11" />
            <StarsRing value={rewards.progress} stars={rewards.points} />
            <div className="w-full min-w-0 flex-1">
              <h2 className="font-kid-display text-2xl font-semibold leading-tight text-kid-ink sm:pr-12 sm:text-[1.85rem]">
                {rewards.points > 0 ? "You're doing amazing" : "Let's get started"}
                {name ? `, ${name}` : ''}!
              </h2>
              <p className="mt-1.5 font-kid-body text-base text-kid-ink sm:text-lg">
                {next
                  ? `Next up: the ${next.name} ${next.rewardType === 'emoji' ? 'emoji' : 'sticker'} at ${next.pointsCost} stars. Only ${rewards.toGo} to go!`
                  : rewards.items.length
                    ? 'You collected every single reward. Wow!'
                    : 'New rewards are coming soon.'}
              </p>
              <div
                className="mx-auto mt-3.5 h-3 w-full max-w-lg overflow-hidden rounded-full sm:mx-0"
                style={{ background: TRACK }}
                role="progressbar"
                aria-label={next ? `Stars towards ${next.name}` : 'Stars progress'}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(rewards.progress * 100)}
              >
                <motion.div
                  className="h-full rounded-full bg-kid-teal"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(rewards.progress * 100)}%` }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </section>
        )}

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Reward type"
          className="mt-7 inline-flex gap-1 rounded-full border border-kid-edge/60 bg-[color-mix(in_srgb,var(--kid-paper-deep)_70%,var(--kid-sheet))] p-1"
        >
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
                  selected ? 'bg-kid-sheet shadow-paper' : 'hover:bg-kid-sheet/50'
                )}
              >
                <Icon className={cn('size-5', key === 'stickers' && 'fill-kid-sun text-kid-sun')} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div id="kid-rw-panel" role="tabpanel" aria-labelledby={`kid-rw-tab-${tab}`} className="mt-5">
          {rewards.isLoading ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6" aria-label="Loading your rewards">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i}>
                  <KidSkeleton className="h-44" />
                </li>
              ))}
            </ul>
          ) : list.length === 0 ? (
            <PaperCard className="px-6 py-10 text-center font-kid-body text-lg text-kid-ink-soft">
              No {tab} yet - they&apos;re on their way!
            </PaperCard>
          ) : (
            <ul key={tab} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
              {list.map((reward, i) => (
                <RewardTile key={reward.id} reward={reward} index={i} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* The forest and river sit at the foot even when there is little on the page. */}
      <div className="flex-1" />
      <SceneryFooter {...FOOTER} overlap={1}>
        <SeaShimmer className="left-[44%] top-[66%] h-[28%] w-[22%]" waves={3} />
        <Sparkle className="left-[50%] top-[74%] w-[0.9%]" delay={0.5} />
        <Sparkle className="left-[60%] top-[84%] w-[0.7%]" delay={1.8} />
        <Butterfly className="left-[82%] top-[24%] w-[1.8%]" travel="-140%" delay={1.4} wings={['#9fc8f2', '#f6c445']} />
        <BirdSky>
          <Bird3D path="cross" top="-2cqh" size="max(3cqw, 16px)" time="22s" delay={-9} />
        </BirdSky>
      </SceneryFooter>
    </div>
  );
}
