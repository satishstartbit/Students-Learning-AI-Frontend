import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { ENERGY_LEVELS } from '../moods';
import regulationToolkitService from '../../student/services/regulationToolkit.service';
import StudentCheckInModal from '../components/StudentCheckInModal';
import { useTodayCheckIn } from '../hooks/useTodayCheckIn';
import { findMood } from '../moods';
import { describeNextPath, safeNextPath } from '../nextPath';

/**
 * /student/check-in for Grade 6+ - the standalone check-in.
 *
 * The check-in itself is the dialog (components/StudentCheckInModal.jsx), the
 * same one Home opens, so there is one form to keep in step rather than two.
 * This page opens it straight away when today has no check-in yet, and
 * otherwise shows what they said with a way back in.
 *
 * Optional at this age: RequireCheckIn only holds the kid band (KIDS_UI) at
 * the gate, so an older student comes here because they chose to, not because
 * a work screen sent them. Once checked in it offers a matched calming tool,
 * or straight on to wherever they were heading if something passed `?next=`.
 */
export default function CheckInPage() {
  const [params] = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const { checkedIn, checkIn, moods, isLoading } = useTodayCheckIn();

  // null means "nobody has opened or closed it yet", in which case the
  // default applies: with nothing recorded today, the dialog is already open
  // on arrival rather than hiding behind a button they came here to press.
  // Derived rather than synced from an effect, so the first paint is right.
  const [dialogChoice, setDialogChoice] = useState(null);
  const dialogOpen = dialogChoice ?? (!isLoading && !checkedIn);

  const recommendation = useApi(regulationToolkitService.getRecommendation);
  const { run } = recommendation;

  useEffect(() => {
    if (checkedIn) run().catch(() => {});
  }, [checkedIn, checkIn?.updatedAt, run]);

  const mood = findMood(moods, checkIn?.mood);
  const tool = recommendation.data?.tool ?? null;
  // A few to choose from (client: 2-3 at a time; how many is the admin's, Settings > Daily check-in).
  const suggestions = recommendation.data?.suggestions?.length ? recommendation.data.suggestions : tool ? [tool] : [];

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
        {checkedIn ? (
          <Card title="You're checked in" subtitle={mood ? `Feeling ${mood.name.toLowerCase()} today.` : undefined}>
            <p style={{ marginTop: 0 }}>
              Energy {checkIn.energy}/{ENERGY_LEVELS.length}
              {checkIn.availableMinutes != null ? ` · about ${checkIn.availableMinutes} min today` : ''}
              {checkIn.bodyAreas?.length ? ` · felt in your ${checkIn.bodyAreas.join(', ')}` : ''}
            </p>
            {checkIn.note && <p style={{ marginTop: 0 }}>&ldquo;{checkIn.note}&rdquo;</p>}

            <Button variant="secondary" size="sm" onClick={() => setDialogChoice(true)}>
              Change my check-in
            </Button>
          </Card>
        ) : (
          <Card title="Today's check-in" subtitle="Takes a few seconds, once a day.">
            <Button onClick={() => setDialogChoice(true)}>Check in</Button>
          </Card>
        )}

        {checkedIn && (
          <Card title="What might help" subtitle={suggestions.length ? 'Matched to how you said you feel.' : undefined}>
            {suggestions.length > 0 ? (
              <>
                <p style={{ marginTop: 0 }}>
                  {suggestions.length > 1 ? 'A few ideas for how you feel' : 'An idea for how you feel'} - try one in Focus,
                  pick something else, or skip straight to work.
                </p>
                <ul aria-label="Suggested calming tools" style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--spacing-md)', display: 'grid', gap: 'var(--spacing-xs)' }}>
                  {suggestions.map((s) => (
                    <li
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-surface-sunken)',
                      }}
                    >
                      {s.icon && <span aria-hidden="true">{s.icon}</span>}
                      <strong style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{s.name}</strong>
                      {s.durationMinutes ? (
                        <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                          {s.durationMinutes} min
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p style={{ marginTop: 0 }}>You&apos;re all set. Pick up where you left off.</p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
              <Button as={Link} to={next ?? '/student/assignments'}>
                {next ? `Continue to ${describeNextPath(next)}` : 'Go to my work'}
              </Button>
              {suggestions.length > 0 && !next?.startsWith('/student/focus') && (
                <Button as={Link} to="/student/focus" variant="secondary">
                  Try a calming tool first
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      <StudentCheckInModal isOpen={dialogOpen} onClose={() => setDialogChoice(false)} />
    </div>
  );
}
