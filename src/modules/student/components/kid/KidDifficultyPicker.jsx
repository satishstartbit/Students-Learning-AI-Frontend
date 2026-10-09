import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCheck, LuLifeBuoy, LuX } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { useDifficultyPicker } from '../../../checkIn/hooks/useDifficultyPicker';
import { useSupport } from '../../../planner/hooks/useSupport';
import { KidButton } from './KidButton';
import { KidOops, KidSkeleton } from './KidStates';

/**
 * "What's making it tricky?" - the K-4 version of the Grade 6+ difficulty
 * picker, in this band's own paper-and-ink world: bigger targets, fewer
 * words, one group at a time so a long list never lands on a young reader
 * all at once.
 *
 * Same master data as the older students' dialog, through the same hook -
 * Super Admin writes the groups, the reasons and the strategies once and
 * both bands follow. No note field here: typing is the thing a stuck K-4
 * student is least likely to want to do.
 *
 * What they tap is recorded (codes only) so ideas can favour what helped
 * before; an idea with an app action gets a "Try it" button.
 *
 * Fits any screen: a bottom sheet on a phone, a centred card from `sm` up,
 * never taller than the screen. The heading and the buttons stay put and
 * only the list scrolls, so "Next" / "Help me" are always in reach however
 * many reasons a group has. Escape or a tap outside closes it.
 */
