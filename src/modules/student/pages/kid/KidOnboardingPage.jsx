import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { useApi } from '../../../../hooks/useApi';
import { useAuth } from '../../../../hooks/useAuth';
import { toast } from '../../../../hooks/useToast';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { useOnboardingLookup } from '../../../onboarding/hooks/useOnboardingLookup';
import { FOCUS_HELPERS, LEARN_BEST_BY, WORK_WITH, asOptions } from '../../../onboarding/options';
import onboardingService from '../../../onboarding/services/onboarding.service';
import { useStudentExperience } from '../../hooks/useStudentExperience';
import { KidButton } from '../../components/kid/KidButton';
import { KidChoiceChips } from '../../components/kid/KidChoiceChips';
import { StarIcon } from '../../components/kid/KidIcons';
import { KidOops, KidSkeleton } from '../../components/kid/KidStates';
import { PaperCard } from '../../components/kid/PaperKit';

/** A question whose answers come from a Master Management list. */
function MasterStep({ type, name, legend, multiple, value, onChange }) {
  const { options, loading } = useOnboardingLookup(type);
  if (loading) return <KidSkeleton className="h-48" />;
  return <KidChoiceChips name={name} legend={legend} options={options} value={value} onChange={onChange} multiple={multiple} />;
}

/**
 * The K-5 questions, one per screen. `required` steps can't be skipped (the
 * backend needs them); the rest have a "Skip" so a young student never gets
 * stuck on a question they can't answer.
 */
const STEPS = [
  { key: 'interests', title: 'What do you like?', hint: 'Pick as many as you want.', master: 'interest_categories', multiple: true },
  { key: 'subjects', title: 'What do you learn at school?', hint: 'Pick as many as you want.', master: 'subjects', multiple: true },
  { key: 'strengths', title: 'What are you good at?', hint: 'Pick as many as you want.', master: 'strength_areas', multiple: true },
  { key: 'challenges', title: 'What feels tricky?', hint: "It's okay - everyone has tricky things.", master: 'challenge_areas', multiple: true },
  { key: 'focusDuration', title: 'How long can you focus?', hint: 'Before you need a little break.', master: 'focus_duration', required: true },
  { key: 'focusHelpers', title: 'What helps you focus?', hint: 'Pick as many as you want.', fixed: FOCUS_HELPERS, multiple: true },
  { key: 'workWith', title: 'Who do you like to work with?', fixed: WORK_WITH, required: true },
  { key: 'learnBestBy', title: 'How do you learn best?', hint: 'Pick as many as you want.', fixed: LEARN_BEST_BY, multiple: true },
];

function answersToState(answers) {
  const prefs = answers.learningPreferences;
  return {
    interests: answers.interests,
    subjects: answers.subjects,
    strengths: answers.strengths,
    challenges: answers.challenges,
    focusDuration: prefs.focusDuration ?? '',
    focusHelpers: prefs.focusHelpers,
    workWith: prefs.workWith ?? '',
    learnBestBy: prefs.learnBestBy,
  };
}

