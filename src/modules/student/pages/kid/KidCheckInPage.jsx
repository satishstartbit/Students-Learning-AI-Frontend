import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LuArrowRight } from 'react-icons/lu';
import { useApi } from '../../../../hooks/useApi';
import { useTodayCheckIn } from '../../../checkIn/hooks/useTodayCheckIn';
import { describeNextPath, safeNextPath } from '../../../checkIn/nextPath';
import regulationToolkitService from '../../services/regulationToolkit.service';
import { CheckInCard } from '../../components/kid/CheckInCard';
import { KidButton } from '../../components/kid/KidButton';
import { KidPageHeader } from '../../components/kid/KidPageHeader';
import { MoodFace } from '../../components/kid/MoodFace';
import { PaperCard } from '../../components/kid/PaperKit';

const CheckInIcon = (props) => <MoodFace mood="ready_to_focus" {...props} />;

/**
 * K-5 /student/check-in - where every work screen sends a student who hasn't
 * checked in yet (checkIn/components/RequireCheckIn.jsx). One card to fill
 * in, then one big button back to what they were doing.
 */
export default function KidCheckInPage() {
  const [params] = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const { checkedIn, checkIn } = useTodayCheckIn();

  const recommendation = useApi(regulationToolkitService.getRecommendation);
  const { run } = recommendation;

  useEffect(() => {
    if (checkedIn) run().catch(() => {});
  }, [checkedIn, checkIn?.updatedAt, run]);

  const tool = recommendation.data?.tool ?? null;

  return (
    <div data-kid-page className="kid-ui min-h-full">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-10 pt-4 sm:px-8">
        <KidPageHeader
          icon={CheckInIcon}
          title="Check in"
          subtitle={next && !checkedIn ? `Check in first, then ${describeNextPath(next, { kid: true })}!` : 'How are you right now?'}
        />

        <CheckInCard />

        {checkedIn && (
          <PaperCard as="section" aria-label="Ready to go" tone="sheet" className="flex flex-col items-center gap-4 px-6 py-7 text-center">
            <p className="font-kid-display text-2xl font-semibold text-kid-ink">You&apos;re all checked in!</p>

            {tool && (
              <p className="text-lg text-kid-ink-soft">
                Need a minute first? Try <strong className="text-kid-ink">{tool.name}</strong> in{' '}
                <Link to="/student/focus" className="font-semibold text-kid-teal">
                  Focus time
                </Link>
                .
              </p>
            )}

            <KidButton asChild className="w-full max-w-sm">
              <Link to={next ?? '/student'}>
                Let&apos;s go!
                <LuArrowRight className="size-6" aria-hidden="true" />
              </Link>
            </KidButton>
          </PaperCard>
        )}
      </div>
    </div>
  );
}
