/**
 * The picture above each status view (StatusView.jsx) - calm line drawings
 * on a soft accent disc, coloured only through status.css classes and theme
 * tokens, so the accent switcher and dark mode apply. Decorative: the view's
 * title says what happened.
 */
const Disc = () => <circle className="st-ill__disc" cx="80" cy="62" r="56" />;

const DRAWINGS = {
  // A Wi-Fi fan with a slash through it.
  offline: (
    <>
      <Disc />
      <path className="st-ill__line st-ill__line--soft" d="M42 56a54 54 0 0 1 76 0" />
      <path className="st-ill__line" d="M53 68a38 38 0 0 1 54 0" />
      <path className="st-ill__line" d="M64 80a22 22 0 0 1 32 0" />
      <circle className="st-ill__dot" cx="80" cy="92" r="5" />
      <path className="st-ill__slash" d="M50 40l60 62" />
    </>
  ),
  // Two server panels, the lower one blinking amber, and an unplugged lead.
  unreachable: (
    <>
      <Disc />
      <rect className="st-ill__panel" x="48" y="30" width="64" height="24" rx="7" />
      <rect className="st-ill__panel" x="48" y="60" width="64" height="24" rx="7" />
      <circle className="st-ill__dot" cx="61" cy="42" r="3.5" />
      <circle className="st-ill__dot st-ill__dot--warn" cx="61" cy="72" r="3.5" />
      <path className="st-ill__line st-ill__line--thin" d="M72 42h28M72 72h28" />
      <path className="st-ill__line st-ill__line--thin" d="M80 84v8" />
      <path className="st-ill__line st-ill__line--thin" d="M80 104v6M72 98h16" />
    </>
  ),
  // A clock face.
  timeout: (
    <>
      <Disc />
      <circle className="st-ill__panel" cx="80" cy="62" r="30" />
      <path className="st-ill__line" d="M80 46v17l11 7" />
      <path className="st-ill__line st-ill__line--thin" d="M80 36v3M80 85v3M54 62h3M103 62h3" />
    </>
  ),
  // A server panel with a wrench over it.
  server: (
    <>
      <Disc />
      <rect className="st-ill__panel" x="44" y="40" width="72" height="44" rx="9" />
      <path className="st-ill__line st-ill__line--thin" d="M44 54h72" />
      <circle className="st-ill__dot st-ill__dot--warn" cx="54" cy="47" r="2.8" />
      <circle className="st-ill__dot" cx="63" cy="47" r="2.8" />
      <path className="st-ill__crack" d="M84 58l-7 9 6 5-5 9" />
    </>
  ),
  // A signpost with a question mark (maintenance uses the same frame).
  maintenance: (
    <>
      <Disc />
      <path className="st-ill__line" d="M80 30v80" />
      <path className="st-ill__panel" d="M52 38h44l10 10-10 10H52z" />
      <path className="st-ill__panel" d="M108 66H64l-10 10 10 10h44z" />
      <path className="st-ill__line st-ill__line--thin" d="M62 48h28M70 76h28" />
    </>
  ),
  // A compass with a lost needle and a question mark.
  notFound: (
    <>
      <Disc />
      <circle className="st-ill__panel" cx="80" cy="62" r="32" />
      <path className="st-ill__line st-ill__line--thin" d="M80 34v6M80 84v6M52 62h6M102 62h6" />
      <path className="st-ill__needle" d="M92 48l-7 18-17 8 7-18z" />
      <circle className="st-ill__dot" cx="80" cy="62" r="3.2" />
      <text className="st-ill__mark" x="118" y="38">?</text>
    </>
  ),
  // A padlock.
  forbidden: (
    <>
      <Disc />
      <path className="st-ill__line" d="M64 58V48a16 16 0 0 1 32 0v10" />
      <rect className="st-ill__panel" x="56" y="58" width="48" height="36" rx="9" />
      <circle className="st-ill__dot" cx="80" cy="74" r="4" />
      <path className="st-ill__line st-ill__line--thin" d="M80 78v6" />
    </>
  ),
  // A page with a crack across it.
  crash: (
    <>
      <Disc />
      <rect className="st-ill__panel" x="50" y="30" width="60" height="68" rx="9" />
      <path className="st-ill__line st-ill__line--thin" d="M60 46h30M60 56h40M60 66h22" />
      <path className="st-ill__crack" d="M92 62l-9 11 8 6-7 12" />
    </>
  ),
  // A soft warning triangle.
  generic: (
    <>
      <Disc />
      <path className="st-ill__panel" d="M80 32l34 58H46z" strokeLinejoin="round" />
      <path className="st-ill__line" d="M80 54v16" />
      <circle className="st-ill__dot" cx="80" cy="80" r="3.5" />
    </>
  ),
};

export function StatusIllustration({ kind = 'generic', className = '' }) {
  return (
    <svg className={`st-ill ${className}`.trim()} viewBox="0 0 160 124" aria-hidden="true" focusable="false">
      {DRAWINGS[kind] ?? DRAWINGS.generic}
    </svg>
  );
}

export default StatusIllustration;
