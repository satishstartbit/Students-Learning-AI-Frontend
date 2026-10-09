import { useMemo, useState } from 'react';
import { LuCheck, LuLifeBuoy } from 'react-icons/lu';
import { Button, Checkbox, ErrorState, Loader, Modal } from '../../../components/common';
import { useSupport } from '../../planner/hooks/useSupport';
import { useDifficultyPicker } from '../hooks/useDifficultyPicker';
import './difficultyPicker.css';

/**
 * "What's making it hard to get started or keep going right now?" for
 * Grade 6+ - the reasons grouped as Super Admin grouped them, more than one
 * allowed, then one or two strategies matched to what was picked.
 *
 * Nothing about the vocabulary lives here: the groups, the reasons, the
 * wording and the strategy each reason points at are all master data
 * (useDifficultyPicker). The K-4 version reads the same lists through the
 * same hook - see kid/KidDifficultyPicker.jsx.
 *
 * What they pick is recorded (services/support - codes only, no free text)
 * so the ideas can be ranked by what has helped this student before and
 * "Did that help?" can follow up. The ideas come back from the server with
 * the app action each one opens ("Try this"). If the server can't be
 * reached, the same master-data ideas are shown without the button.
 * "Share with a grown-up" decides whether a parent's summary counts it.
 *
 * @param isOpen
 * @param onClose       dismissed ("Not now") or finished
 * @param onHelp        (selection) => void - what they picked and what was suggested
 * @param assignmentId  optional: the work this is about
 * @param stepId        optional: the step this is about
 * @param onChanged     called when an idea changed their plan (smaller steps, replan)
 */
