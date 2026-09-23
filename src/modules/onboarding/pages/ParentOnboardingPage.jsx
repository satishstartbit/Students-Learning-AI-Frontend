import { useNavigate } from 'react-router-dom';
import { Card, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { useParentOnboarding } from '../../parent/hooks/useParentOnboarding';
import ParentFamilyForm from '../components/ParentFamilyForm';
import onboardingService from '../services/onboarding.service';

/**
 * /parent/onboarding - the parent's first-login family context form.
 * Required once (ParentLayout sends a parent here until it's done), built
 * independently of the Overview page, which will read this data when it
 * exists. Edited afterwards on My Profile.
 */
export default function ParentOnboardingPage() {
  const navigate = useNavigate();
  const { completed, refresh } = useParentOnboarding();
  const onboarding = useApi(onboardingService.getMyOnboarding, { immediate: true });

  const handleSaved = async () => {
    await refresh();
    toast.success('Thanks - your family details are saved');
    navigate(completed ? '/parent/profile' : '/parent/children', { replace: true });
  };

  return (
    <div className="td-page">
      <PageHeader
        title="Welcome! Tell us about your family"
        description="A few questions so teachers and your child's learning tools can support them the way that works at home. You can change these any time on My Profile."
      />

      {onboarding.isLoading && !onboarding.data && <Loader message="Loading…" />}
      {onboarding.error && !onboarding.data && (
        <ErrorState title="We couldn't load the form" error={onboarding.error} onRetry={() => onboarding.run().catch(() => {})} />
      )}
      {onboarding.data && (
        <Card>
          <ParentFamilyForm answers={onboarding.data.answers} submitLabel="Save and continue" onSaved={handleSaved} />
        </Card>
      )}
    </div>
  );
}
