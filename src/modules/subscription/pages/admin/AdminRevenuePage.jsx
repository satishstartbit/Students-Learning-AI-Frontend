import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LuBadgePercent,
  LuDownload,
  LuHandCoins,
  LuLandmark,
  LuRepeat,
  LuTrendingUp,
  LuUndo2,
  LuUserMinus,
  LuUserPlus,
  LuUsers,
  LuSparkles,
} from 'react-icons/lu';
import {
  PageHeader,
  Button,
  Card,
  StatCard,
  Table,
  Input,
  Select,
  FilterBar,
  Alert,
  Loader,
  SectionHeader,
  Toast,
} from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { formatDateKeyRange, getDateKey } from '../../../../utils/date';
import { formatCurrency, formatNumber } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { downloadTextFile } from '../../../../utils/file';
import { DEFAULT_CURRENCY } from '../../../../utils/locale';
import subscriptionService from '../../services/subscription.service';
import RevenueChart from '../../components/admin/RevenueChart';
import { REVENUE_PRESETS, presetRange, trendOf } from '../../components/admin/adminBilling';
import '../../components/admin/adminBilling.css';

/** "Previous: $1,234.00 (+12.5%)" - for figures where up isn't good news (refunds, cancellations). */
const versus = (previous, change, format) =>
  previous == null ? null : `Previous period: ${format(previous)}${change == null ? '' : ` (${change >= 0 ? '+' : ''}${Math.round(change * 10) / 10}%)`}`;

/**
 * /admin/subscriptions/revenue - revenue over time and by plan, compared with
 * the previous period of the same length, plus MRR, new subscriptions,
 * cancellations, trial-to-paid and discounts. Sales tax can be exported for
 * the GST/HST return.
 *
 * Revenue is summed from the payment ledger (not plan prices), and a refund
 * counts against the charge it returns. Days are the admin's own calendar
 * days. One currency (CAD): `distinctCurrencies` only flags a stray record.
 */
