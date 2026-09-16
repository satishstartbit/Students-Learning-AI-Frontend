import { useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Loader } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useTodayCheckIn } from '../../checkIn/hooks/useTodayCheckIn';
import { ENERGY_LEVELS, MINUTES_OPTIONS, findMood } from '../../checkIn/moods';

/**
 * Today's check-in for Grade 6+ - how they feel, their energy, and how much
 * time they have. Saved to the real /check-ins API (one per day, changeable
 * later that day) through the shared TodayCheckInProvider, so My Day, the
 * Check In page and the work-screen gate always agree.
 */

const chipStyle = (selected) =>
  selected
    ? { background: 'var(--accent-soft)', color: 'var(--accent-base)', borderColor: 'var(--accent-base)' }
    : { background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' };

const FIELDSET = { border: 0, padding: 0, margin: '0 0 var(--spacing-lg)' };
const LEGEND = { marginBottom: 'var(--spacing-sm)' };
const ROW = { display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' };

function CheckInForm({ moods, initial, submitLabel, onSubmit, onCancel }) {
  const [mood, setMood] = useState(initial?.mood ?? null);
  const [energy, setEnergy] = useState(initial?.energy ?? null);
  const [minutes, setMinutes] = useState(initial?.availableMinutes ?? null);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const missing = [!mood && 'how you feel', !energy && 'your energy', !minutes && 'how much time you have'].filter(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAttempted(true);
    if (missing.length || inFlight.current) return;

    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ mood, energy, availableMinutes: minutes });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}

      <fieldset style={FIELDSET}>
        <legend className="ui-label" style={LEGEND}>
          How are you feeling?
        </legend>
        <div style={ROW}>
          {moods.map((m) => {
            const selected = mood === m.code;
            const style = selected
              ? chipStyle(true)
              : { ...chipStyle(false), ...(m.backgroundColor ? { background: m.backgroundColor } : null) };
            return (
              <button
                key={m.code}
                type="button"
                onClick={() => setMood(m.code)}
                className="ui-btn ui-btn--sm"
                aria-pressed={selected}
                style={style}
              >
                {m.iconUrl ? (
                  <img src={m.iconUrl} alt="" aria-hidden="true" style={{ width: 16, height: 16, borderRadius: '50%', verticalAlign: 'text-bottom' }} />
                ) : (
                  <span aria-hidden="true">{m.icon || '🙂'}</span>
                )}{' '}
                {m.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset style={FIELDSET}>
        <legend className="ui-label" style={LEGEND}>
          Energy
        </legend>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          {ENERGY_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setEnergy(level)}
              aria-label={`Energy ${level} out of ${ENERGY_LEVELS.length}`}
              aria-pressed={energy === level}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid var(--accent-base)',
                background: energy && level <= energy ? 'var(--accent-base)' : 'transparent',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset style={FIELDSET}>
        <legend className="ui-label" style={LEGEND}>
          Time for this session
        </legend>
        <div style={ROW}>
          {MINUTES_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMinutes(m)}
              className="ui-btn ui-btn--sm"
              aria-pressed={minutes === m}
              style={chipStyle(minutes === m)}
            >
              {m} min
            </button>
          ))}
        </div>
      </fieldset>

      {attempted && missing.length > 0 && (
        <p className="ui-field-error" role="alert" style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-danger-fg)' }}>
          Tell us {missing.join(', ')}.
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        <Button type="submit" loading={busy}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function CheckInSummary({ moods, checkIn, onChange }) {
  const mood = findMood(moods, checkIn.mood);
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <Badge variant="primary">
          {mood?.iconUrl ? (
            <img src={mood.iconUrl} alt="" aria-hidden="true" style={{ width: 16, height: 16, borderRadius: '50%', verticalAlign: 'text-bottom' }} />
          ) : (
            <span aria-hidden="true">{mood?.icon || '🙂'}</span>
          )}{' '}
          {mood?.name ?? checkIn.mood}
        </Badge>
        <span className="ui-hint">Energy {checkIn.energy}/{ENERGY_LEVELS.length}</span>
        {checkIn.availableMinutes != null && <span className="ui-hint">· {checkIn.availableMinutes} min</span>}
      </div>
      <Button variant="secondary" size="sm" onClick={onChange} style={{ marginTop: 'var(--spacing-md)' }}>
        Change
      </Button>
    </>
  );
}

export function StudentCheckInCard({ title = "Today's check-in", onSaved }) {
  const { checkIn, isLoading, save, moods, moodsLoading } = useTodayCheckIn();
  const [editing, setEditing] = useState(false);

  if (isLoading || moodsLoading) {
    return (
      <Card title={title}>
        <Loader message="Loading your check-in…" />
      </Card>
    );
  }

  const handleSubmit = async (values) => {
    const result = await save(values);
    setEditing(false);
    if (!result.created) toast.success('Check-in updated');
    else if (result.pointsAwarded) toast.success(`Checked in - +${result.pointsAwarded} points`);
    else toast.success('Checked in - thanks!');
    onSaved?.(result);
  };

  return (
    <Card title={title} subtitle={checkIn ? "You've checked in today." : 'Takes a few seconds, once a day.'}>
      {checkIn && !editing ? (
        <CheckInSummary moods={moods} checkIn={checkIn} onChange={() => setEditing(true)} />
      ) : (
        <CheckInForm
          key={checkIn?.updatedAt ?? 'new'}
          moods={moods}
          initial={checkIn}
          submitLabel={checkIn ? 'Update check-in' : 'Check in'}
          onSubmit={handleSubmit}
          onCancel={checkIn ? () => setEditing(false) : undefined}
        />
      )}
    </Card>
  );
}

export default StudentCheckInCard;
