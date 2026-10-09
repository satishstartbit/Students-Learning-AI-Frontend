import { useCallback, useEffect, useState } from 'react';
import { Button, Checkbox } from '../../../../components/common';
import { toast } from '../../../../hooks/useToast';
import { formatDateKey } from '../../../../utils/date';
import { getErrorMessage } from '../../../../utils/errorHandler';
import parentService from '../../services/parent.service';

const HOW = { typed: 'typed it in', voice: 'said it', photo: 'took a photo', document: 'added a file' };

/** { enabled, items } from the API, or null for anything else - this panel must never take the Overview down. */
function toReview(value) {
  if (!value || typeof value.enabled !== 'boolean') return null;
  return { enabled: value.enabled, items: Array.isArray(value.items) ? value.items : [] };
}

/**
 * "New work to check" on the parent Overview (PDF Q14: "Families can have an
 * optional setting requiring parent confirmation"; Q15: "flag new
 * student-created tasks for review without preventing the student from
 * planning or beginning the work"). The switch is per child; while it's on,
 * work the child adds shows here until a parent says it looks good. The
 * child is never waiting on this.
 */
export default function WorkToCheckPanel({ childId, firstName }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    parentService
      .getWorkReview(childId)
      .then((res) => setData(toReview(res?.data)))
      .catch(() => setData(null));
  }, [childId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return null;

  const toggle = async (enabled) => {
    setBusy('switch');
    try {
      const res = await parentService.setWorkReview(childId, enabled);
      setData((prev) => toReview(res?.data) ?? prev);
      toast.success(enabled ? `You'll see new work ${firstName} adds here.` : 'Turned off.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const checked = async (item) => {
    setBusy(item.id);
    try {
      const res = await parentService.markWorkChecked(childId, item.id);
      setData((prev) => toReview(res?.data) ?? prev);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="td-panel pd-tocheck">
      <div className="td-panel__head">
        <h2 className="td-panel__title">New work to check</h2>
      </div>
      <Checkbox
        name="reviewNewWork"
        label={`Let me check new work ${firstName} adds`}
        description={`${firstName} can still plan and start it straight away.`}
        checked={data.enabled}
        disabled={busy === 'switch'}
        onChange={(e) => toggle(e.target.checked)}
      />
      {data.items.length > 0 ? (
        <ul className="td-list">
          {data.items.map((item) => (
            <li key={item.id} className="td-row">
              <div className="td-row__body">
                <div className="td-row__title">{item.title}</div>
                <div className="td-meta">
                  {[item.subject, item.dueDate ? `Due ${formatDateKey(item.dueDate)}` : 'No due date', HOW[item.method] ? `${firstName} ${HOW[item.method]}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <Button type="button" size="sm" variant="secondary" loading={busy === item.id} onClick={() => checked(item)}>
                Looks good
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        data.enabled && <p className="td-empty">Nothing new to check.</p>
      )}
    </section>
  );
}
