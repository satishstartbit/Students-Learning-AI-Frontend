import { useState } from 'react';
import { LuMail, LuRefreshCw } from 'react-icons/lu';
import { Alert, Badge, Button, Card, DataTable, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatDateTime } from '../../../utils/date';
import { emailProblemLabel, emailProblemText } from '../../../utils/emailProblem';
import { getErrorMessage } from '../../../utils/errorHandler';
import platformService from '../services/platform.service';
import '../platform.css';

const PROVIDER_NAME = {
  smtp: 'SMTP (EMAIL_PROVIDER=smtp)',
  brevo: 'Brevo (EMAIL_PROVIDER=brevo)',
  ses: 'Amazon SES (EMAIL_PROVIDER=ses)',
};

/** The links in emails should open this very site; a localhost or other origin means CLIENT_URL is wrong. */
function linksOpenElsewhere(linksOpen) {
  try {
    return new URL(linksOpen).origin !== window.location.origin;
  } catch {
    return Boolean(linksOpen);
  }
}

/**
 * Email: sign-up codes, set-password links and resets all depend on it, and
 * a host that blocks SMTP fails quietly - so this says what the server is set
 * up with, how the last send went, and lets Super Admin send themselves a
 * test (to their own address only).
 */
function EmailStatus({ email, onTested }) {
  const [testing, setTesting] = useState(false);

  const failedLast =
    email.lastFailureAt && (!email.lastSuccessAt || new Date(email.lastFailureAt) > new Date(email.lastSuccessAt));
  let state = { variant: 'neutral', label: 'Not used yet', problem: null };
  if (!email.configured) state = { variant: 'danger', label: emailProblemLabel('not_configured'), problem: 'not_configured' };
  else if (failedLast) state = { variant: 'danger', label: emailProblemLabel(email.lastProblem), problem: email.lastProblem };
  else if (email.lastSuccessAt) state = { variant: 'success', label: 'Working', problem: null };

  const here = window.location.origin;
  const wrongLinks = linksOpenElsewhere(email.linksOpen);

  const sendTest = async () => {
    setTesting(true);
    try {
      const { data } = await platformService.sendTestEmail();
      if (data?.sent) toast.success(`Check ${data.to}, and its spam folder.`, { title: 'Test email sent' });
      else toast.error(emailProblemText(data?.problem), { title: "The test email didn't go out" });
      await onTested();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="ps-email" data-testid="email-status">
      <div className="ps-email__head">
        <Badge variant={state.variant}>{state.label}</Badge>
        <Button variant="secondary" size="sm" startIcon={<LuMail aria-hidden="true" />} loading={testing} onClick={sendTest}>
          Send me a test email
        </Button>
      </div>

      <dl className="ps-facts">
        <dt>Provider</dt>
        <dd>
          {PROVIDER_NAME[email.provider] ?? email.provider}
          {!email.knownProvider && ' - not a provider this server knows; check EMAIL_PROVIDER'}
        </dd>
        <dt>Sender</dt>
        <dd>{email.from || 'Not set'}</dd>
        <dt>Links in emails open</dt>
        <dd>{email.linksOpen || 'Not set'}</dd>
        <dt>Last sent</dt>
        <dd>{email.lastSuccessAt ? formatDateTime(email.lastSuccessAt) : 'Nothing since the server last started'}</dd>
        <dt>Last failure</dt>
        <dd>
          {email.lastFailureAt
            ? `${formatDateTime(email.lastFailureAt)} · ${emailProblemLabel(email.lastProblem)}`
            : 'None since the server last started'}
        </dd>
      </dl>

      {state.problem && (
        <Alert variant="error" title="Emails aren't going out" className="ui-field">
          {emailProblemText(state.problem)} Sign-up codes, set-password links and password resets all wait on this.
        </Alert>
      )}
      {wrongLinks && (
        <Alert variant="warning" title="Links in emails open another site" className="ui-field">
          Reset and sign-up links open {email.linksOpen}, not {here}. Set CLIENT_URL={here} on the backend host.
        </Alert>
      )}
    </Card>
  );
}

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
 * Redis, email (set-up, last send, test email), background workers, scheduled sweeps (renewals, reminders,
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
        description="Whether the database, email, background workers and scheduled jobs are running."
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

          {d.email && (
            <>
              <h2 className="ps-category__title">Email</h2>
              <EmailStatus email={d.email} onTested={reload} />
            </>
          )}

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
