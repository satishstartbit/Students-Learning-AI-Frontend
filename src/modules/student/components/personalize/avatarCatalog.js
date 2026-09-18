/**
 * The built-in drawn avatars (AvatarArt.jsx), as `avatar:<slug>` values an
 * avatar record's picture can use - the admin Avatars form lists these, and
 * backend migration 092 seeds one row per slug.
 *
 * Kept apart from AvatarArt.jsx because a component file may only export
 * components (react-refresh) - same split as stickerCatalog.js.
 */
export const AVATAR_OPTIONS = [
  { slug: 'bear', label: 'Bear' },
  { slug: 'fox', label: 'Fox' },
  { slug: 'owl', label: 'Owl' },
  { slug: 'bunny', label: 'Bunny' },
  { slug: 'cat', label: 'Cat' },
  { slug: 'frog', label: 'Frog' },
  { slug: 'panda', label: 'Panda' },
  { slug: 'penguin', label: 'Penguin' },
];

export const AVATAR_PREFIX = 'avatar:';

/** How an avatar's `imageUrl` should be drawn: built-in art, or an image to load. */
export function resolveAvatarImage(imageUrl) {
  const value = String(imageUrl ?? '').trim();
  if (!value) return { kind: 'none' };
  if (value.startsWith(AVATAR_PREFIX)) return { kind: 'art', slug: value.slice(AVATAR_PREFIX.length) };
  // Links, uploaded-file signed URLs, and local previews (blob:/data:) while an admin picks a file.
  if (/^(https?:\/\/|\/|blob:|data:image\/)/i.test(value)) return { kind: 'image', src: value };
  return { kind: 'none' };
}
