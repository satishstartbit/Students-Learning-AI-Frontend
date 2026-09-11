import { useCallback, useState } from 'react';
import { Card, Button, Badge, Alert, Loader, EmptyState, StatCard } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import rewardService from '../services/reward.service';

/**
 * Points earned and rewards to redeem them for. Grade 6+ only - the K-5
 * equivalent is still "coming soon" (KidComingSoonPage).
 */
export default function RewardsPage() {
  const summary = useApi(rewardService.getSummary, { immediate: true });
  const catalog = useApi(rewardService.listCatalog, { immediate: true });
  const [redeemingId, setRedeemingId] = useState(null);

  const reloadSummary = useCallback(() => summary.run().catch(() => {}), [summary]);

  const totalPoints = summary.data?.totalPoints ?? 0;
  const recent = summary.data?.recent ?? [];
  const rewards = catalog.data ?? [];

  const handleRedeem = async (reward) => {
    setRedeemingId(reward.id);
    try {
      await rewardService.redeemReward(reward.id);
      toast.success(`${reward.name} unlocked!`);
      reloadSummary();
    } catch (err) {
      toast.error(err?.message ?? 'Could not redeem that reward right now.');
    } finally {
      setRedeemingId(null);
    }
  };

  if (summary.isLoading && !summary.data) return <Loader message="Loading your rewards…" />;

  return (
    <>
      <div className="ui-pageheader">
        <div>
          <h1 className="ui-pageheader__title">Rewards</h1>
          <p className="ui-pageheader__description">Points for the work you put in - trade them in whenever you like.</p>
        </div>
      </div>

      {summary.error && (
        <Alert variant="error" className="ui-field">
          {summary.error.message}
        </Alert>
      )}

      <StatCard label="Your points" value={totalPoints} icon="🏆" className="ui-field" />

      <h2 className="ui-sectionheader__title" style={{ marginBottom: 'var(--spacing-md)' }}>
        Trade in your points
      </h2>

      {catalog.isLoading && !catalog.data ? (
        <Loader message="Loading rewards…" />
      ) : rewards.length === 0 ? (
        <EmptyState
          icon="🎁"
          title="No rewards yet"
          description="Ask your teacher or parent to add some rewards to trade points for."
          className="ui-field"
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          {rewards.map((reward) => {
            const affordable = totalPoints >= reward.pointsCost;
            return (
              <Card key={reward.id} title={reward.name} subtitle={reward.description}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-sm)' }}>
                  <Badge variant="primary">{reward.pointsCost} pts</Badge>
                  <Button
                    size="sm"
                    variant={affordable ? 'primary' : 'secondary'}
                    disabled={!affordable}
                    loading={redeemingId === reward.id}
                    onClick={() => handleRedeem(reward)}
                  >
                    {affordable ? 'Redeem' : 'Not enough yet'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="ui-sectionheader__title" style={{ marginBottom: 'var(--spacing-md)' }}>
        Recent activity
      </h2>

      {recent.length === 0 ? (
        <p className="ui-hint">Nothing yet - complete a task or a focus session to start earning.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {recent.map((item) => (
            <li
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-surface)',
              }}
            >
              <span>{item.description || item.activityName || 'Points activity'}</span>
              <strong style={{ color: item.points >= 0 ? 'var(--color-success-fg)' : 'var(--color-text-secondary)' }}>
                {item.points >= 0 ? '+' : ''}
                {item.points}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