function KidOnboardingFlow({ onboarding, onSaved }) {
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(-1); // -1 = the hello screen
  const [state, setState] = useState(() => answersToState(onboarding.answers));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const answered = step ? (step.multiple ? state[step.key].length > 0 : Boolean(state[step.key])) : true;

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const prefs = onboarding.answers.learningPreferences;
      const { data } = await onboardingService.saveStudentOnboarding({
        subjects: state.subjects,
        interests: state.interests,
        strengths: state.strengths,
        challenges: state.challenges,
        learningPreferences: {
          // Grade 6+ questions a K-5 student isn't asked keep whatever was there.
          bestStudyTimes: prefs.bestStudyTimes,
          distractions: prefs.distractions,
          taskApproach: prefs.taskApproach ?? null,
          focusDuration: state.focusDuration,
          focusHelpers: state.focusHelpers,
          workWith: state.workWith,
          learnBestBy: state.learnBestBy,
        },
      });
      await onSaved(data, { firstTime: !onboarding.completed });
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  const goNext = () => (isLast ? save() : setStepIndex((i) => i + 1));

  if (stepIndex === -1) {
    return (
      <PaperCard tone="sheet" className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:px-12">
        <StarIcon className="size-20" />
        <h1 className="font-kid-display text-3xl font-semibold text-kid-ink sm:text-4xl">
          {onboarding.completed ? 'Change your answers' : `Hi ${user?.firstName ?? 'there'}!`}
        </h1>
        <p className="max-w-md text-lg text-kid-ink-soft">
          {onboarding.completed
            ? 'You can change any answer. Tap Next to go through them.'
            : "Let's get to know you! A few quick questions - just tap the answers."}
        </p>
        {onboarding.answers.grade && (
          <p className="rounded-full bg-kid-sky px-4 py-1 font-kid-display text-lg text-kid-navy">
            You&apos;re in {onboarding.answers.grade}
          </p>
        )}
        <KidButton className="mt-2" onClick={() => setStepIndex(0)}>
          Let&apos;s start!
          <LuArrowRight className="size-6" aria-hidden="true" />
        </KidButton>
      </PaperCard>
    );
  }

  const options = step.fixed ? asOptions(step.fixed, { kid: true }) : null;
  const setValue = (next) => setState((s) => ({ ...s, [step.key]: next }));

  return (
    <PaperCard as="section" aria-labelledby="kid-onboarding-question" tone="sheet" className="px-5 py-7 sm:px-9">
      <ol aria-label={`Question ${stepIndex + 1} of ${STEPS.length}`} className="mb-5 flex justify-center gap-2">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            aria-hidden="true"
            className={cn('size-3 rounded-full', i <= stepIndex ? 'bg-kid-teal' : 'bg-kid-paper-deep')}
          />
        ))}
      </ol>

      <h1 id="kid-onboarding-question" className="text-center font-kid-display text-3xl font-semibold text-kid-ink">
        {step.title}
      </h1>
      {step.hint && <p className="mt-1 text-center text-lg text-kid-ink-soft">{step.hint}</p>}

      <div className="mt-6">
        {step.master ? (
          <MasterStep
            key={step.key}
            type={step.master}
            name={step.key}
            legend={step.title}
            multiple={step.multiple}
            value={state[step.key]}
            onChange={setValue}
          />
        ) : (
          <KidChoiceChips
            key={step.key}
            name={step.key}
            legend={step.title}
            options={options}
            multiple={step.multiple}
            value={state[step.key]}
            onChange={setValue}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-2xl bg-kid-coral-soft px-4 py-3 text-center font-kid-body text-kid-coral">
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <KidButton variant="soft" size="md" onClick={() => setStepIndex((i) => i - 1)} disabled={busy}>
          <LuArrowLeft className="size-5" aria-hidden="true" />
          Back
        </KidButton>

        <div className="flex items-center gap-3">
          {!step.required && !answered && (
            <button
              type="button"
              onClick={goNext}
              disabled={busy}
              className="min-h-11 rounded-full px-4 font-kid-display text-lg text-kid-ink-soft underline decoration-dotted hover:text-kid-ink"
            >
              Skip
            </button>
          )}
          <KidButton size="md" onClick={goNext} disabled={busy || (step.required && !answered)}>
            {busy ? 'Saving…' : isLast ? 'All done!' : 'Next'}
            {!busy && <LuArrowRight className="size-5" aria-hidden="true" />}
          </KidButton>
        </div>
      </div>
    </PaperCard>
  );
}

/**
 * K-5 /student/onboarding - "Let's get to know you", one tap-to-answer
 * question per screen. Required once (the student layout sends a student
 * here until it's done); reopened from Settings to change answers.
 */
export default function KidOnboardingPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useStudentExperience();
  const onboarding = useApi(onboardingService.getMyOnboarding, { immediate: true });

  const handleSaved = async (data, { firstTime }) => {
    if (firstTime) {
      await refreshProfile();
      navigate('/student/check-in', { replace: true });
    } else {
      toast.success('Your answers are saved!');
      navigate('/student/settings');
    }
  };

  return (
    <div data-kid-page className="kid-ui min-h-full">
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-8">
        {onboarding.isLoading && !onboarding.data && <KidSkeleton className="h-80" />}
        {onboarding.error && !onboarding.data && (
          <KidOops message="We couldn't load your questions." onRetry={() => onboarding.run().catch(() => {})} />
        )}
        {onboarding.data && <KidOnboardingFlow onboarding={onboarding.data} onSaved={handleSaved} />}
      </div>
    </div>
  );
}
