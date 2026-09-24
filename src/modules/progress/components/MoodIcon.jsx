/**
 * A mood's own icon, for the read-only views (Parent and Teacher Progress).
 *
 * Whatever Master Management gave the mood is what shows: an uploaded icon
 * image, else the icon an admin typed, else the built-in emoji the lookup
 * falls back to. The tinted circle behind it is the mood's own background
 * colour when it has one.
 *
 * `mood` comes from useMoodLookup().moodFor(code) - never from a static map,
 * which is what made a parent see a different face from their child.
 */
export function MoodIcon({ mood, size = 30, className = '' }) {
  if (!mood) return null;

  const background = mood.backgroundColor || 'var(--color-bg-surface-sunken)';

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
        width: size,
        height: size,
        borderRadius: '9999px',
        background,
        overflow: 'hidden',
      }}
    >
      {mood.iconUrl ? (
        <img src={mood.iconUrl} alt="" style={{ width: '76%', height: '76%', objectFit: 'contain' }} />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.55), lineHeight: 1 }}>{mood.icon || '🙂'}</span>
      )}
    </span>
  );
}

export default MoodIcon;
