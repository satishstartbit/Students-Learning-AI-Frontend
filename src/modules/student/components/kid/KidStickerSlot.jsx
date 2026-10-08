import { useEffect, useRef, useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import { useAuth } from '../../../../hooks/useAuth';
import { cn } from '../../../../lib/utils';
import { StickerArt } from '../rewards/StickerArt';

/**
 * The dashed "+" beside "How did you do?" on a K-4 reviewed assignment (the
 * "Busy Bee quiz" mockup): the student sticks a sticker there to say how it
 * went - the drawn stickers from Rewards (StickerArt), picked from a small
 * tray; tap it again to change it or take it off.
 *
 * It's a decoration kept on this device only (localStorage, per student and
 * assignment) - nothing is sent to the server, and a teacher or parent never
 * sees it. Storage can be unavailable (private windows, blocked site data),
 * so every read and write is guarded and the slot simply starts empty.
 */

const CHOICES = [
  { slug: 'star', label: 'Proud' },
  { slug: 'heart', label: 'Loved it' },
  { slug: 'flame', label: 'On fire' },
  { slug: 'sparkle', label: 'Shiny' },
  { slug: 'bookworm', label: 'Still learning' },
  { slug: 'champion', label: 'Champion' },
];

const storageKey = (userId, assignmentId) => `eflp.workSticker.${userId ?? 'me'}.${assignmentId}`;

function readSticker(key) {
  try {
    const slug = window.localStorage.getItem(key);
    return CHOICES.some((c) => c.slug === slug) ? slug : null;
  } catch {
    return null;
  }
}

function writeSticker(key, slug) {
  try {
    if (slug) window.localStorage.setItem(key, slug);
    else window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable: the sticker just won't be remembered next time.
  }
}

export function KidStickerSlot({ assignmentId }) {
  const { user } = useAuth();
  const key = storageKey(user?.id, assignmentId);
  const [slug, setSlug] = useState(() => readSticker(key));
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close the tray on Escape or a tap anywhere else.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const choose = (next) => {
    setSlug(next);
    writeSticker(key, next);
    setOpen(false);
  };

  const current = CHOICES.find((c) => c.slug === slug);

  return (
    <div ref={wrapRef} className="static sm:relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={current ? `Your sticker: ${current.label}. Change it` : 'Add a sticker'}
        title={current ? 'Change your sticker' : 'Add a sticker'}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'grid place-items-center transition-transform hover:scale-105',
          current
            ? 'size-12 -rotate-6'
            : 'size-11 -rotate-6 rounded-xl border-2 border-dashed border-kid-ink-soft/60 bg-kid-sheet text-kid-ink-soft hover:border-kid-teal hover:text-kid-teal'
        )}
      >
        {current ? <StickerArt slug={current.slug} className="size-12" /> : <LuPlus className="size-5" aria-hidden="true" />}
      </button>

      {open && (
        <div
          role="group"
          aria-label="Pick a sticker"
          className="absolute inset-x-0 top-full z-20 mt-2 rounded-2xl border border-kid-edge bg-kid-sheet p-3 shadow-paper sm:inset-x-auto sm:left-0 sm:w-72"
        >
          <p className="font-kid-display text-base font-semibold text-kid-ink">Pick a sticker</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {CHOICES.map((choice) => (
              <button
                key={choice.slug}
                type="button"
                aria-pressed={slug === choice.slug}
                onClick={() => choose(choice.slug)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-1 py-2 font-kid-body text-xs text-kid-ink hover:bg-kid-paper-deep/60',
                  slug === choice.slug && 'bg-kid-sky/60'
                )}
              >
                <StickerArt slug={choice.slug} className="size-10" />
                {choice.label}
              </button>
            ))}
          </div>
          {slug && (
            <button type="button" onClick={() => choose(null)} className="mt-2 w-full rounded-xl py-1.5 font-kid-display text-sm text-kid-ink-soft underline decoration-dotted hover:text-kid-ink">
              Take it off
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default KidStickerSlot;
