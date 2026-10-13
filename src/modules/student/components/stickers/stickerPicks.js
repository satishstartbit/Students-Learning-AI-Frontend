/**
 * Stickers on the student's Home dashboard (Phase 1 "Sticker library"): the
 * ones they collected (Student Rewards) that they chose on "Make it yours".
 * Settings carry `dashboardStickers` ([{ id, name, imageUrl }], or plain ids
 * for a moment while a save is in flight) and `dashboardStickerLimit`
 * (Platform settings "Students' dashboard stickers"; 0 = switched off).
 */

/** The placed sticker ids, whatever shape the settings hold. */
export function placedIds(settings) {
  return (settings?.dashboardStickers ?? []).map((s) => (typeof s === 'string' ? s : s?.id)).filter(Boolean);
}

/**
 * Tapping a sticker: on Home if it wasn't, off if it was. Returns
 * { ids, full } - `full` when it can't go on because the limit is reached.
 */
export function toggleSticker(ids, id, limit) {
  if (ids.includes(id)) return { ids: ids.filter((x) => x !== id), full: false };
  if (ids.length >= limit) return { ids, full: true };
  return { ids: [...ids, id], full: false };
}
