import { useCallback, useEffect, useState } from 'react';
import {
  PageHeader,
  Card,
  StatCard,
  Table,
  Input,
  Badge,
  Alert,
  Loader,
  SectionHeader,
} from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { formatCurrency } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import subscriptionService from '../../services/subscription.service';

const STATUS_LABELS = {
  trialing: 'Trialing',
  active: 'Active',
  past_due: 'Past due',
  cancelled: 'Cancelled',
  expired: 'Expired',
  incomplete: 'Incomplete',
};

/**
 * /admin/subscriptions/revenue - revenue and subscriber counts by plan.
 *
 * Revenue is net (successful charges minus refunds) and is summed from the
 * payment ledger rather than from plan prices, so a plan whose price changed
 * later doesn't retroactively rewrite past revenue.
 */
export default function AdminRevenuePage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, error, isLoading, run } = useApi(subscriptionService.adminGetStats);

  const load = useCallback(() => run({ from, to }), [run, from, to]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const totals = data?.totals;
  const byPlan = data?.byPlan ?? [];
  const byStatus = data?.byStatus ?? {};
  const currency = byPlan[0]?.currency ?? 'CAD';

  const columns = [
    { key: 'planName', header: 'Plan', render: (row) => <strong>{row.planName}</strong> },
    {
      key: 'activeSubscribers',
      header: 'Active subscribers',
      align: 'right',
      render: (row) => row.activeSubscribers,
    },
    { key: 'paymentCount', header: 'Charges', align: 'right', render: (row) => row.paymentCount },
    {
      key: 'grossRevenue',
      header: 'Gross',
      align: 'right',
      render: (row) => formatCurrency(row.grossRevenue, row.currency),
    },
    {
      key: 'refunded',
      header: 'Refunded',
      align: 'right',
      render: (row) =>
        row.refunded > 0 ? (
          <span style={{ color: 'var(--color-error)' }}>
            −{formatCurrency(row.refunded, row.currency)}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'netRevenue',
      header: 'Net',
      align: 'right',
      render: (row) => <strong>{formatCurrency(row.netRevenue, row.currency)}</strong>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Revenue"
        description="Subscription revenue and subscriber counts, by plan."
        breadcrumbs={[{ label: 'Subscriptions', to: '/admin/subscriptions' }, { label: 'Revenue' }]}
      />

      {error && <Alert variant="error">{getErrorMessage(error)}</Alert>}

      <Card flat className="ui-field">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          <Input
            label="From"
            type="date"
            hint="Leave both blank for all time"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Card>

      {isLoading && !data ? (
        <Loader message="Loading revenue…" />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            <StatCard
              label="Net revenue"
              value={formatCurrency(totals?.netRevenue ?? 0, currency)}
              hint="After refunds"
              icon="💰"
            />
            <StatCard
              label="Gross revenue"
              value={formatCurrency(totals?.grossRevenue ?? 0, currency)}
              icon="📈"
            />
            <StatCard
              label="Refunded"
              value={formatCurrency(totals?.refunded ?? 0, currency)}
              icon="↩️"
            />
            <StatCard
              label="Active subscribers"
              value={totals?.activeSubscribers ?? 0}
              hint="Trialing, active or past due"
              icon="👨‍👩‍👧"
            />
          </div>

          <Card className="ui-field">
            <SectionHeader title="By plan" as="h3" />
            <Table
              columns={columns}
              data={byPlan}
              rowKey={(row) => row.planId ?? row.planName}
              emptyContent="No revenue recorded for this period yet."
              caption="Revenue by plan"
            />
          </Card>

          <Card>
            <SectionHeader title="Subscriptions by status" as="h3" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
              {Object.keys(byStatus).length === 0 && (
                <span className="ui-hint">No subscriptions yet.</span>
              )}
              {Object.entries(byStatus).map(([status, count]) => (
                <Badge key={status} variant={status === 'active' ? 'success' : 'neutral'}>
                  {STATUS_LABELS[status] ?? status}: {count}
                </Badge>
              ))}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
