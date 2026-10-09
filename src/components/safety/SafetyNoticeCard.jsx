import { LuShieldCheck } from 'react-icons/lu';
import { useSafetyContent } from './useSafetyContent';
import './safety.css';

/**
 * "Keeping you safe" - what students and parents are told during onboarding
 * about safety monitoring (Phase 1 §4: "students and parents are informed
 * during onboarding that messages are monitored for safety"). The words are
 * the admin's (Platform settings > Safety monitoring).
 *
 * audience: 'student' (Grade 5+), 'kid' (K-4), 'parent'.
 * variant:  'card' (portal / Grade 5+ look) or 'kid' (the K-4 paper look).
 */
export function SafetyNoticeCard({ audience, variant = 'card', className = '' }) {
  const content = useSafetyContent();
  const notice = content?.notices?.[audience];
  if (!notice?.body) return null;

  if (variant === 'kid') {
    return (
      <section
        aria-label={notice.title || 'Keeping you safe'}
        className={`flex items-start gap-3 rounded-2xl bg-kid-sky px-4 py-3 text-left text-kid-navy ${className}`.trim()}
      >
        <LuShieldCheck className="mt-0.5 size-7 shrink-0" aria-hidden="true" />
        <span>
          {notice.title && <span className="block font-kid-display text-xl font-semibold">{notice.title}</span>}
          <span className="block font-kid-body text-lg leading-snug">{notice.body}</span>
        </span>
      </section>
    );
  }

  return (
    <section aria-label={notice.title || 'Keeping you safe'} className={`sf-card ${className}`.trim()}>
      <span className="sf-notice__icon" aria-hidden="true">
        <LuShieldCheck />
      </span>
      <span className="min-w-0">
        {notice.title && <p className="sf-card__title">{notice.title}</p>}
        <p className="sf-card__body">{notice.body}</p>
      </span>
    </section>
  );
}

export default SafetyNoticeCard;
