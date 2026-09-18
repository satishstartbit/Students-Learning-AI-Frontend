/**
 * Built-in drawn avatars for "Make it yours" - the animal buddies from the
 * mockup. An avatar record uses one with image_url "avatar:<slug>" (seeded by
 * backend migration 092; picked from a list on the admin Avatars form), the
 * same convention rewards already use for built-in stickers.
 *
 * Each is one flat vector face on its own tinted disc - no raster assets, no
 * motion, so the admin preview and the student picker render identically.
 * Decorative: the avatar's name is always shown beside it.
 */

const INK = '#3b2a20';

/** Eyes with a shine, cheeks and a smile - the same face on every animal. */
function Face({ y = 34, mouth = 'smile' }) {
  return (
    <g transform={`translate(32 ${y})`}>
      <ellipse cx="-7" cy="-2" rx="2.9" ry="3.5" fill={INK} />
      <ellipse cx="7" cy="-2" rx="2.9" ry="3.5" fill={INK} />
      <circle cx="-6" cy="-3.4" r="1.05" fill="#fff" />
      <circle cx="8" cy="-3.4" r="1.05" fill="#fff" />
      <ellipse cx="-13" cy="4" rx="3.4" ry="2.1" fill="#ff8fa3" opacity="0.5" />
      <ellipse cx="13" cy="4" rx="3.4" ry="2.1" fill="#ff8fa3" opacity="0.5" />
      {mouth === 'beak' ? (
        <path d="M-5 4 L5 4 L0 10 Z" fill="#f0a63c" />
      ) : mouth === 'wide' ? (
        <path d="M-7 3 q7 7 14 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M-4 3.5 q4 4 8 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

function Head({ fill, children }) {
  return (
    <>
      <circle cx="32" cy="34" r="20" fill={fill} />
      <path d="M32 14 a20 20 0 0 1 18 11 a20 20 0 0 0 -36 0 a20 20 0 0 1 18 -11z" fill="#fff" opacity="0.18" />
      {children}
    </>
  );
}

const ART = {
  bear: () => (
    <>
      <circle cx="16" cy="19" r="7.5" fill="#a9703f" />
      <circle cx="48" cy="19" r="7.5" fill="#a9703f" />
      <circle cx="16" cy="19" r="4" fill="#e2b787" />
      <circle cx="48" cy="19" r="4" fill="#e2b787" />
      <Head fill="#c68a58">
        <ellipse cx="32" cy="40" rx="11" ry="8.5" fill="#f0d4ad" />
        <ellipse cx="32" cy="34" rx="3.4" ry="2.6" fill={INK} />
      </Head>
      <Face />
    </>
  ),
  fox: () => (
    <>
      <path d="M12 22 L16 6 L28 15 Z" fill="#e2703a" />
      <path d="M52 22 L48 6 L36 15 Z" fill="#e2703a" />
      <Head fill="#ef8354">
        <path d="M32 54 a20 20 0 0 1 -18 -11 q18 8 36 0 a20 20 0 0 1 -18 11z" fill="#fff" opacity="0.65" />
        <ellipse cx="32" cy="36" rx="3.2" ry="2.4" fill={INK} />
      </Head>
      <Face />
    </>
  ),
  owl: () => (
    <>
      <path d="M14 20 L20 8 L28 16 Z" fill="#8a6a4f" />
      <path d="M50 20 L44 8 L36 16 Z" fill="#8a6a4f" />
      <Head fill="#a1815f">
        <circle cx="24" cy="32" r="9" fill="#f6e7d2" />
        <circle cx="40" cy="32" r="9" fill="#f6e7d2" />
      </Head>
      <g transform="translate(32 32)">
        <circle cx="-8" cy="0" r="4" fill={INK} />
        <circle cx="8" cy="0" r="4" fill={INK} />
        <circle cx="-6.8" cy="-1.4" r="1.3" fill="#fff" />
        <circle cx="9.2" cy="-1.4" r="1.3" fill="#fff" />
        <path d="M-4 6 L4 6 L0 12 Z" fill="#f0a63c" />
      </g>
    </>
  ),
  bunny: () => (
    <>
      <ellipse cx="23" cy="12" rx="5" ry="13" fill="#d9cfe6" />
      <ellipse cx="41" cy="12" rx="5" ry="13" fill="#d9cfe6" />
      <ellipse cx="23" cy="13" rx="2.4" ry="8.5" fill="#f4c6d4" />
      <ellipse cx="41" cy="13" rx="2.4" ry="8.5" fill="#f4c6d4" />
      <Head fill="#efe7f6">
        <ellipse cx="32" cy="36" rx="3" ry="2.2" fill="#e08aa2" />
      </Head>
      <Face />
    </>
  ),
  cat: () => (
    <>
      <path d="M13 24 L15 8 L29 16 Z" fill="#8e8bb5" />
      <path d="M51 24 L49 8 L35 16 Z" fill="#8e8bb5" />
      <Head fill="#a5a2cf">
        <ellipse cx="32" cy="36" rx="3" ry="2.2" fill={INK} />
        <g stroke={INK} strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
          <path d="M14 34 H24" />
          <path d="M14 39 H24" />
          <path d="M50 34 H40" />
          <path d="M50 39 H40" />
        </g>
      </Head>
      <Face mouth="wide" />
    </>
  ),
  frog: () => (
    <>
      <circle cx="19" cy="17" r="8" fill="#8fc76a" />
      <circle cx="45" cy="17" r="8" fill="#8fc76a" />
      <circle cx="19" cy="17" r="4" fill="#fff" />
      <circle cx="45" cy="17" r="4" fill="#fff" />
      <circle cx="19.6" cy="17.6" r="2.2" fill={INK} />
      <circle cx="45.6" cy="17.6" r="2.2" fill={INK} />
      <Head fill="#9ed77a">
        <path d="M18 40 q14 12 28 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <circle cx="24" cy="34" r="1.4" fill={INK} />
        <circle cx="40" cy="34" r="1.4" fill={INK} />
        <ellipse cx="20" cy="44" rx="3.4" ry="2.1" fill="#ff8fa3" opacity="0.5" />
        <ellipse cx="44" cy="44" rx="3.4" ry="2.1" fill="#ff8fa3" opacity="0.5" />
      </Head>
    </>
  ),
  panda: () => (
    <>
      <circle cx="16" cy="19" r="7.5" fill="#33302e" />
      <circle cx="48" cy="19" r="7.5" fill="#33302e" />
      <Head fill="#f6f2ec">
        <ellipse cx="23" cy="32" rx="6.5" ry="7.5" fill="#33302e" transform="rotate(-12 23 32)" />
        <ellipse cx="41" cy="32" rx="6.5" ry="7.5" fill="#33302e" transform="rotate(12 41 32)" />
        <ellipse cx="32" cy="40" rx="3.4" ry="2.5" fill="#33302e" />
      </Head>
      <g transform="translate(32 32)">
        <circle cx="-8.6" cy="0" r="2.6" fill="#fff" />
        <circle cx="8.6" cy="0" r="2.6" fill="#fff" />
        <circle cx="-8.6" cy="0" r="1.3" fill={INK} />
        <circle cx="8.6" cy="0" r="1.3" fill={INK} />
        <path d="M-4 11 q4 3.5 8 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </>
  ),
  penguin: () => (
    <Head fill="#3f4a5a">
      <path d="M32 16 a18 18 0 0 1 13 6 q3 14 -13 20 q-16 -6 -13 -20 a18 18 0 0 1 13 -6z" fill="#f8f4ec" />
      <Face mouth="beak" />
    </Head>
  ),
};

export function AvatarArt({ slug, size = 48, className, style }) {
  const Art = ART[slug];
  if (!Art) return null;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <Art />
    </svg>
  );
}

export default AvatarArt;
