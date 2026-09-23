import { useEffect, useMemo, useRef, useState } from 'react';
import { LuCheck, LuSmile } from 'react-icons/lu';
import { Alert, Button, Loader, Modal } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import lookupService from '../../../services/lookup.service';
import { ENERGY_LEVELS } from '../moods';
import { useTodayCheckIn } from '../hooks/useTodayCheckIn';
import CheckInFigure from './CheckInFigure';
import MoodGlyph from './MoodGlyph';
import './studentCheckIn.css';

/**
 * The Grade 6+ daily check-in, as a dialog.
 *
 * Everything it asks is master data a Super Admin owns, fetched live rather
 * than listed here: Emotional States (through the shared check-in provider),
 * Body Areas and Available Time (/lookups). Add a mood, reword a time range
 * or deactivate a body area and this dialog follows, with no release - which
 * is why nothing below assumes six moods or four ranges.
 *
 * Mood and energy are required; where they feel it, how much time they have
 * and the note are optional, matching the mockup's own wording.
 */

/** Tints used for moods whose master row sets no background colour. */
const FALLBACK_TINTS = [
  'var(--sticky-blue)',
  'var(--sticky-orange)',
  'var(--sticky-lavender)',
  'var(--sticky-pink)',
  'var(--sticky-green)',
  'var(--sticky-yellow)',
];

function MoodTile({ mood, tint, selected, onSelect }) {
  return (
    <button
      type="button"
      className="ci-mood"
      style={{ '--ci-mood-bg': tint }}
      aria-pressed={selected}
      onClick={() => onSelect(mood.code)}
    >
      <span className="ci-mood__art">
        <MoodGlyph mood={mood} />
      </span>
      {mood.name}
      {selected && (
        <span className="ci-mood__tick" aria-hidden="true">
          <LuCheck size={12} />
        </span>
      )}
    </button>
  );
}

/**
 * The form itself. Its fields start from whatever is already recorded for
 * today, so "change my check-in" is an edit rather than a blank slate - as
 * initial state, with the dialog remounting it per opening (see the `key`
 * below), rather than being pushed in by an effect.
 */