export function KidDifficultyPicker({ isOpen, onClose, onHelp, assignmentId, stepId, onChanged }) {
  const { groups, quick, replyFor, strategiesFor, isLoading, error, reload } = useDifficultyPicker({ immediate: isOpen });
  const support = useSupport({ assignmentId, stepId, onChanged });

  const [picked, setPicked] = useState([]);
  const [groupIndex, setGroupIndex] = useState(0);
  const [showing, setShowing] = useState('reasons');
  const [answer, setAnswer] = useState(null);
  // The short list first (client: never all sixty at once); "Something else…" opens the groups.
  const [full, setFull] = useState(false);
  const showFull = full || quick.length === 0;

  const localStrategies = useMemo(() => strategiesFor(picked), [picked, strategiesFor]);
  const strategies = answer?.ideas ?? localStrategies;
  const group = groups[groupIndex] ?? null;
  const isLast = groupIndex >= groups.length - 1;

  const close = () => {
    setPicked([]);
    setGroupIndex(0);
    setAnswer(null);
    setShowing('reasons');
    setFull(false);
    onClose?.();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (!isOpen) return null;

  const toggle = (code) =>
    setPicked((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));

  const finish = async () => {
    const result = await support.ask(picked);
    setAnswer(result);
    onHelp?.({ reasons: picked, strategies: result?.ideas ?? localStrategies });
    setShowing('help');
  };

  const tryIdea = async (idea) => {
    if (await support.run({ strategyCode: idea.code, eventId: answer?.eventId })) close();
  };

  // Portalled into .kid-theme, like the check-in dialog, so it keeps the
  // --kid-* tokens and escapes any transformed ancestor.
  const container = document.querySelector('.kid-theme') ?? document.body;

  const helping = showing === 'help' && !isLoading && !error;
  // The first words back depend on what they picked (admin-edited, e.g. "Let's find the first tiny step.").
  const title = helping ? replyFor(picked) ?? 'Thanks for telling me!' : "What's making it tricky?";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-kid-ink/45 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kid-tricky-title"
        className="relative flex max-h-[calc(100dvh-0.75rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-kid-sheet shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-[2rem]"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-kid-ink/10 text-kid-ink-soft hover:bg-kid-ink/20"
        >
          <LuX className="size-5" aria-hidden="true" />
        </button>

        {/* Stays put at the top. */}
        <header className="shrink-0 px-5 pb-3 pt-6 pr-16 sm:px-7 sm:pt-7">
          {!helping && (
            <span aria-hidden="true" className="mb-3 grid size-11 place-items-center rounded-full bg-kid-yellow">
              <LuLifeBuoy className="size-6 text-[#6b4f05]" strokeWidth={2.2} />
            </span>
          )}
          <h2 id="kid-tricky-title" className="font-kid-hand text-[1.75rem] leading-none text-kid-ink sm:text-[2rem]">
            {title}
          </h2>
          {!isLoading && !error && (
            <p className="mt-2 font-kid-body text-base text-kid-ink-soft sm:text-lg">
              {helping
                ? `${strategies.length === 1 ? "Here's something" : `Here are ${strategies.length === 2 ? 'two' : 'some'} things`} that might help.`
                : 'Tap any that feel true. You can pick more than one.'}
            </p>
          )}
        </header>

        {/* Only this part scrolls; a new group starts at its top (keyed). */}
        <div key={helping ? 'help' : showFull ? groupIndex : 'quick'} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-1 sm:px-7">
          {isLoading ? (
            <KidSkeleton className="h-64" />
          ) : error ? (
            <KidOops onRetry={reload} message="We couldn't load this." />
          ) : helping ? (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {strategies.map((strategy) => (
                <li key={strategy.code ?? strategy.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-kid-paper px-4 py-3">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-kid-green">
                    <LuCheck className="size-5 text-kid-green-deep" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1 break-words font-kid-display text-lg font-semibold text-kid-ink">{strategy.name}</span>
                  {answer && strategy.action && strategy.action !== 'none' && (
                    <KidButton size="md" variant="soft" className="h-11 px-4 text-base" onClick={() => tryIdea(strategy)} disabled={Boolean(support.busy)}>
                      Try it
                    </KidButton>
                  )}
                </li>
              ))}
            </ul>
          ) : !showFull ? (
            <div className="flex flex-col gap-2.5">
              {quick.map((reason) => {
                const selected = picked.includes(reason.code);
                return (
                  <button
                        key={reason.code ?? reason.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggle(reason.code)}
                        className={cn(
                          'flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-kid-body text-base text-kid-ink',
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
                        <span className="min-w-0 break-words">{reason.quickLabel}</span>
                      </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setGroupIndex(0);
                  setFull(true);
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 border-dashed border-[#d9cdb6] px-4 py-3 text-left font-kid-body text-base text-kid-ink-soft"
              >
                Something else…
              </button>
            </div>
          ) : (
            group && (
              // A plain group: no browser fieldset frame around the reasons.
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend className="p-0 font-kid-display text-lg font-semibold text-kid-ink">{group.name}</legend>
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
                          'flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-kid-body text-base text-kid-ink',
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
                        <span className="min-w-0 break-words">{reason.name}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )
          )}
        </div>

        {/* Stays put at the bottom, so the next step is always in reach. */}
        {!isLoading && !error && (
          <footer className="shrink-0 border-t border-kid-edge px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-5">
            {helping ? (
              <KidButton size="md" className="w-full" onClick={close}>
                Let&apos;s try it
              </KidButton>
            ) : (
              // One group at a time, with the count so far - a young reader
              // meeting sixty options at once would just close the dialog.
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <span className="font-kid-body text-base text-kid-ink-soft">
                  {picked.length} picked
                  {showFull && groups.length > 1 ? ` · ${groupIndex + 1} of ${groups.length}` : ''}
                </span>

                <div className="ml-auto flex items-center gap-2">
                  {showFull && (groupIndex > 0 || quick.length > 0) && (
                    <KidButton size="md" variant="soft" onClick={() => (groupIndex > 0 ? setGroupIndex((i) => i - 1) : setFull(false))}>
                      Back
                    </KidButton>
                  )}
                  {!showFull || isLast ? (
                    <KidButton size="md" onClick={finish} disabled={picked.length === 0 || Boolean(support.busy)}>
                      Help me
                    </KidButton>
                  ) : (
                    <KidButton size="md" onClick={() => setGroupIndex((i) => i + 1)}>
                      Next
                    </KidButton>
                  )}
                </div>
              </div>
            )}
          </footer>
        )}
      </div>
    </div>,
    container
  );
}

export default KidDifficultyPicker;