export default function AdminRevenuePage() {
  const todayKey = getDateKey(new Date());
  const [preset, setPreset] = useState('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const range = preset === 'custom' ? custom : presetRange(preset, todayKey);
  const [exportingTax, setExportingTax] = useState(false);

  const { data, error, isLoading, run } = useApi(subscriptionService.adminGetStats);
  const load = useCallback(() => run({ from: range.from, to: range.to }), [run, range.from, range.to]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const totals = data?.totals;
  const previous = data?.previous ?? null;
  const changes = data?.changes ?? {};
  const byPlan = useMemo(() => data?.byPlan ?? [], [data]);
  const showTax = (totals?.taxCollected ?? 0) > 0 || (previous?.taxCollected ?? 0) > 0;

  const distinctCurrencies = useMemo(() => [...new Set(byPlan.map((row) => row.currency).filter(Boolean))], [byPlan]);
  const currency = distinctCurrencies[0] ?? DEFAULT_CURRENCY;
  const hasCurrencyAnomaly = distinctCurrencies.some((c) => c !== DEFAULT_CURRENCY) || distinctCurrencies.length > 1;
  const money = (value) => formatCurrency(value ?? 0, currency);

  const exportTax = async () => {
    setExportingTax(true);
    try {
      const { data: csv } = await subscriptionService.adminExportTax({ from: data?.range?.from ?? range.from, to: data?.range?.to ?? range.to });
      downloadTextFile(`sales-tax-${data?.range?.from ?? 'all'}-to-${data?.range?.to ?? todayKey}.csv`, csv, 'text/csv;charset=utf-8');
      toast.success('Sales tax export downloaded');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportingTax(false);
    }
  };

  const columns = [
    { key: 'planName', header: 'Plan', render: (row) => <strong>{row.planName}</strong> },
    { key: 'activeSubscribers', header: 'Active subscribers', align: 'right', render: (row) => formatNumber(row.activeSubscribers) },
    { key: 'paymentCount', header: 'Charges', align: 'right', render: (row) => formatNumber(row.paymentCount) },
    { key: 'grossRevenue', header: 'Gross', align: 'right', render: (row) => formatCurrency(row.grossRevenue, row.currency) },
    {
      key: 'refunded',
      header: 'Refunded',
      align: 'right',
      render: (row) =>
        row.refunded > 0 ? <span style={{ color: 'var(--color-danger-fg)' }}>−{formatCurrency(row.refunded, row.currency)}</span> : <span className="ui-hint">—</span>,
    },
    { key: 'netRevenue', header: 'Net', align: 'right', render: (row) => <strong>{formatCurrency(row.netRevenue, row.currency)}</strong> },
    ...(showTax
      ? [{ key: 'taxCollected', header: 'Of which tax', align: 'right', render: (row) => formatCurrency(row.taxCollected ?? 0, row.currency) }]
      : []),
  ];

  const compareText =
    data?.range && !data.range.allTime && data.range.previousFrom
      ? `Compared with ${formatDateKeyRange(data.range.previousFrom, data.range.previousTo)}`
      : data?.range?.allTime
        ? 'All time - no comparison'
        : null;
  const trialRate = totals?.trialToPaidRate;

  return (
    <div className="td-page">
      <PageHeader
        title="Revenue"
        description={`Subscription revenue over time and by plan. All figures in ${currency}, before tax unless shown.`}
        breadcrumbs={[{ label: 'Subscriptions', to: '/admin/subscriptions' }, { label: 'Revenue' }]}
        actions={
          <Button variant="secondary" onClick={exportTax} loading={exportingTax} startIcon={<LuDownload aria-hidden="true" />}>
            Export sales tax (GST/HST)
          </Button>
        }
      />

      {error && (
        <Alert variant="error" className="ui-field">
          {getErrorMessage(error)}
        </Alert>
      )}

      {hasCurrencyAnomaly && (
        <Alert variant="warning" title="Some records aren't in this platform's currency" className="ui-field">
          The totals below only include {currency} activity. A payment or plan was found in a different currency - check the Subscription Plans master
          and the payment ledger for a data-entry mistake.
        </Alert>
      )}

      <FilterBar>
        <Select fieldClassName="ui-field--compact" label="Period" options={REVENUE_PRESETS} value={preset} onChange={(e) => setPreset(e.target.value)} placeholder="Period" />
        {preset === 'custom' && (
          <>
            <Input fieldClassName="ui-field--compact-labeled" label="From" type="date" value={custom.from} max={custom.to || todayKey} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
            <Input fieldClassName="ui-field--compact-labeled" label="To" type="date" value={custom.to} min={custom.from || undefined} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
          </>
        )}
        {compareText && <span className="ui-hint">{compareText}</span>}
      </FilterBar>

      {isLoading && !data ? (
        <Loader message="Loading revenue…" />
      ) : (
        <>
          <div className="ab-statgrid">
            <StatCard
              label="Net revenue"
              icon={<LuHandCoins aria-hidden="true" />}
              value={money(totals?.netRevenue)}
              trend={trendOf(changes.netRevenue)}
              hint={versus(previous?.netRevenue, null, money) ?? 'After refunds'}
            />
            <StatCard
              label="Gross revenue"
              icon={<LuTrendingUp aria-hidden="true" />}
              value={money(totals?.grossRevenue)}
              trend={trendOf(changes.grossRevenue)}
              hint={versus(previous?.grossRevenue, null, money) ?? 'Before refunds'}
            />
            <StatCard
              label="Refunded"
              icon={<LuUndo2 aria-hidden="true" />}
              value={money(totals?.refunded)}
              hint={versus(previous?.refunded, changes.refunded, money) ?? 'Returned to parents'}
            />
            <StatCard
              label="Monthly recurring revenue"
              icon={<LuRepeat aria-hidden="true" />}
              value={money(data?.mrr?.value)}
              hint={`Now · ${formatNumber(data?.mrr?.subscriptions ?? 0)} paying subscriptions (yearly ÷ 12)`}
            />
            <StatCard
              label="Active subscribers"
              icon={<LuUsers aria-hidden="true" />}
              value={formatNumber(totals?.activeSubscribers ?? 0)}
              hint="Now · trialing, active or past due"
            />
            <StatCard
              label="New subscriptions"
              icon={<LuUserPlus aria-hidden="true" />}
              value={formatNumber(totals?.newSubscriptions ?? 0)}
              trend={trendOf(changes.newSubscriptions)}
              hint={versus(previous?.newSubscriptions, null, formatNumber) ?? 'Plan changes not counted'}
            />
            <StatCard
              label="Cancellations"
              icon={<LuUserMinus aria-hidden="true" />}
              value={formatNumber(totals?.cancellations ?? 0)}
              hint={versus(previous?.cancellations, changes.cancellations, formatNumber) ?? 'Cancelled or expired (plan changes not counted)'}
            />
            <StatCard
              label="Trial to paid"
              icon={<LuSparkles aria-hidden="true" />}
              value={trialRate == null ? '—' : `${trialRate}%`}
              hint={
                totals?.trialsEnded
                  ? `${formatNumber(totals.trialsConverted)} of ${formatNumber(totals.trialsEnded)} trials that ended became paid`
                  : 'No trials ended in this period'
              }
            />
            <StatCard
              label="Discounts given"
              icon={<LuBadgePercent aria-hidden="true" />}
              value={money(totals?.discounts)}
              hint={versus(previous?.discounts, changes.discounts, money) ?? 'Codes (and plan-change credit) taken off charges'}
            />
            {showTax && (
              <StatCard
                label="Sales tax collected"
                icon={<LuLandmark aria-hidden="true" />}
                value={money(totals?.taxCollected)}
                hint={`Owed to the government, not revenue · ${money(totals?.netRevenueBeforeTax)} before tax`}
              />
            )}
          </div>

          <Card className="ui-field">
            <SectionHeader
              title="Revenue over time"
              description={data?.range ? formatDateKeyRange(data.range.from, data.range.to) : undefined}
              as="h3"
            />
            <RevenueChart series={data?.series} currency={currency} />
          </Card>

          <Card className="ui-field">
            <SectionHeader title="By plan" description="Charges in this period by plan, and each plan's subscribers now." as="h3" />
            <Table columns={columns} data={byPlan} rowKey={(row) => row.planId ?? row.planName} emptyContent="No revenue recorded for this period yet." caption="Revenue by plan" />
          </Card>
        </>
      )}
      <Toast />
    </div>
  );
}
