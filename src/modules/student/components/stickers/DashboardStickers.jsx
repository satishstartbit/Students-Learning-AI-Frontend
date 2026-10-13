import { Link } from 'react-router-dom';
import { cn } from '../../../../lib/utils';
import { useStudentSettings } from '../../hooks/useStudentSettings';
import { RewardArt } from '../rewards/RewardArt';
import { HomeCard } from '../kid/home/HomeBits';
import './homeStickers.css';

/**
 * "My stickers" on Home (Phase 1 "Sticker library - fun stickers students can
 * add to their dashboard"): the collected stickers the student chose on Make
 * it yours, a little tilted, as if stuck on. Nothing when none are chosen -
 * Home stays uncluttered (client: "the space should not be crowded").
 * `kid` = the K-4 paper look.
 */
export function DashboardStickers({ kid = false }) {
  const { settings } = useStudentSettings();
  const stickers = (settings?.dashboardStickers ?? []).filter((s) => s && typeof s === 'object');
  if (!stickers.length || !settings?.dashboardStickerLimit) return null;

  const list = (
    <ul className={cn('ds-list', kid && 'ds-list--kid')}>
      {stickers.map((sticker, i) => (
        <li key={sticker.id} className="ds-item" style={{ '--ds-tilt': `${[-6, 4, -3, 7, -5, 3][i % 6]}deg` }} title={sticker.name}>
          <RewardArt imageUrl={sticker.imageUrl} size={kid ? 56 : 44} />
          <span className="ui-sr-only">{sticker.name}</span>
        </li>
      ))}
    </ul>
  );

  if (kid) {
    return (
      <HomeCard aria-labelledby="kid-stickers-title" className="px-5 pb-5 pt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="kid-stickers-title" className="font-kid-hand text-2xl leading-none text-kid-ink">
            My stickers
          </h2>
          <Link to="/student/make-it-yours" className="font-kid-display text-base text-kid-teal underline-offset-2 hover:underline">
            Change
          </Link>
        </div>
        {list}
      </HomeCard>
    );
  }

  return (
    <section className="sh-card ds-card" aria-labelledby="ds-title">
      <div className="ds-head">
        <h2 id="ds-title" className="ds-title">
          My stickers
        </h2>
        <Link to="/student/make-it-yours" className="ds-change">
          Change
        </Link>
      </div>
      {list}
    </section>
  );
}

export default DashboardStickers;