function CheckInForm({ initial, moods, areaItems, timeItems, onSubmit, onClose }) {
  const [mood, setMood] = useState(initial?.mood ?? null);
  const [energy, setEnergy] = useState(initial?.energy ?? null);
  const [areas, setAreas] = useState(initial?.bodyAreas ?? []);
  const [minutes, setMinutes] = useState(initial?.availableMinutes ?? null);
  const [note, setNote] = useState(initial?.note ?? '');
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const tintFor = useMemo(() => {
    const byCode = new Map(
      moods.map((m, index) => [m.code, m.backgroundColor || FALLBACK_TINTS[index % FALLBACK_TINTS.length]])
    );
    return (code) => byCode.get(code);
  }, [moods]);

  const figureParts = areaItems
    .filter((item) => areas.includes(item.code))
    .map((item) => item.extra?.figure_part)
    .filter(Boolean);

  const toggleArea = (code) =>
    setAreas((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));

  const missing = [!mood && 'how you feel', !energy && 'your energy'].filter(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAttempted(true);
    if (missing.length || inFlight.current) return;

    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        mood,
        energy,
        availableMinutes: minutes,
        bodyAreas: areas,
        note: note.trim() || null,
      });
      onClose?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <form className="ci-dialog" onSubmit={handleSubmit} noValidate>
      <div className="ci-head">
        <span className="ci-face" aria-hidden="true">
          <LuSmile size={24} />
        </span>
        <h2 className="ci-title">How are you feeling right now?</h2>
        <p className="ci-lead">It takes less than a minute, and it changes how we plan your day.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <fieldset className="ci-fieldset">
        <legend className="ui-sr-only">How are you feeling right now?</legend>
        <div className="ci-moods">
          {moods.map((m) => (
            <MoodTile
              key={m.code}
              mood={m}
              tint={tintFor(m.code)}
              selected={mood === m.code}
              onSelect={setMood}
            />
          ))}
        </div>
      </fieldset>

      {areaItems.length > 0 && (
        <>
          <div className="ci-rule" />
          <fieldset className="ci-fieldset">
            <legend className="ci-legend">Where do you feel it in your body?</legend>
            <p className="ci-hint">Optional. Noticing it helps you learn what your body is telling you.</p>

            <div className="ci-body">
              <CheckInFigure parts={figureParts} />
              <div className="ci-chips">
                {areaItems.map((item) => (
                  <button
                    key={item.code ?? item.id}
                    type="button"
                    className="ci-chip"
                    aria-pressed={areas.includes(item.code)}
                    onClick={() => toggleArea(item.code)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
        </>
      )}

      <div className="ci-rule" />

      <div className="ci-split">
        <fieldset className="ci-fieldset">
          <legend className="ci-legend">What&rsquo;s your energy like?</legend>
          <p className="ci-hint">Pick the one that matches how you feel.</p>

          <div className="ci-energy-wrap">
            <div className="ci-energy">
              {ENERGY_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  className="ci-energy__step"
                  // The level is all the markup says; the stylesheet turns it
                  // into this step's height and shade (--ci-step).
                  style={{ '--ci-step': level }}
                  data-filled={energy != null && level <= energy ? 'true' : 'false'}
                  aria-label={`Energy ${level} out of ${ENERGY_LEVELS.length}`}
                  aria-pressed={energy === level}
                  onClick={() => setEnergy(level)}
                />
              ))}
            </div>
            <p className="ci-energy__scale">
              <span>Low</span>
              <span>High</span>
            </p>
          </div>
        </fieldset>

        {timeItems.length > 0 && (
          <fieldset className="ci-fieldset">
            <legend className="ci-legend">How much time do you have?</legend>
            <p className="ci-hint">A rough idea is fine. We size the plan to fit.</p>

            <div className="ci-chips ci-chips--grid">
              {timeItems.map((item) => {
                const value = item.extra?.minutes ?? null;
                return (
                  <button
                    key={item.code ?? item.id}
                    type="button"
                    className="ci-chip"
                    aria-pressed={value != null && minutes === value}
                    onClick={() => setMinutes(value)}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </div>

      <div className="ci-rule" />

      <fieldset className="ci-fieldset">
        <legend className="ci-legend">Anything you want to add?</legend>
        <input
          className="ci-note"
          type="text"
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Type here if you feel like it"
        />
        <p className="ci-hint">Optional. A few words is plenty.</p>
      </fieldset>

      <div className="ci-actions">
        {attempted && missing.length > 0 && (
          <p className="ci-error" role="alert">
            Tell us {missing.join(' and ')}.
          </p>
        )}
        <Button type="submit" loading={busy} fullWidth>
          Continue
        </Button>

        {/* A quiet way out: for an older student the check-in is offered, not
            required (RequireCheckIn holds the kid band only), so closing
            without answering has to be an obvious option. */}
        <button type="button" className="ci-later" onClick={onClose} disabled={busy}>
          Not now
        </button>
      </div>
    </form>
  );
}

export function StudentCheckInModal({ isOpen, onClose, onSaved }) {
  const { checkIn, save, moods, moodsLoading } = useTodayCheckIn();

  // The two lists this dialog owns. Fetched when it first opens rather than
  // with the page, since most visits to Home never open it.
  const bodyAreas = useApi(lookupService.listLookup);
  const timeOptions = useApi(lookupService.listLookup);
  const { run: runBodyAreas } = bodyAreas;
  const { run: runTimeOptions } = timeOptions;

  useEffect(() => {
    if (!isOpen) return;
    runBodyAreas('body_areas').catch(() => {});
    runTimeOptions('available_time').catch(() => {});
  }, [isOpen, runBodyAreas, runTimeOptions]);

  const handleSubmit = async (values) => {
    const result = await save(values);

    if (!result.created) toast.success('Check-in updated');
    else if (result.pointsAwarded) toast.success(`Checked in - +${result.pointsAwarded} points`);
    else toast.success('Checked in - thanks!');

    onSaved?.(result);
    return result;
  };

  // The default 520px width, not the 760px "lg": the mockup is a narrow
  // column, and the mood grid and the energy/time pair are sized for it.
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Today's check-in">
      {moodsLoading ? (
        <Loader message="Getting your check-in ready…" />
      ) : (
        <CheckInForm
          // Remounted per opening, and again after today's answers change, so
          // the fields always start from what is actually recorded.
          key={`${isOpen}-${checkIn?.updatedAt ?? 'new'}`}
          initial={checkIn}
          moods={moods}
          areaItems={bodyAreas.data ?? []}
          timeItems={timeOptions.data ?? []}
          onSubmit={handleSubmit}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

export default StudentCheckInModal;
