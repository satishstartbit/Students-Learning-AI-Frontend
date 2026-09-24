import { useMemo, useState } from 'react';
import { LuCheck, LuLifeBuoy } from 'react-icons/lu';
import { Button, Checkbox, ErrorState, Loader, Modal } from '../../../components/common';
import { useDifficultyPicker } from '../hooks/useDifficultyPicker';
import './difficultyPicker.css';

/**
 * "What's making it hard to get started or keep going right now?" for
 * Grade 6+ - the reasons grouped as Super Admin grouped them, more than one
 * allowed, then one or two strategies matched to what was picked.
 *
 * Nothing about the vocabulary lives here: the groups, the reasons, the
 * wording and the strategy each reason points at are all master data
 * (useDifficultyPicker). The K-5 version reads the same lists through the
 * same hook - see kid/KidDifficultyPicker.jsx.
 *
 * @param isOpen
 * @param onClose   dismissed without asking for help ("Not now")
 * @param onHelp    (selection) => void - what they picked and what was
 *                  suggested, for the caller to act on
 */
export function DifficultyPicker({ isOpen, onClose, onHelp }) {
  const { groups, strategiesFor, isLoading, error, reload } = useDifficultyPicker({ immediate: isOpen });

  const [picked, setPicked] = useState([]);
  const [note, setNote] = useState('');
  const [share, setShare] = useState(true);
  const [showing, setShowing] = useState('reasons');

  const toggle = (code) =>
    setPicked((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));

  const strategies = useMemo(() => strategiesFor(picked), [picked, strategiesFor]);

  const countIn = (group) => group.reasons.filter((r) => picked.includes(r.code)).length;

  const handleHelp = () => {
    onHelp?.({ reasons: picked, note: note.trim() || null, share, strategies });
    setShowing('help');
  };

  const reset = () => {
    setPicked([]);
    setNote('');
    setShowing('reasons');
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
            <h2 className="dp-title">Thanks for telling us</h2>
            <p className="dp-empathy">
              That sounds hard, and noticing it is the difficult part - well done. Here{' '}
              {strategies.length === 1 ? 'is something' : 'are a couple of things'} that might help right now.
            </p>
          </div>

          <ul className="dp-strategies">
            {strategies.map((strategy, index) => (
              <li key={strategy.code ?? strategy.id} className="dp-strategy">
                <span className="dp-strategy__num" aria-hidden="true">
                  {index + 1}
                </span>
                <span>
                  <span className="dp-strategy__name">{strategy.name}</span>
                  {strategy.description && <p className="dp-strategy__desc">{strategy.description}</p>}
                </span>
              </li>
            ))}
          </ul>

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

          <div className="dp-groups">
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

          <div>
            <label className="ui-label" htmlFor="dp-note">
              Want to tell us more? (optional)
            </label>
            <textarea
              id="dp-note"
              className="dp-note"
              value={note}
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
              placeholder="A few words is plenty."
            />
          </div>

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
              <Button onClick={handleHelp} disabled={picked.length === 0}>
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
