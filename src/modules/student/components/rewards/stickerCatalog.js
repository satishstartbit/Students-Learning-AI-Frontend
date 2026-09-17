/**
 * The built-in drawn stickers (StickerArt.jsx), as `sticker:<slug>` values a
 * reward's image can use - the admin Student Rewards form lists these.
 * Kept apart from StickerArt.jsx because a component file may only export
 * components (react-refresh).
 */
export const STICKER_OPTIONS = [
  { slug: 'star', label: 'Star' },
  { slug: 'trophy', label: 'Trophy' },
  { slug: 'heart', label: 'Heart' },
  { slug: 'flame', label: 'Flame' },
  { slug: 'bookworm', label: 'Bookworm' },
  { slug: 'sparkle', label: 'Sparkle' },
  { slug: 'comet', label: 'Comet' },
  { slug: 'night-owl', label: 'Night owl' },
  { slug: 'music-note', label: 'Music note' },
  { slug: 'sunrise', label: 'Sunrise' },
  { slug: 'explorer', label: 'Explorer' },
  { slug: 'champion', label: 'Champion' },
];

export const STICKER_PREFIX = 'sticker:';

/** How a reward's `imageUrl` should be drawn: built-in sticker, an image, or a short emoji/icon. */
export function resolveRewardImage(imageUrl) {
  const value = String(imageUrl ?? '').trim();
  if (!value) return { kind: 'none' };
  if (value.startsWith(STICKER_PREFIX)) return { kind: 'sticker', slug: value.slice(STICKER_PREFIX.length) };
  // Links, uploaded-file signed URLs, and local previews (blob:/data:) while an admin picks a file.
  if (/^(https?:\/\/|\/|blob:|data:image\/)/i.test(value)) return { kind: 'image', src: value };
  return { kind: 'emoji', text: value };
}
