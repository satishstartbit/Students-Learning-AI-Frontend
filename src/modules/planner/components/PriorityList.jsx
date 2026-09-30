import { formatDateKey } from '../../../utils/date';
import { groupPriorities, minutesLabel } from '../planView';

const GROUPS = [
  { key: 'today', title: 'Today' },
  { key: 'next', title: 'Next' },
  { key: 'later', title: 'Later' },
];

/**
 * Everything in the server's priority order, split into Today / Next / Later
 * by when its first study time is (PDF Q5, Q9), each with why it is where it
 * is. `limit` shows only the first N overall (the "Next 3" view).
 */
export function PriorityList({ plan, limit, onOpen, emptyText = 'Nothing to plan right now.' }) {
  const priorities = limit ? (plan?.priorities ?? []).slice(0, limit) : plan?.priorities ?? [];
  if (!priorities.length) return <p className="pl-muted">{emptyText}</p>;
  const groups = groupPriorities(priorities, plan?.blocks ?? [], plan?.today);

  return (
    <div>
      {GROUPS.filter((g) => groups[g.key].length).map((g) => (
        <section key={g.key} className="pl-group" aria-label={g.title}>
          <h3 className="pl-group__title">{g.title}</h3>
          <ol className="pl-list">
            {groups[g.key].map((p) => {
              const body = (
                <>
                  <span className="pl-item__rank" aria-label={`Priority ${p.rank}`}>
                    {p.rank}
                  </span>
                  <div className="pl-item__main">
                    <p className="pl-item__title">{p.title}</p>
                    <p className="pl-item__meta">
                      {[p.subject, p.dueDate ? `Due ${formatDateKey(p.dueDate, { weekday: 'short', month: 'short', day: 'numeric', year: undefined })}` : 'No due date', `${minutesLabel(p.remainingMinutes)} left`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {p.why?.length > 0 && <p className="pl-item__why">{p.why.join(' · ')}</p>}
                  </div>
                </>
              );
              return (
                <li key={p.assignmentId}>
                  {onOpen ? (
                    <button
                      type="button"
                      className="pl-item"
                      style={{ width: '100%', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                      onClick={() => onOpen(p)}
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="pl-item">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export default PriorityList;
