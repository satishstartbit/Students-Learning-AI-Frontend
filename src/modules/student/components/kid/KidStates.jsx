import { LuRotateCcw } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { KidButton } from './KidButton';
import { MoodFace } from './MoodFace';

/** Loading placeholder in the shape of what's coming - no spinner to stare at. */
export function KidSkeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-3xl bg-kid-paper-deep/80', className)} />;
}

/** Something didn't load. Gentle wording, and one clear way to try again. */
export function KidOops({ message = "We couldn't load this right now.", onRetry, className }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-2 rounded-3xl bg-kid-sheet px-6 py-8 text-center shadow-paper',
        className
      )}
    >
      <MoodFace mood="worried" className="size-14" />
      <p className="mt-1 font-kid-display text-2xl font-semibold text-kid-ink">Oops!</p>
      <p className="text-lg text-kid-ink-soft">{message}</p>
      {onRetry && (
        <KidButton variant="soft" size="md" className="mt-3" onClick={onRetry}>
          <LuRotateCcw className="size-5" aria-hidden="true" />
          Try again
        </KidButton>
      )}
    </div>
  );
}

/** Nothing here - said kindly, with a picture. */
export function KidEmpty({ icon: Icon, title, children, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-kid-edge px-6 py-10 text-center',
        className
      )}
    >
      {Icon && <Icon className="size-16" />}
      <p className="mt-2 font-kid-display text-2xl font-semibold text-kid-ink">{title}</p>
      {children && <p className="max-w-md text-lg text-kid-ink-soft">{children}</p>}
    </div>
  );
}
