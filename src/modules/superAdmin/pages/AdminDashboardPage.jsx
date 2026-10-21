import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuActivity,
  LuBackpack,
  LuCircleAlert,
  LuCircleCheck,
  LuCreditCard,
  LuGraduationCap,
  LuHandCoins,
  LuInfo,
  LuLogIn,
  LuTimer,
  LuTriangleAlert,
  LuUserPlus,
  LuUsers,
} from 'react-icons/lu';
import {
  Button,
  Card,
  ErrorState,
  FilterBar,
  Loader,
  PageHeader,
  SectionHeader,
  Select,
  StatCard,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { formatDateKeyRange } from '../../../utils/date';
import { formatCurrency, formatNumber } from '../../../utils/format';
import { DEFAULT_CURRENCY } from '../../../utils/locale';
import { ROLE_CREATE_PATH, USER_ROLES } from '../../../utils/constants';
import RevenueChart from '../../subscription/components/admin/RevenueChart';
import { trendOf } from '../../subscription/components/admin/adminBilling';
import BarChart from '../components/dashboard/BarChart';
import BarList from '../components/dashboard/BarList';
import DonutChart from '../components/dashboard/DonutChart';
import { PERIOD_OPTIONS, ROLE_SERIES, SUBSCRIPTION_ROWS, attentionItems, periodPhrase } from '../components/dashboard/dashboardData';
import dashboardService from '../services/adminDashboard.service';
import '../../subscription/components/admin/adminBilling.css';
import '../components/dashboard/adminDashboard.css';

const ACTIVITY_SERIES = [
  { key: 'checkIns', label: 'Check-ins', className: 'ad-series--checkins' },
  { key: 'focusSessions', label: 'Focus sessions', className: 'ad-series--focus' },
];

const ATTENTION_ICON = { danger: LuCircleAlert, warning: LuTriangleAlert, info: LuInfo, success: LuCircleCheck };

/**
 * Super Admin overview (/admin): accounts and growth, sign-ins, subscriptions
 * and revenue, learning activity and what needs attention - all from one read, `GET /admin/dashboard?days=` (backend
 * services/adminDashboard.service.js), over the admin's own calendar days and
 * compared with the period just before.
 */
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [days, setDays] = useState('30');
  const dashboard = useApi(dashboardService.getDashboard);
  const { run } = dashboard;

  useEffect(() => {
    run(Number(days)).catch(() => {});
  }, [run, days]);

  const data = dashboard.data;
  const acc = data?.accounts;
  const revenue = data?.revenue;
  const currency = revenue?.currency ?? DEFAULT_CURRENCY;
  const money = (value) => formatCurrency(value ?? 0, currency);
  const phrase = periodPhrase(days);
  const previousText = (value, format = formatNumber) => `vs ${format(value ?? 0)} in the ${Number(days) === 365 ? 'previous 12 months' : `previous ${days} days`}`;
  const attention = attentionItems(data);
  // Only a full reply is drawn - an empty or partial one shows "couldn't load" with a retry, never a crash.
  const ready = Boolean(acc?.total && data?.subscriptions && data?.learning);
  const retry = () => run(Number(days)).catch(() => {});

  const subscriptionRows = SUBSCRIPTION_ROWS.filter((r) => r.always || (data?.subscriptions?.byStatus?.[r.key] ?? 0) > 0).map((r) => ({
    ...r,
    value: data?.subscriptions?.byStatus?.[r.key] ?? 0,
  }));

  return (
    <div className="td-page ad-page">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? 'Admin'}`}
        description="Platform overview: accounts, billing, learning activity and anything that needs you."
      />

      <div className="ad-period">
        <FilterBar>
          <Select fieldClassName="ui-field--compact" label="Period" options={PERIOD_OPTIONS} value={days} onChange={(e) => setDays(e.target.value)} placeholder="Period" />
          {data?.range && <span className="ad-period__range">{formatDateKeyRange(data.range.from, data.range.to)} · compared with the period before</span>}
        </FilterBar>
      </div>

      {dashboard.error && !ready ? (
        <ErrorState error={dashboard.error} onRetry={retry} />
      ) : !ready && (dashboard.isLoading || !data) ? (
        <Loader message="Loading the dashboard…" />
      ) : !ready ? (
        <ErrorState title="The dashboard couldn't be loaded" error={new Error("The dashboard's figures didn't come through. Try again in a moment.")} onRetry={retry} />
      ) : (
        <>
          <div className="ad-stats" aria-busy={dashboard.isLoading || undefined}>
            <StatCard label="Students" icon={<LuBackpack aria-hidden="true" />} value={formatNumber(acc.total.student)} hint={`+${formatNumber(acc.new.student)} in ${phrase}`} />
            <StatCard label="Parents" icon={<LuUsers aria-hidden="true" />} value={formatNumber(acc.total.parent)} hint={`+${formatNumber(acc.new.parent)} in ${phrase}`} />
            <StatCard 
              label="Teachers"
              icon={<LuGraduationCap aria-hidden="true" />}
              value={formatNumber(acc.total.teacher)} hint={`+${formatNumber(acc.new.teacher)} in ${phrase}`} />
            <StatCard  
              label="New accounts"
              icon={<LuUserPlus aria-hidden="true" />}
              value={formatNumber(acc.newAll)}
              trend={trendOf(acc.newAllChange)}
              hint={previousText(Object.values(acc.newPrevious ?? {}).reduce((a, b) => a + b, 0))}
            />
            <StatCard label="Signed in" icon={<LuLogIn aria-hidden="true" />} value={formatNumber(acc.signedInAll)} trend={trendOf(acc.signedInChange)} hint={`People who signed in · ${previousText(acc.signedInPrevious)}`} />
            <StatCard
              label="Active subscriptions"
              icon={<LuCreditCard aria-hidden="true" />}
              value={formatNumber(data.subscriptions.live)}
              hint={revenue?.mrr ? `${money(revenue.mrr.value)} monthly recurring revenue` : 'Trialing, active or past due'}
            />
            {revenue && (
              <StatCard label="Net revenue" icon={<LuHandCoins aria-hidden="true" />} value={money(revenue.netRevenue)} trend={trendOf(revenue.changes?.netRevenue)} hint={`After refunds, before tax · ${phrase}`} />
            )}
            <StatCard
              label="Focus sessions"
              icon={<LuTimer aria-hidden="true" />}
              value={formatNumber(data.learning.totals.focusSessions)}
              trend={trendOf(data.learning.changes?.focusSessions)}
              hint={`${formatNumber(data.learning.totals.focusMinutes)} focused minutes · ${formatNumber(data.learning.totals.checkIns)} check-ins`}
            />
          </div>

          <div className="ad-grid">
            <Card className="ad-card">
              <SectionHeader title="New accounts" description={`Sign-ups by role in ${phrase}`} />
              <BarChart series={acc.signups} keys={ROLE_SERIES} label="New accounts over time" emptyText={`No new accounts in ${phrase}.`} />
            </Card>
            <Card className="ad-card">
              <SectionHeader title="Accounts by role" description="Everyone on the platform now (not deleted)" />
              <DonutChart
                label="Accounts by role"
                centerLabel="accounts"
                segments={ROLE_SERIES.map((r) => ({ key: r.key, label: r.label, value: acc.total[r.key], className: r.className }))}
              />
              <p className="ad-card__foot">
                {formatNumber(acc.signedInAll)} signed in during {phrase}
                {acc.suspendedAll ? ` · ${formatNumber(acc.suspendedAll)} suspended` : ''}
              </p>
            </Card>
          </div>

          <div className="ad-grid">
            <Card className="ad-card">
              <SectionHeader
                title="Revenue"
                description={revenue ? `${money(revenue.grossRevenue)} charged · ${money(revenue.refunded)} refunded` : undefined}
                actions={
                  <Link className="ad-card__link" to="/admin/subscriptions/revenue">
                    Revenue report
                  </Link>
                }
              />
              {revenue ? <RevenueChart series={revenue.series} currency={currency} /> : <p className="ad-empty">Revenue couldn&apos;t be loaded right now.</p>}
            </Card>
            <Card className="ad-card">
              <SectionHeader
                title="Subscriptions"
                description="Every family plan by status, now"
                actions={
                  <Link className="ad-card__link" to="/admin/subscriptions">
                    Manage
                  </Link>
                }
              />
              <BarList rows={subscriptionRows} label="Subscriptions by status" />
              {revenue && (
                <p className="ad-card__foot">
                  {formatNumber(revenue.newSubscriptions)} new and {formatNumber(revenue.cancellations)} cancelled in {phrase}
                  {data.subscriptions.endingAtPeriodEnd ? ` · ${formatNumber(data.subscriptions.endingAtPeriodEnd)} set to end` : ''}
                </p>
              )}
            </Card>
          </div>

          <div className="ad-grid">
            <Card className="ad-card">
              <SectionHeader title="Learning activity" description={`Students' daily check-ins and finished focus sessions in ${phrase}`} />
              <div className="ad-figures">
                <span>
                  <span className="ad-figure__value">{formatNumber(data.learning.totals.checkIns)}</span>
                  <span className="ad-figure__label">check-ins</span>
                </span>
                <span>
                  <span className="ad-figure__value">{formatNumber(data.learning.totals.focusSessions)}</span>
                  <span className="ad-figure__label">focus sessions</span>
                </span>
                <span>
                  <span className="ad-figure__value">{formatNumber(data.learning.totals.focusMinutes)}</span>
                  <span className="ad-figure__label">focused minutes</span>
                </span>
              </div>
              <BarChart series={data.learning.series} keys={ACTIVITY_SERIES} stacked={false} label="Learning activity over time" emptyText={`No check-ins or focus sessions in ${phrase}.`} />
            </Card>
            <Card className="ad-card">
              <SectionHeader title="Needs attention" description="Billing, safety, accounts and the system" />
              <ul className="ad-attention">
                {attention.map((item) => {
                  const Icon = ATTENTION_ICON[item.tone] ?? LuActivity;
                  return (
                    <li key={item.id} className={`ad-attention__item ad-attention__item--${item.tone}`}>
                      <Icon className="ad-attention__icon" aria-hidden="true" />
                      <div className="ad-attention__body">
                        <p className="ad-attention__title">{item.title}</p>
                        <p className="ad-attention__text">{item.text}</p>
                      </div>
                      {item.to && (
                        <Link className="ad-card__link" to={item.to}>
                          {item.cta ?? 'Open'}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
