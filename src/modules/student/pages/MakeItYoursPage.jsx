import { PageHeader, EmptyState } from '../../../components/common';

/**
 * /student/make-it-yours - placeholder. No personalization feature exists
 * yet (theme colour, avatar, sticker style, ...); this reserves the nav slot
 * and route so the sidebar matches the reference design ahead of that work.
 */
export default function MakeItYoursPage() {
  return (
    <>
      <PageHeader title="Make it yours" description="Personalize how your learning space looks." />
      <EmptyState
        icon="🎨"
        title="Coming soon"
        description="Ways to personalize your space - like a theme colour or avatar - are on the way."
      />
    </>
  );
}
