import { Link } from 'react-router-dom';
import { LuArrowLeft } from 'react-icons/lu';
import { KidButton } from '../../components/kid/KidButton';
import { StarIcon } from '../../components/kid/KidIcons';
import { PaperCard } from '../../components/kid/PaperKit';

const FEATURES = {
  rewards: {
    icon: StarIcon,
    title: 'Rewards',
    tone: 'yellow',
    text: 'Stars and stickers for all your hard work are on their way.',
  },
};

/**
 * A friendly stand-in for K-5 pages whose backend isn't built yet (Focus,
 * Rewards) - so a young student never lands on a developer placeholder.
 */
export default function KidComingSoonPage({ feature }) {
  const { icon: Icon, title, tone, text } = FEATURES[feature] ?? FEATURES.rewards;

  return (
    <div data-kid-page className="kid-ui mx-auto max-w-2xl px-4 py-10 sm:px-8 lg:py-16">
      <PaperCard tone={tone} className="flex flex-col items-center gap-3 px-6 py-12 text-center sm:px-12">
        <Icon className="size-20" />
        <h1 className="mt-2 font-kid-display text-4xl font-semibold text-kid-ink">{title}</h1>
        <p className="font-kid-hand text-3xl text-kid-ink">Coming soon!</p>
        <p className="max-w-md text-lg text-kid-ink-soft">{text}</p>
        <KidButton asChild variant="soft" size="md" className="mt-4">
          <Link to="/student">
            <LuArrowLeft className="size-5" aria-hidden="true" />
            Back to Home
          </Link>
        </KidButton>
      </PaperCard>
    </div>
  );
}
