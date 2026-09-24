import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCheck, LuLifeBuoy, LuX } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { useDifficultyPicker } from '../../../checkIn/hooks/useDifficultyPicker';
import { KidButton } from './KidButton';
import { KidOops, KidSkeleton } from './KidStates';

/**
 * "What's making it tricky?" - the K-5 version of the Grade 6+ difficulty
 * picker, in this band's own paper-and-ink world: bigger targets, fewer
 * words, one group at a time so a long list never lands on a young reader
 * all at once.
 *
 * Same master data as the older students' dialog, through the same hook -
 * Super Admin writes the groups, the reasons and the strategies once and
 * both bands follow. No note field here: typing is the thing a stuck K-5
 * student is least likely to want to do.
 */
export function KidDifficultyPicker({ isOpen, onClose, onHelp }) {
  const { groups, strategiesFor, isLoading, error, reload } = useDifficultyPicker({ immediate: isOpen });

  const [picked, setPicked] = useState([]);
  const [groupIndex, setGroupIndex] = useState(0);
  const [showing, setShowing] = useState('reasons');

  const strategies = useMemo(() => strategiesFor(picked), [picked, strategiesFor]);
  const group = groups[groupIndex] ?? null;
  const isLast = groupIndex >= groups.length - 1;

  if (!isOpen) return null;

  const toggle = (code) =>
    setPicked((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));

  const finish = () => {
    onHelp?.({ reasons: picked, strategies });
    setShowing('help');
  };

  const close = () => {
    setPicked([]);
    setGroupIndex(0);
    setShowing('reasons');
    onClose?.();
  };

  // Portalled into .kid-theme, like the check-in dialog, so it keeps the
  // --kid-* tokens and escapes any transformed ancestor.
  const container = document.querySelector('.kid-theme') ?? document.body;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-kid-ink/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="What's making it tricky?"
        className="relative w-full max-w-lg rounded-[2rem] bg-kid-sheet px-5 py-7 shadow-2xl sm:px-7"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-kid-ink/10 text-kid-ink-soft hover:bg-kid-ink/20"
        >
          <LuX className="size-5" aria-hidden="true" />
        </button>

        {isLoading ? (
          <KidSkeleton className="h-64" />
        ) : error ? (
          <KidOops onRetry={reload} message="We couldn't load this." />
        ) : showing === 'help' ? (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="font-kid-hand text-[2rem] leading-none text-kid-ink">Thanks for telling me!</h2>
              <p className="mt-2 font-kid-body text-lg text-kid-ink-soft">
                {strategies.length === 1 ? "Here's something" : "Here are two things"} that might help.
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {strategies.map((strategy) => (
                <li
                  key={strategy.code ?? strategy.id}
                  className="flex items-center gap-3 rounded-2xl bg-kid-paper px-4 py-3"
                >
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-kid-green">
                    <LuCheck className="size-5 text-kid-green-deep" strokeWidth={3} />
                  </span>
                  <span className="font-kid-display text-lg font-semibold text-kid-ink">{strategy.name}</span>
                </li>
              ))}
            </ul>

            <KidButton size="md" className="w-full" onClick={close}>
              Let&apos;s try it
            </KidButton>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-kid-yellow">
                <LuLifeBuoy className="size-6 text-[#6b4f05]" strokeWidth={2.2} />
              </span>
              <h2 className="mt-3 font-kid-hand text-[2rem] leading-none text-kid-ink">What&apos;s making it tricky?</h2>
              <p className="mt-2 font-kid-body text-lg text-kid-ink-soft">
                Tap any that feel true. You can pick more than one.
              </p>
            </div>

            {group && (
              <fieldset>
                <legend className="font-kid-display text-lg font-semibold text-kid-ink">{group.name}</legend>
                <div className="mt-3 flex flex-col gap-2.5">
                  {group.reasons.map((reason) => {
                    const selected = picked.includes(reason.code);
                    return (
                      <button
                        key={reason.code ?? reason.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggle(reason.code)}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-kid-body text-base text-kid-ink',
                          selected ? 'border-kid-teal bg-kid-sky/40' : 'border-[#ece4d4] bg-kid-paper'
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'grid size-6 shrink-0 place-items-center rounded-full border-2',
                            selected ? 'border-kid-teal bg-kid-teal text-white' : 'border-[#d9cdb6]'
                          )}
                        >
                          {selected && <LuCheck className="size-3.5" strokeWidth={3.5} />}
                        </span>
                        {reason.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* One group at a time, with the count so far - a young reader
                meeting sixty options at once would just close the dialog. */}
            <div className="flex items-center justify-between gap-3">
              <span className="font-kid-body text-base text-kid-ink-soft">
                {picked.length} picked
                {groups.length > 1 ? ` · ${groupIndex + 1} of ${groups.length}` : ''}
              </span>

              <div className="flex items-center gap-2">
                {groupIndex > 0 && (
                  <KidButton size="sm" variant="secondary" onClick={() => setGroupIndex((i) => i - 1)}>
                    Back
                  </KidButton>
                )}
                {isLast ? (
                  <KidButton size="sm" onClick={finish} disabled={picked.length === 0}>
                    Help me
                  </KidButton>
                ) : (
                  <KidButton size="sm" onClick={() => setGroupIndex((i) => i + 1)}>
                    Next
                  </KidButton>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    container
  );
}

export default KidDifficultyPicker;
