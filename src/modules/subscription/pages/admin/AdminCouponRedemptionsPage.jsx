import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  PageHeader,
  Card,
  Table,
  StatCard,
  StatusBadge,
  Alert,
  Loader,
  Button,
} from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { formatDate } from '../../../../utils/date';
import { formatName } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import subscriptionService from '../../services/subscription.service';

/**
 * /admin/masters/discount-codes/:id/redemptions
 *
 * Who actually used a discount code. Derived from the subscriptions carrying
 * the code rather than a separate redemption ledger - a subscription holding
 * the code IS the redemption, so the two can never drift apart.
 */
export default function AdminCouponRedemptionsPage() {
  const { id } = useParams();
  const { data, error, isLoading, run } = useApi(subscriptionService.adminListCouponRedemptions);

  useEffect(() => {
    run(id).catch(() => {});
  }, [run, id]);

  const coupon = data?.coupon;
  const redemptions = data?.redemptions ?? [];

  const columns = [
    {
      key: 'parent',
      header: 'Parent',
      render: (row) => (
        <div>
          <strong>{formatName(row.parent)}</strong>
          <div className="ui-hint">{row.parent?.email}</div>
        </div>
      ),
    },
    { key: 'plan', header: 'Plan', render: (row) => row.plan?.name ?? '—' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'createdAt',
      header: 'Redeemed',
      render: (row) => formatDate(row.createdAt),
    },
  ];

  if (isLoading && !data) return <Loader message="Loading redemptions…" />;

  return (
    <div className="td-page">
      <PageHeader
        title={coupon ? `Redemptions — ${coupon.code}` : 'Redemptions'}
        description={coupon?.name}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Discount Codes', to: '/admin/masters/discount-codes' },
          { label: 'Redemptions' },
        ]}
        actions={
          <Button as={Link} to="/admin/masters/discount-codes" variant="secondary">
            Back to codes
          </Button>
        }
      />

      {error && <Alert variant="error">{getErrorMessage(error)}</Alert>}

      {coupon && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <StatCard label="Times redeemed" value={coupon.redemptionCount ?? 0} icon="🎟️" />
          <StatCard
            label="Redemption limit"
            value={coupon.maxRedemptions ?? 'Unlimited'}
            hint={
              coupon.maxRedemptions
                ? `${Math.max(coupon.maxRedemptions - (coupon.redemptionCount ?? 0), 0)} remaining`
                : 'No cap set'
            }
            icon="∞"
          />
        </div>
      )}

      <Card>
        <Table
          columns={columns}
          data={redemptions}
          rowKey="id"
          emptyContent="Nobody has used this code yet."
          caption="Coupon redemptions"
        />
      </Card>
    </div>
  );
}
