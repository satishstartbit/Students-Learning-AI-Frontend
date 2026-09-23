import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import StudentCheckInCard from '../../student/components/StudentCheckInCard';
import regulationToolkitService from '../../student/services/regulationToolkit.service';
import { useTodayCheckIn } from '../hooks/useTodayCheckIn';
import { findMood } from '../moods';
import { describeNextPath, safeNextPath } from '../nextPath';

/**
 * /student/check-in for Grade 6+ - the standalone check-in.
 *
 * Optional at this age: RequireCheckIn only holds the kid band (KIDS_UI) at
 * the gate, so an older student comes here because they chose to, not
 * because a work screen sent them. Same card as My Day; once checked in it
 * offers a matched calming tool, or straight on to wherever they were
 * heading if something did pass `?next=`.
 */
export default function CheckInPage() {
  const [params] = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const { checkedIn, checkIn, moods } = useTodayCheckIn();

  const recommendation = useApi(regulationToolkitService.getRecommendation);
  const { run } = recommendation;

  useEffect(() => {
    if (checkedIn) run().catch(() => {});
  }, [checkedIn, checkIn?.updatedAt, run]);

  const mood = findMood(moods, checkIn?.mood);
  const tool = recommendation.data?.tool ?? null;

  return (
    <div className="td-page">
      <PageHeader
        title="Check in"
        description="How are you arriving today? It takes a few seconds and helps suggest what might help."
      />

      {!checkedIn && next && (
        <Alert variant="info" className="ui-field">
          Check in first - then you&apos;ll go straight on to {describeNextPath(next)}.
        </Alert>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--spacing-lg)',
          alignItems: 'start',
        }}
      >
        <StudentCheckInCard />

        {checkedIn && (
          <Card title="You're checked in" subtitle={mood ? `Feeling ${mood.name.toLowerCase()} today.` : undefined}>
            {tool ? (
              <p style={{ marginTop: 0 }}>
                Suggested for how you feel: <strong>{tool.name}</strong>
                {tool.durationMinutes ? ` (${tool.durationMinutes} min)` : ''}. You can try it in Focus, pick a
                different tool, or skip straight to work.
              </p>
            ) : (
              <p style={{ marginTop: 0 }}>You&apos;re all set. Pick up where you left off.</p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
              <Button as={Link} to={next ?? '/student/assignments'}>
                {next ? `Continue to ${describeNextPath(next)}` : 'Go to my work'}
              </Button>
              {tool && !next?.startsWith('/student/focus') && (
                <Button as={Link} to="/student/focus" variant="secondary">
                  Try a calming tool first
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
