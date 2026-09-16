/**
 * A mood's icon on its admin-chosen background colour - used whenever a mood
 * carries an uploaded icon image and/or a background colour from Master
 * Management (Emotional States), overriding the built-in illustrated art.
 * Also the fallback tile for any mood an admin has added that isn't one of
 * the 6 built-in ones MoodFace/MOOD_TILE know how to draw.
 */
export function AdminMoodTile({ mood, className = 'size-11' }) {
  const background = mood?.backgroundColor || 'var(--kid-paper-deep, #e7ecf3)';

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full ${className}`}
      style={{ background }}
    >
      {mood?.iconUrl ? (
        <img src={mood.iconUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="text-[1.4em] leading-none">{mood?.icon || '🙂'}</span>
      )}
    </span>
  );
}

export default AdminMoodTile;
