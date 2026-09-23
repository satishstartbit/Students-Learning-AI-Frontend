import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuFilterX, LuHandCoins, LuTrendingUp, LuUndo2, LuUsers } from 'react-icons/lu';
import {
  PageHeader,
  Card,
  StatCard,
  Table,
  Input,
  IconButton,
  FilterBar,
  Alert,
  Loader,
  SectionHeader,
} from '../../../../components/common';
import { Tooltip } from '../../../../components/ui/tooltip';
import { useApi } from '../../../../hooks/useApi';
import { formatCurrency, formatNumber } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { DEFAULT_CURRENCY } from '../../../../utils/locale';
import subscriptionService from '../../services/subscription.service';

/**
 * /admin/subscriptions/revenue - revenue and subscriber counts by plan.
 *
 * Revenue is net (successful charges minus refunds) and is summed from the
 * payment ledger rather than from plan prices, so a plan whose price changed
 * later doesn't retroactively rewrite past revenue.
 *
 * This platform bills in one currency (the Canadian-localization default -
 * plans can't be created in anything else, see SubscriptionPlanFormPage.jsx
 * and validators/masterBilling.validator.js) so the summary is always one
 * set of totals. `distinctCurrencies` only exists as a data-integrity check:
 * if a historical row is ever found in another currency, it's called out as
 * an anomaly rather than silently summed into the one total or given its own
 * parallel section as if multi-currency were a normal, supported state here.
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
  const byPlan = useMemo(() => data?.byPlan ?? [], [data]);

  const distinctCurrencies = useMemo(
    () => [...new Set(byPlan.map((row) => row.currency).filter(Boolean))],
    [byPlan]
  );
  const currency = distinctCurrencies[0] ?? DEFAULT_CURRENCY;
  const hasCurrencyAnomaly = distinctCurrencies.some((c) => c !== DEFAULT_CURRENCY) || distinctCurrencies.length > 1;

  const columns = [
    { key: 'planName', header: 'Plan', render: (row) => <strong>{row.planName}</strong> },
    {
      key: 'activeSubscribers',
      header: 'Active subscribers',
      align: 'right',
      render: (row) => formatNumber(row.activeSubscribers),
    },
    { key: 'paymentCount', header: 'Charges', align: 'right', render: (row) => formatNumber(row.paymentCount) },
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
          <span style={{ color: 'var(--color-danger-fg)' }}>
            −{formatCurrency(row.refunded, row.currency)}
          </span>
        ) : (
          <span className="ui-hint">—</span>
        ),
    },
    {
      key: 'netRevenue',
      header: 'Net',
      align: 'right',
      render: (row) => <strong>{formatCurrency(row.netRevenue, row.currency)}</strong>,
    },
  ];

  const statGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'var(--spacing-md)',
    marginBottom: 'var(--spacing-lg)',
  };

  return (
    <div className="td-page">
      <PageHeader
        title="Revenue"
        description={`Subscription revenue and subscriber counts, by plan. All figures in ${currency}.`}
        breadcrumbs={[{ label: 'Subscriptions', to: '/admin/subscriptions' }, { label: 'Revenue' }]}
      />

      {error && (
        <Alert variant="error" className="ui-field">
          {getErrorMessage(error)}
        </Alert>
      )}

      {hasCurrencyAnomaly && (
        <Alert variant="warning" title="Some records aren't in this platform's currency" className="ui-field">
          The totals below only include {currency} activity. A payment or plan was found in a different
          currency - check the Subscription Plans master and the payment ledger for a data-entry mistake.
        </Alert>
      )}

      <FilterBar>
        <Input fieldClassName="ui-field--compact-labeled" label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input fieldClassName="ui-field--compact-labeled" label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Tooltip label="Clear filters" side="top">
          <IconButton
            icon={<LuFilterX aria-hidden="true" />}
            label="Clear filters"
            size="sm"
            onClick={() => {
              setFrom('');
              setTo('');
            }}
            disabled={!from && !to}
          />
        </Tooltip>
      </FilterBar>

      {isLoading && !data ? (
        <Loader message="Loading revenue…" />
      ) : (
        <>
          <div style={statGridStyle}>
            <StatCard
              label="Net revenue"
              icon={<LuHandCoins aria-hidden="true" />}
              value={formatCurrency(totals?.netRevenue ?? 0, currency)}
              hint="After refunds"
            />
            <StatCard
              label="Gross revenue"
              icon={<LuTrendingUp aria-hidden="true" />}
              value={formatCurrency(totals?.grossRevenue ?? 0, currency)}
              hint="Before refunds"
            />
            <StatCard
              label="Refunded"
              icon={<LuUndo2 aria-hidden="true" />}
              value={formatCurrency(totals?.refunded ?? 0, currency)}
              hint="Returned to parents"
            />
            <StatCard
              label="Active subscribers"
              icon={<LuUsers aria-hidden="true" />}
              value={formatNumber(totals?.activeSubscribers ?? 0)}
              hint="Trialing, active or past due"
            />
          </div>

          <Card className="ui-field">
            <SectionHeader title="By plan" description="Net revenue and subscriber counts for each active plan." as="h3" />
            <Table
              columns={columns}
              data={byPlan}
              rowKey={(row) => row.planId ?? row.planName}
              emptyContent="No revenue recorded for this period yet."
              caption="Revenue by plan"
            />
          </Card>
        </>
      )}
    </div>
  );
}
