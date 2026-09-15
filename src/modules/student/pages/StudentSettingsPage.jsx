import { Link } from 'react-router-dom';
import { Badge, Button, Card, PageHeader } from '../../../components/common';
import { useTodayCheckIn } from '../../checkIn/hooks/useTodayCheckIn';
import { findMood } from '../../checkIn/moods';
import { useStudentExperience } from '../hooks/useStudentExperience';

/**
 * /student/settings for Grade 6+ (K-5 has KidSettingsPage) - reached from the
 * account menu's "Account" item. Where a student reopens their onboarding
 * answers and changes today's check-in.
 */
export default function StudentSettingsPage() {
  const { profile, grade } = useStudentExperience();
  const { checkIn } = useTodayCheckIn();
  const mood = findMood(checkIn?.mood);

  return (
    <>
      <PageHeader title="Settings" description="Your learning profile and today's check-in." />

      <Card
        title="My learning profile"
        subtitle="What you told us about how you like to learn and work."
        className="ui-field"
        actions={
          <Button as={Link} to="/student/onboarding" variant="secondary" size="sm">
            Edit my answers
          </Button>
        }
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          {grade && <Badge variant="neutral">{grade}</Badge>}
          {profile?.subjects && <span className="ui-hint">Subjects: {profile.subjects}</span>}
        </div>
      </Card>

      <Card
        title="Today's check-in"
        actions={
          <Button as={Link} to="/student/check-in" variant="secondary" size="sm">
            {checkIn ? 'Change' : 'Check in'}
          </Button>
        }
      >
        {checkIn ? (
          <p style={{ margin: 0 }}>
            <span aria-hidden="true">{mood?.emoji}</span> {mood?.label} · Energy {checkIn.energy}/5
            {checkIn.availableMinutes != null ? ` · ${checkIn.availableMinutes} min` : ''}
          </p>
        ) : (
          <p className="ui-hint" style={{ margin: 0 }}>
            You haven&apos;t checked in yet today.
          </p>
        )}
      </Card>
    </>
  );
}
