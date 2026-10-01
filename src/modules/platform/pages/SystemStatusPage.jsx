import { LuRefreshCw } from 'react-icons/lu';
import { Badge, Button, Card, DataTable, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatDateTime } from '../../../utils/date';
import platformService from '../services/platform.service';
import '../platform.css';

const STATE = {
  ok: { variant: 'success', label: 'OK' },
  late: { variant: 'warning', label: 'Late' },
  failing: { variant: 'danger', label: 'Failing' },
  never_ran: { variant: 'neutral', label: 'Never ran' },
  down: { variant: 'danger', label: 'Down' },
  not_configured: { variant: 'neutral', label: 'Not configured' },
};
const stateBadge = (state) => {
  const s = STATE[state] ?? { variant: 'neutral', label: state };
  return <Badge variant={s.variant}>{s.label}</Badge>;
};
const ago = (minutes) => (minutes == null ? '—' : minutes < 60 ? `${minutes} min ago` : `${Math.round(minutes / 60)} h ago`);

/**
 * /admin/system - is everything behind the app actually running? Database and
 * Redis, background workers, scheduled sweeps (renewals, reminders,
 * invitation expiry) and the job backlog. "Late" thresholds are the
 * "Background job monitoring" platform setting. No student data is shown.
 */
export default function SystemStatusPage() {
  const status = useApi(platformService.systemStatus, { immediate: true });
  const reload = () => status.run().catch(() => {});
  const d = status.data;

  return (
    <div className="td-page">
      <PageHeader
        title="System status"
        description="Whether the database, background workers and scheduled jobs are running."
        actions={
          <Button variant="secondary" startIcon={<LuRefreshCw aria-hidden="true" />} loading={status.isLoading} onClick={reload}>
            Refresh
          </Button>
        }
      />

      {status.isLoading && !d && <Loader message="Checking…" />}
      {status.error && !d && <ErrorState error={status.error} onRetry={reload} />}

      {d && (
        <>
          <div className="ui-statgrid ps-stat-row">
            <Card className="ps-stat">
              <p className="ps-stat__label">Database</p>
              {stateBadge(d.components.database.status)}
              {d.components.database.latencyMs != null && <p className="ps-stat__meta">{d.components.database.latencyMs} ms</p>}
            </Card>
            <Card className="ps-stat">
              <p className="ps-stat__label">Redis</p>
              {stateBadge(d.components.redis.status)}
            </Card>
            <Card className="ps-stat">
              <p className="ps-stat__label">Background jobs waiting</p>
              <p className="ps-stat__value">{d.jobs ? d.jobs.pending : '—'}</p>
              {d.jobs?.oldestPendingMinutes != null && <p className="ps-stat__meta">oldest {ago(d.jobs.oldestPendingMinutes)}</p>}
            </Card>
            <Card className="ps-stat">
              <p className="ps-stat__label">Failed jobs</p>
              <p className="ps-stat__value">{d.jobs ? d.jobs.dead : '—'}</p>
              <p className="ps-stat__meta">need attention</p>
            </Card>
          </div>

          <h2 className="ps-category__title">Scheduled sweeps</h2>
          <DataTable
            columns={[
              { key: 'label', header: 'Sweep' },
              { key: 'state', header: 'State', render: (r) => stateBadge(r.state) },
              { key: 'lastSuccessAt', header: 'Last success', render: (r) => (r.lastSuccessAt ? `${formatDateTime(r.lastSuccessAt)} (${ago(r.minutesSinceSuccess)})` : '—') },
              { key: 'lastError', header: 'Last error', render: (r) => r.lastError || '—', hideOnMobile: true },
            ]}
            data={d.sweeps}
            emptyTitle="No sweeps configured"
          />

          <h2 className="ps-category__title">Workers</h2>
          <DataTable
            columns={[
              { key: 'name', header: 'Worker' },
              { key: 'state', header: 'State', render: (r) => stateBadge(r.state) },
              { key: 'lastSeenAt', header: 'Last seen', render: (r) => `${formatDateTime(r.lastSeenAt)} (${ago(r.minutesSinceSeen)})` },
              { key: 'lastError', header: 'Last error', render: (r) => r.lastError || '—', hideOnMobile: true },
            ]}
            data={d.workers}
            emptyTitle="No worker has reported yet"
            emptyDescription="Start one with npm run worker, or let the API process jobs itself (OUTBOX_INLINE)."
          />

          <p className="ps-card__meta">Checked {formatDateTime(d.checkedAt)}</p>
        </>
      )}
    </div>
  );
}
