import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorState,
  Loader,
  MultiSelect,
  PageHeader,
  Radio,
  Select,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { required } from '../../../utils/validation';
import { useStudentExperience } from '../../student/hooks/useStudentExperience';
import CheckboxGroup from '../components/CheckboxGroup';
import { useOnboardingLookup } from '../hooks/useOnboardingLookup';
import { DISTRACTIONS, FOCUS_HELPERS, LEARN_BEST_BY, TASK_APPROACH, WORK_WITH, asOptions } from '../options';
import onboardingService from '../services/onboarding.service';
import SafetyNoticeCard from '../../../components/safety/SafetyNoticeCard';

function valuesFrom(answers) {
  const prefs = answers.learningPreferences;
  return {
    grade: answers.grade ?? '',
    subjects: answers.subjects,
    interests: answers.interests,
    strengths: answers.strengths,
    challenges: answers.challenges,
    focusDuration: prefs.focusDuration ?? '',
    bestStudyTimes: prefs.bestStudyTimes,
    focusHelpers: prefs.focusHelpers,
    distractions: prefs.distractions,
    workWith: prefs.workWith ?? '',
    learnBestBy: prefs.learnBestBy,
    taskApproach: prefs.taskApproach ?? '',
  };
}

function MasterMulti({ type, form, name, label, hint }) {
  const { options, loading } = useOnboardingLookup(type);
  return (
    <MultiSelect
      name={name}
      label={label}
      hint={loading ? 'Loading…' : hint}
      options={options}
      value={form.values[name]}
      onChange={(next) => form.setFieldValue(name, next)}
      disabled={loading}
      searchable
    />
  );
}

function StudentOnboardingForm({ onboarding, onSaved }) {
  const { gradeLocked, completed } = onboarding;
  const grades = useOnboardingLookup('grade_levels');
  const durations = useOnboardingLookup('focus_duration');

  const form = useForm({
    initialValues: valuesFrom(onboarding.answers),
    validationSchema: {
      ...(gradeLocked ? {} : { grade: [required('Choose your grade')] }),
      focusDuration: [required('Choose how long you can usually focus')],
      workWith: [required('Choose how you like to work')],
    },
    async onSubmit(values) {
      const { data } = await onboardingService.saveStudentOnboarding({
        ...(gradeLocked ? {} : { grade: values.grade }),
        subjects: values.subjects,
        interests: values.interests,
        strengths: values.strengths,
        challenges: values.challenges,
        learningPreferences: {
          focusDuration: values.focusDuration,
          bestStudyTimes: values.bestStudyTimes,
          focusHelpers: values.focusHelpers,
          distractions: values.distractions,
          workWith: values.workWith,
          learnBestBy: values.learnBestBy,
          taskApproach: values.taskApproach || null,
        },
      });
      await onSaved(data, { firstTime: !completed });
    },
  });

  const listProps = (name) => ({
    name,
    value: form.values[name],
    onChange: (next) => form.setFieldValue(name, next),
    error: form.touched[name] ? form.errors[name] : null,
  });

  return (
    <form onSubmit={form.handleSubmit} noValidate>
      {form.submitError && (
        <Alert variant="error" className="ui-field">
          {form.submitError}
        </Alert>
      )}

      <Card title="About you" subtitle="Your grade and the subjects you're taking." className="ui-field">
        {gradeLocked ? (
          <p style={{ marginTop: 0 }}>
            Grade: <Badge variant="neutral">{onboarding.answers.grade}</Badge>{' '}
            <span className="ui-hint">Set by your parent - ask them if it&apos;s wrong.</span>
          </p>
        ) : (
          <Select
            label="Grade"
            required
            options={grades.options}
            loading={grades.loading}
            {...form.getFieldProps('grade')}
          />
        )}
        <MasterMulti type="subjects" form={form} name="subjects" label="Subjects" hint="Pick all that apply" />
      </Card>

      <Card title="What you're into" subtitle="Helps make examples and tasks feel relevant." className="ui-field">
        <MasterMulti type="interest_categories" form={form} name="interests" label="Interests" />
        <MasterMulti type="strength_areas" form={form} name="strengths" label="Things you're good at" />
        <MasterMulti type="challenge_areas" form={form} name="challenges" label="Things that feel harder" />
      </Card>

      <Card title="Focus habits" subtitle="There are no wrong answers - it's about what works for you." className="ui-field">
        <Select
          label="How long can you usually focus before needing a break?"
          required
          options={durations.options}
          loading={durations.loading}
          {...form.getFieldProps('focusDuration')}
        />
        <MasterMulti type="study_time" form={form} name="bestStudyTimes" label="When do you do your best work?" />
        <CheckboxGroup label="What helps you focus?" options={asOptions(FOCUS_HELPERS)} {...listProps('focusHelpers')} />
        <CheckboxGroup label="What usually distracts you?" options={asOptions(DISTRACTIONS)} {...listProps('distractions')} />
      </Card>

      <Card title="How you like to work" className="ui-field">
        <Radio
          label="Who do you like to work with?"
          required
          direction="row"
          options={asOptions(WORK_WITH)}
          {...form.getFieldProps('workWith')}
        />
        <CheckboxGroup label="How do you learn best?" options={asOptions(LEARN_BEST_BY)} columns={1} {...listProps('learnBestBy')} />
        <Radio
          label="How do you like to tackle a big task?"
          options={asOptions(TASK_APPROACH)}
          {...form.getFieldProps('taskApproach')}
        />
      </Card>

      {/* Phase 1 §4: students are told their writing is checked for safety. */}
      <SafetyNoticeCard audience="student" className="ui-field" />

      <Button type="submit" loading={form.isSubmitting}>
        {completed ? 'Save changes' : 'Finish'}
      </Button>
    </form>
  );
}

/**
 * /student/onboarding for Grade 6+ - the first-login questionnaire, and the
 * same form for editing it later from Settings. Required once: the student
 * layout sends a student here until it has been completed.
 */
export default function StudentOnboardingPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useStudentExperience();
  const onboarding = useApi(onboardingService.getMyOnboarding, { immediate: true });

  const handleSaved = async (data, { firstTime }) => {
    if (firstTime) {
      // The layout's onboarding gate reads the profile - refresh it before
      // leaving, or it would send the student straight back here.
      await refreshProfile();
      toast.success("Thanks - you're all set up!");
      navigate('/student/check-in', { replace: true });
    } else {
      toast.success('Your answers are saved');
      navigate('/student/settings');
    }
  };

  const completed = onboarding.data?.completed;

  return (
    <div className="td-page">
      <PageHeader
        title={completed ? 'My learning profile' : 'Welcome! Tell us about you'}
        description={
          completed
            ? 'Update how you like to learn and work - change anything, any time.'
            : "A few quick questions so your tasks and tools can fit how you work. Takes about two minutes."
        }
      />

      {onboarding.isLoading && !onboarding.data && <Loader message="Loading…" />}
      {onboarding.error && !onboarding.data && (
        <ErrorState title="We couldn't load your questions" error={onboarding.error} onRetry={() => onboarding.run().catch(() => {})} />
      )}
      {onboarding.data && <StudentOnboardingForm onboarding={onboarding.data} onSaved={handleSaved} />}
    </div>
  );
}
