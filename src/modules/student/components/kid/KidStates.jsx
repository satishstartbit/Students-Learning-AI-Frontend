import { LuRotateCcw } from 'react-icons/lu';
import { useOnlineStatus, useRetryWhenReconnected } from '../../../../hooks/useConnection';
import { cn } from '../../../../lib/utils';
import { classifyError, ERROR_KINDS } from '../../../../utils/errorKind';
import { KidButton } from './KidButton';
import { MoodFace } from './MoodFace';

/** Loading placeholder in the shape of what's coming - no spinner to stare at. */
export function KidSkeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-3xl bg-kid-paper-deep/80', className)} />;
}

/**
 * Something didn't load. Gentle wording, and one clear way to try again.
 * With no internet (or `error` saying our server is down) it says so in
 * kid words and loads again by itself once the connection is back.
 */
export function KidOops({ message = "We couldn't load this right now.", onRetry, className, error }) {
  const online = useOnlineStatus();
  const kind = classifyError(error, { online });
  const waiting = kind === ERROR_KINDS.OFFLINE || kind === ERROR_KINDS.UNREACHABLE;
  useRetryWhenReconnected(waiting, onRetry);

  const words =
    kind === ERROR_KINDS.OFFLINE
      ? { connection: true, title: 'No internet right now', text: 'Ask a grown-up to check the Wi-Fi. This will come back by itself when it works again.' }
      : kind === ERROR_KINDS.UNREACHABLE || kind === ERROR_KINDS.SERVER || kind === ERROR_KINDS.MAINTENANCE || kind === ERROR_KINDS.TIMEOUT
        ? { connection: true, title: 'Our side needs a minute', text: 'It isn’t anything you did. Let’s try again in a little while.' }
        : { title: 'Oops!', text: message };

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-2 rounded-3xl bg-kid-sheet px-6 py-8 text-center shadow-paper',
        className
      )}
    >
      {/* A sleepy face for "wait for the connection", not a cross one. */}
      <MoodFace mood={words.connection ? 'tired' : 'tense'} className="size-14" />
      <p className="mt-1 font-kid-display text-2xl font-semibold text-kid-ink">{words.title}</p>
      <p className="text-lg text-kid-ink-soft">{words.text}</p>
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
        'flex flex-col items-center gap-2 rounded-3xl bg-kid-paper-deep/40 px-6 py-10 text-center',
        className
      )}
    >
      {Icon && <Icon className="size-16" />}
      <p className="mt-2 font-kid-display text-2xl font-semibold text-kid-ink">{title}</p>
      {children && <p className="max-w-md text-lg text-kid-ink-soft">{children}</p>}
    </div>
  );
}
