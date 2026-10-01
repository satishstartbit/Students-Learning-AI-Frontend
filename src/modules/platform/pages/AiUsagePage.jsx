import { useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import { Button, Card, DataTable, ErrorState, Loader, PageHeader, Select } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { getActiveLocale } from '../../../utils/locale';
import platformService from '../services/platform.service';
import '../platform.css';

const RANGES = [7, 30, 90].map((d) => ({ value: String(d), label: `Last ${d} days` }));
// Provider prices are in US dollars (the "AI models and budgets" price table), so costs are shown in USD.
const usd = (n) => new Intl.NumberFormat(getActiveLocale(), { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(n ?? 0);
const pct = (n) => (n == null ? '—' : `${n}%`);
const num = (n) => new Intl.NumberFormat(getActiveLocale()).format(n ?? 0);

/**
 * /admin/ai-usage - what AI costs and how well it works: cost per use case and
 * model, cost per student, provider rate limits, how often plans fell back to
 * templates, and how often added work needed a question. Counts and money
 * only - no student text or names. Limits and prices are in "AI models and
 * budgets"; wording in "AI prompts".
 */
export default function AiUsagePage() {
  const [days, setDays] = useState('30');
  const usage = useApi(platformService.aiUsage, { immediate: true, args: [30] });
  const reload = (d = days) => usage.run(Number(d)).catch(() => {});
  const u = usage.data;

  return (
    <div className="td-page">
      <PageHeader
        title="AI usage"
        description="Cost and quality of AI help. Budgets and prices are in Platform settings › AI models and budgets."
        actions={
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Select
              label="Period"
              value={days}
              options={RANGES}
              onChange={(e) => {
                setDays(e.target.value);
                reload(e.target.value);
              }}
            />
            <Button variant="secondary" startIcon={<LuRefreshCw aria-hidden="true" />} loading={usage.isLoading} onClick={() => reload()}>
              Refresh
            </Button>
          </div>
        }
      />

      {usage.isLoading && !u && <Loader message="Adding it up…" />}
      {usage.error && !u && <ErrorState error={usage.error} onRetry={() => reload()} />}

      {u && (
        <>
          <div className="ui-statgrid ps-stat-row">
            <Card className="ps-stat">
              <p className="ps-stat__label">Cost</p>
              <p className="ps-stat__value">{usd(u.totals.costUsd)}</p>
              <p className="ps-stat__meta">{num(u.totals.requests)} requests</p>
            </Card>
            <Card className="ps-stat">
              <p className="ps-stat__label">Per student</p>
              <p className="ps-stat__value">{u.totals.costPerStudentUsd == null ? '—' : usd(u.totals.costPerStudentUsd)}</p>
              <p className="ps-stat__meta">{num(u.totals.students)} students used AI</p>
            </Card>
            <Card className="ps-stat">
              <p className="ps-stat__label">Failures</p>
              <p className="ps-stat__value">{num(u.totals.failures)}</p>
              <p className="ps-stat__meta">{num(u.totals.rateLimited)} rate-limited by the provider</p>
            </Card>
            <Card className="ps-stat">
              <p className="ps-stat__label">Plans from templates</p>
              <p className="ps-stat__value">{pct(u.breakdowns.templateFallbackPercent)}</p>
              <p className="ps-stat__meta">
                {num(u.breakdowns.total)} step plans · {pct(u.breakdowns.invalidPercent)} AI answers refused as invalid
              </p>
            </Card>
            <Card className="ps-stat">
              <p className="ps-stat__label">Added work asked a question</p>
              <p className="ps-stat__value">{pct(u.intakes.askedPercent)}</p>
              <p className="ps-stat__meta">
                {num(u.intakes.total)} added · {pct(u.intakes.straightThroughPercent)} straight onto the plan
              </p>
            </Card>
          </div>

          <DataTable
            rowKey={(r) => `${r.useCase}:${r.model}`}
            data={u.byUseCase}
            emptyTitle="No AI requests in this period"
            caption="AI requests by use and model"
            columns={[
              { key: 'useCase', header: 'Use' },
              { key: 'model', header: 'Model', render: (r) => r.model ?? '—' },
              { key: 'requests', header: 'Requests', render: (r) => num(r.requests) },
              { key: 'failures', header: 'Failed', render: (r) => num(r.failures) },
              { key: 'tokens', header: 'Tokens in / out', render: (r) => `${num(r.tokensIn)} / ${num(r.tokensOut)}` },
              { key: 'costUsd', header: 'Cost', render: (r) => usd(r.costUsd) },
              { key: 'p95', header: 'p95 time', render: (r) => (r.p95LatencyMs == null ? '—' : `${num(r.p95LatencyMs)} ms`) },
              { key: 'students', header: 'Students', render: (r) => num(r.students) },
            ]}
          />
        </>
      )}
    </div>
  );
}
