import { useEffect, useRef, useState } from 'react';
import { LuMusic, LuPause, LuPlay, LuVolume2, LuVolumeX } from 'react-icons/lu';
import IconButton from './IconButton';

/**
 * Small looping audio player with its controls always on screen - pause/play,
 * mute and volume. Used for a task's background audio; general enough for
 * Focus sounds too.
 *
 * `autoPlay` tries to start as soon as the player mounts. Browsers may refuse
 * sound before the person has interacted with the page; the player then shows
 * a clear "tap play" prompt instead of failing silently. Sound is never
 * forced: pause and mute are always one tap away, and it stops on unmount.
 */
export function AudioPlayer({ src, title, autoPlay = false, loop = true, defaultVolume = 0.5, className = '' }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(defaultVolume);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return undefined;
    audio.volume = defaultVolume;
    if (autoPlay) {
      audio.play().catch((error) => {
        if (error?.name === 'NotAllowedError') setBlocked(true);
      });
    }
    return () => audio.pause();
  }, [src, autoPlay, defaultVolume]);

  if (!src) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setFailed(false);
      audio.play().catch(() => setFailed(true));
    } else {
      audio.pause();
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const changeVolume = (event) => {
    const next = Number(event.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = next;
      if (next > 0 && audio.muted) {
        audio.muted = false;
        setMuted(false);
      }
    }
    setVolume(next);
  };

  return (
    <div
      className={`ui-audio ${className}`.trim()}
      role="group"
      aria-label={title ? `Background sound: ${title}` : 'Background sound'}
      style={{
        display: 'flex',
        // Explicit: callers often add .ui-field for spacing, which makes flex containers a column.
        flexDirection: 'row',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        flexWrap: 'wrap',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-default)',
        background: 'var(--color-bg-surface)',
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        loop={loop}
        preload="auto"
        onPlay={() => {
          setPlaying(true);
          setBlocked(false);
        }}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />

      <LuMusic aria-hidden="true" style={{ flexShrink: 0, color: 'var(--color-text-secondary)' }} />
      <span style={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1 1 8rem' }}>
        {title || 'Background sound'}
      </span>

      <IconButton
        label={playing ? 'Pause sound' : 'Play sound'}
        onClick={toggle}
        style={blocked ? { outline: '2px solid var(--accent-base)', outlineOffset: 2 } : undefined}
      >
        {playing ? <LuPause aria-hidden="true" /> : <LuPlay aria-hidden="true" />}
      </IconButton>
      <IconButton label={muted ? 'Unmute sound' : 'Mute sound'} onClick={toggleMute} aria-pressed={muted}>
        {muted ? <LuVolumeX aria-hidden="true" /> : <LuVolume2 aria-hidden="true" />}
      </IconButton>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={muted ? 0 : volume}
        onChange={changeVolume}
        aria-label="Sound volume"
        style={{ width: '6rem', accentColor: 'var(--accent-base)' }}
      />

      {(blocked || failed) && (
        <span className="ui-hint" role="status" style={{ flexBasis: '100%', margin: 0 }}>
          {failed ? "This sound couldn't be played." : 'Tap play to hear the background sound.'}
        </span>
      )}
    </div>
  );
}

export default AudioPlayer;
