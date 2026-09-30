import { formatDateKey } from '../../../utils/date';
import { groupWorkByDue, groupWorkBySubject, minutesLabel } from '../planView';
import ProvenanceBadge from './ProvenanceBadge';

const DUE_TITLES = { overdue: 'Past the due date', today: 'Due today', week: 'Due this week', later: 'Due later', none: 'No due date' };

/**
 * All open work, from every source (PDF Q10, Q15), grouped by due date or by
 * subject, with who added it and how far along it is. Future work stays
 * visible and openable (Q8).
 */
export function WorkList({ work = [], today, groupBy = 'due', viewer = 'student', onOpen }) {
  if (!work.length) return <p className="pl-muted">No open work.</p>;
  const groups =
    groupBy === 'subject'
      ? groupWorkBySubject(work).map((g) => ({ key: g.key, title: g.subject ?? 'No subject', items: g.items }))
      : groupWorkByDue(work, today).map((g) => ({ key: g.key, title: DUE_TITLES[g.key], items: g.items }));

  return (
    <div>
      {groups.map((g) => (
        <section key={g.key} className="pl-group" aria-label={g.title}>
          <h3 className="pl-group__title">{g.title}</h3>
          <ul className="pl-list">
            {g.items.map((w) => {
              const pct = w.stepsTotal ? Math.round((w.stepsDone / w.stepsTotal) * 100) : 0;
              const body = (
                <>
                  <div className="pl-item__main">
                    <p className="pl-item__title">{w.title}</p>
                    <p className="pl-item__meta">
                      {[
                        groupBy === 'subject' ? null : w.subject,
                        w.dueDate ? `Due ${formatDateKey(w.dueDate, { weekday: 'short', month: 'short', day: 'numeric', year: undefined })}` : null,
                        w.stepsTotal ? `${w.stepsDone}/${w.stepsTotal} steps` : null,
                        w.remainingMinutes ? `${minutesLabel(w.remainingMinutes)} left` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {w.stepsTotal > 0 && (
                      <div className="pl-progress" aria-hidden="true">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="pl-item__aside">
                    <ProvenanceBadge source={w.source} viewer={viewer} />
                  </div>
                </>
              );
              return (
                <li key={w.id}>
                  {onOpen ? (
                    <button
                      type="button"
                      className="pl-item"
                      style={{ width: '100%', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                      onClick={() => onOpen(w)}
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="pl-item">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default WorkList;