export function DifficultyPicker({ isOpen, onClose, onHelp, assignmentId, stepId, onChanged }) {
  const { groups, quick, replyFor, strategiesFor, isLoading, error, reload } = useDifficultyPicker({ immediate: isOpen });
  const support = useSupport({ assignmentId, stepId, onChanged });

  const [picked, setPicked] = useState([]);
  const [share, setShare] = useState(true);
  const [showing, setShowing] = useState('reasons');
  const [asking, setAsking] = useState(false);
  // The server's answer: { eventId, ideas, disclaimer } - or null when it couldn't be reached.
  const [answer, setAnswer] = useState(null);
  // The short list first (client: "never display all of these at the same time"); "Something else…" opens the rest.
  const [full, setFull] = useState(false);
  const showFull = full || quick.length === 0;

  const toggle = (code) =>
    setPicked((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));

  const localStrategies = useMemo(() => strategiesFor(picked), [picked, strategiesFor]);
  const strategies = answer?.ideas ?? localStrategies;

  const countIn = (group) => group.reasons.filter((r) => picked.includes(r.code)).length;

  const handleHelp = async () => {
    setAsking(true);
    const result = await support.ask(picked, { shared: share });
    setAnswer(result);
    setAsking(false);
    onHelp?.({ reasons: picked, share, strategies: result?.ideas ?? localStrategies });
    setShowing('help');
  };

  const reset = () => {
    setPicked([]);
    setAnswer(null);
    setShowing('reasons');
    setFull(false);
  };
  // What they picked first decides the first words back (admin-edited, e.g. "Let's find the first tiny step.").
  const reply = replyFor(picked);

  const tryIdea = async (idea) => {
    const ok = await support.run({ strategyCode: idea.code, eventId: answer?.eventId });
    if (ok) {
      reset();
      onClose?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose?.();
      }}
      size="lg"
      ariaLabel="What's making this hard right now?"
    >
      {isLoading ? (
        <Loader message="Just a moment…" />
      ) : error ? (
        <ErrorState title="We couldn't load this" error={error} onRetry={reload} />
      ) : showing === 'help' ? (
        <div className="dp-answer">
          <div className="dp-head">
            <span className="dp-face" aria-hidden="true">
              <LuLifeBuoy size={18} />
            </span>
            <h2 className="dp-title">{reply ?? 'Thanks for telling us'}</h2>
            <p className="dp-empathy">
              {reply ? 'Thanks for telling us. ' : 'That sounds hard, and noticing it is the difficult part - well done. '}Here{' '}
              {strategies.length === 1 ? 'is something' : strategies.length === 2 ? 'are a couple of things' : 'are a few things'} that might help
              right now.
            </p>
          </div>

          <ul className="dp-strategies">
            {strategies.map((strategy, index) => (
              <li key={strategy.code ?? strategy.id} className="dp-strategy">
                <span className="dp-strategy__num" aria-hidden="true">
                  {index + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="dp-strategy__name">{strategy.name}</span>
                  {strategy.description && <p className="dp-strategy__desc">{strategy.description}</p>}
                </span>
                {answer && strategy.action && strategy.action !== 'none' && (
                  <Button size="sm" variant="secondary" loading={support.busy === strategy.code} onClick={() => tryIdea(strategy)}>
                    Try this
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {answer?.disclaimer && <p className="dp-strategy__desc">{answer.disclaimer}</p>}

          <div className="dp-foot">
            <button type="button" className="dp-reasons-back" onClick={() => setShowing('reasons')}>
              Change what I picked
            </button>
            <div className="dp-foot__actions">
              <Button
                onClick={() => {
                  reset();
                  onClose?.();
                }}
              >
                Okay, let&apos;s try
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="dp-dialog">
          <div className="dp-head">
            <span className="dp-face" aria-hidden="true">
              <LuLifeBuoy size={18} />
            </span>
            <h2 className="dp-title">What&apos;s making it hard to get started or keep going right now?</h2>
            <p className="dp-lead">Pick as many as you like. There are no wrong answers.</p>
          </div>

          {!showFull ? (
            <div className="dp-chips dp-quick">
              {quick.map((reason) => {
                const selected = picked.includes(reason.code);
                return (
                  <button key={reason.code} type="button" className="dp-chip" aria-pressed={selected} onClick={() => toggle(reason.code)}>
                    {selected && (
                      <span className="dp-chip__tick" aria-hidden="true">
                        <LuCheck size={9} strokeWidth={3.5} />
                      </span>
                    )}
                    {reason.quickLabel}
                  </button>
                );
              })}
              <button type="button" className="dp-chip dp-chip--more" onClick={() => setFull(true)}>
                Something else…
              </button>
            </div>
          ) : (
          <div className="dp-groups">
            {quick.length > 0 && (
              <button type="button" className="dp-reasons-back" onClick={() => setFull(false)}>
                Back to the short list
              </button>
            )}
            {groups.map((group) => {
              const count = countIn(group);
              return (
                <section key={group.code ?? group.id} className="dp-group">
                  <div className="dp-group__head">
                    <h3 className="dp-group__title">{group.name}</h3>
                    {count > 0 && <span className="dp-group__count">{count} picked</span>}
                  </div>

                  <div className="dp-chips">
                    {group.reasons.map((reason) => {
                      const selected = picked.includes(reason.code);
                      return (
                        <button
                          key={reason.code ?? reason.id}
                          type="button"
                          className="dp-chip"
                          aria-pressed={selected}
                          onClick={() => toggle(reason.code)}
                        >
                          {selected && (
                            <span className="dp-chip__tick" aria-hidden="true">
                              <LuCheck size={9} strokeWidth={3.5} />
                            </span>
                          )}
                          {reason.name}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          )}

          <Checkbox
            className="dp-consent"
            checked={share}
            onChange={(event) => setShare(event.target.checked)}
            label="Share what I picked with a grown-up who helps me, so they know how today is going."
          />

          <div className="dp-foot">
            <span className="dp-picked">
              {picked.length} picked
            </span>
            <div className="dp-foot__actions">
              <Button
                variant="ghost"
                onClick={() => {
                  reset();
                  onClose?.();
                }}
              >
                Not now
              </Button>
              <Button onClick={handleHelp} disabled={picked.length === 0} loading={asking}>
                Show me what might help
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default DifficultyPicker;
