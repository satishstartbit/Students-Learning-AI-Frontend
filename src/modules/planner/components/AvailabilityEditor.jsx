import { useMemo, useState } from 'react';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { Alert, Button, ErrorState, IconButton } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { addDaysToKey, formatDateKey } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { windowProblem } from '../planView';
import planService from '../services/plan.service';

// 2026-09-28 is a Monday: its week only supplies weekday names in the active locale.
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7].map((d) => ({
  weekday: d,
  name: formatDateKey(addDaysToKey('2026-09-28', d - 1), { weekday: 'long', year: undefined, month: undefined, day: undefined }),
}));

const byDay = (windows) =>
  Object.fromEntries(WEEKDAYS.map(({ weekday }) => [weekday, windows.filter((w) => w.weekday === weekday).map(({ start, end }) => ({ start, end }))]));

function Editor({ studentId, availability, onSaved }) {
  const [days, setDays] = useState(() => byDay(availability.windows));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const problems = useMemo(() => Object.fromEntries(Object.entries(days).map(([d, list]) => [d, windowProblem(list)])), [days]);
  const invalid = Object.values(problems).some(Boolean);
  const empty = Object.values(days).every((list) => !list.length);

  const update = (weekday, fn) => setDays((prev) => ({ ...prev, [weekday]: fn(prev[weekday]) }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const windows = Object.entries(days).flatMap(([weekday, list]) => list.map((w) => ({ weekday: Number(weekday), ...w })));
      await planService.setWindows(studentId, windows);
      toast.success('Study times saved - the plan will update');
      onSaved?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}
      {empty && availability.usingSuggestedTimes && (
        <div className="pl-notice" style={{ marginBottom: 12 }}>
          <div className="pl-notice__body">
            <span>No study times yet, so the plan uses suggested ones.</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setDays(byDay(availability.suggestedWindows))}>
              Start from the suggested times
            </Button>
          </div>
        </div>
      )}
      <div className="pl-week">
        {WEEKDAYS.map(({ weekday, name }) => (
          <div key={weekday} className="pl-day">
            <span className="pl-day__name">{name}</span>
            <div className="pl-stack" style={{ gap: 8 }}>
              {days[weekday].map((w, i) => (
                // Rows have no identity until saved; position is the identity.
                <div key={i} className="pl-window">
                  <input
                    type="time"
                    aria-label={`${name} study time ${i + 1} starts`}
                    value={w.start}
                    onChange={(e) => update(weekday, (list) => list.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                  />
                  <span aria-hidden="true">–</span>
                  <input
                    type="time"
                    aria-label={`${name} study time ${i + 1} ends`}
                    value={w.end}
                    onChange={(e) => update(weekday, (list) => list.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))}
                  />
                  <IconButton
                    icon={<LuTrash2 aria-hidden="true" />}
                    label={`Remove ${name} study time ${i + 1}`}
                    onClick={() => update(weekday, (list) => list.filter((_, j) => j !== i))}
                  />
                </div>
              ))}
              {problems[weekday] && <p className="pl-error">{problems[weekday]}</p>}
              <div>
                <button
                  type="button"
                  className="pl-link"
                  onClick={() => update(weekday, (list) => [...list, list.length ? { start: list[list.length - 1].end, end: '' } : { start: '16:00', end: '17:00' }])}
                >
                  <LuPlus size={14} aria-hidden="true" /> Add a study time
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pl-actions">
        <Button type="button" onClick={save} loading={saving} disabled={invalid}>
          Save study times
        </Button>
      </div>
    </div>
  );
}

/**
 * Weekly study times (PDF Q5: allocate effort using the student's real
 * availability). Local wall-clock times in the student's own zone - no time
 * zone picker; the planner handles daylight-saving changes.
 */
export function AvailabilityEditor({ studentId = 'me', onSaved }) {
  const availability = useApi(planService.getAvailability, { immediate: true, args: [studentId] });
  if (availability.error && !availability.data) {
    return <ErrorState error={availability.error} onRetry={() => availability.run(studentId).catch(() => {})} />;
  }
  if (!availability.data) return <p className="pl-muted">Loading study times…</p>;
  return (
    <Editor
      key={JSON.stringify(availability.data.windows)}
      studentId={studentId}
      availability={availability.data}
      onSaved={() => {
        availability.run(studentId).catch(() => {});
        onSaved?.();
      }}
    />
  );
}

export default AvailabilityEditor;
