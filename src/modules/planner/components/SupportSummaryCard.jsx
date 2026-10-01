import { Badge } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import supportService from '../services/support.service';

/**
 * What has been hard lately, and which ideas helped - counts only, from
 * what the child chose to share (never their words, never raw events).
 */
export function SupportSummaryCard({ studentId, firstName }) {
  const summary = useApi(supportService.getSummary, { immediate: true, args: [studentId] });
  const s = summary.data;
  const barriers = Array.isArray(s?.barriers) ? s.barriers : [];
  const helpfulIdeas = Array.isArray(s?.helpfulIdeas) ? s.helpfulIdeas : [];
  if (!barriers.length && !s?.askedForHelp) return null;

  return (
    <section className="pl-card" aria-labelledby="pl-support-title">
      <div className="pl-card__head">
        <div>
          <h2 id="pl-support-title" className="pl-card__title">
            What’s been hard lately
          </h2>
          <p className="pl-card__sub">
            Last {s.days} days · what {firstName} chose to share
          </p>
        </div>
      </div>
      <div className="pl-stack" style={{ gap: 10 }}>
        {barriers.length > 0 && (
          <div className="pl-row">
            {barriers.map((b) => (
              <Badge key={b.code} variant="neutral">
                {b.name} · {b.count}
              </Badge>
            ))}
          </div>
        )}
        {helpfulIdeas.length > 0 && (
          <p className="pl-muted" style={{ margin: 0 }}>
            Helped: {helpfulIdeas.map((i) => i.name).join(', ')}
          </p>
        )}
        {s.askedForHelp > 0 && (
          <p className="pl-muted" style={{ margin: 0 }}>
            Asked for help {s.askedForHelp} time{s.askedForHelp === 1 ? '' : 's'}.
          </p>
        )}
      </div>
    </section>
  );
}

export default SupportSummaryCard;
