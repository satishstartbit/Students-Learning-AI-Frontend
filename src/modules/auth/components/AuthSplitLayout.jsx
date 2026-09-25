import { Link } from 'react-router-dom';
import { LuChevronLeft, LuClock3, LuSmile, LuStar } from 'react-icons/lu';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import { APP_NAME } from '../../../utils/constants';
import './authSplit.css';

const HERO_IMAGE = '/image/39b1fbfc7256ded7ead9c5750ba6a771ee6efb9d.png';

function Brand() {
  return (
    <div className="lg-brand">
      <span className="lg-brand__mark" aria-hidden="true">
        <LuStar />
      </span>
      {APP_NAME}
    </div>
  );
}

/** "< Back" - a router link (`to`) or a button (`onClick`). */
function Back({ back, className }) {
  if (!back) return null;
  const inner = (
    <>
      <LuChevronLeft aria-hidden="true" /> {back.label ?? 'Back'}
    </>
  );
  return back.to ? (
    <Link to={back.to} className={className}>
      {inner}
    </Link>
  ) : (
    <button type="button" className={className} onClick={back.onClick}>
      {inner}
    </button>
  );
}

/** The left half: photo, promise, and a glimpse of the app (illustration, not live data). */
function Hero() {
  return (
    <aside className="lg-hero" style={{ '--lg-hero-image': `url("${HERO_IMAGE}")` }}>
      <Brand />

      <div className="lg-hero__body">
        <h2 className="lg-hero__title">One calm place to plan, focus and check in.</h2>
        <p className="lg-hero__lead">
          {APP_NAME} helps students break work into steps, stay focused and notice how they feel, with families and
          teachers alongside.
        </p>

        <div className="lg-glass-grid" aria-hidden="true">
          <div className="lg-glass lg-glass--checkin">
            <p className="lg-glass__eyebrow">Today&apos;s check-in</p>
            <p className="lg-glass__row">
              <span className="lg-glass__face">
                <LuSmile />
              </span>
              Calm &amp; ready
            </p>
          </div>
          <div className="lg-glass lg-glass--step">
            <p className="lg-glass__eyebrow">Next step</p>
            <p className="lg-glass__title">Book report: write the opening paragraph</p>
            <span className="lg-glass__bar">
              <span style={{ width: '50%' }} />
            </span>
            <p className="lg-glass__meta">Step 2 of 4</p>
          </div>
          <div className="lg-glass lg-glass--focus">
            <p className="lg-glass__row">
              <LuClock3 className="lg-glass__icon" />
              Focus · 18:42 left
            </p>
          </div>
        </div>
      </div>

      <p className="lg-hero__foot">
        © {new Date().getFullYear()} {APP_NAME} · Privacy · Terms
      </p>
    </aside>
  );
}

/**
 * The frame for the signed-out pages built to the sign-in mockups (/login,
 * /register, /forgot-password, /reset-password): a photo hero on the left
 * and the page on the right; under
 * 900px the photo becomes a banner carrying the title. Forest green on these
 * pages only (`data-accent`), Poppins headings and Nunito text.
 *
 * @param title  the page heading ("Welcome back 👋") - shown on the banner on
 *               phones and above the panel on wider screens
 * @param lead   one line under the title
 * @param back   optional { to } or { onClick }, rendered as "< Back" above the title
 * @param wide   a slightly wider panel (the sign-up form's two-column rows)
 */
export function AuthSplitLayout({ title, lead, back, wide = false, children }) {
  return (
    <div className="lg-page" data-accent="forest">
      <Hero />

      <main className="lg-main">
        <header className="lg-banner" style={{ '--lg-hero-image': `url("${HERO_IMAGE}")` }}>
          <Brand />
          <Back back={back} className="lg-back lg-back--banner" />
          <h1 className="lg-banner__title">{title}</h1>
          {lead && <p className="lg-banner__lead">{lead}</p>}
        </header>

        <div className={wide ? 'lg-panel lg-panel--wide' : 'lg-panel'}>
          <div className="lg-head">
            <Back back={back} className="lg-back" />
            <h1 className="lg-title">{title}</h1>
            {lead && <p className="lg-lead">{lead}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthSplitLayout;
