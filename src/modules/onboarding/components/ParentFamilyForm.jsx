import { Alert, Button, MultiSelect, Textarea } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { required } from '../../../utils/validation';
import { useOnboardingLookup } from '../hooks/useOnboardingLookup';
import { HOMEWORK_HELPERS, asOptions } from '../options';
import onboardingService from '../services/onboarding.service';
import CheckboxGroup from './CheckboxGroup';
import SafetyNoticeCard from '../../../components/safety/SafetyNoticeCard';

function valuesFrom(answers) {
  return {
    homeworkHelpers: answers.homeworkHelpers ?? [],
    homeworkTimes: answers.homeworkTimes ?? [],
    goals: answers.goals ?? [],
    focusHelps: answers.focusHelps ?? '',
    upsetTriggers: answers.upsetTriggers ?? '',
    notesForTeachers: answers.notesForTeachers ?? '',
    familyContext: answers.familyContext ?? '',
    childContext: answers.childContext ?? '',
  };
}

/**
 * Family context - the parent onboarding answers. Used on its own at first
 * login (ParentOnboardingPage) and again on My Profile to edit them, so the
 * two can never drift. Saved to parent_profiles for a future Overview page to
 * read; nothing here depends on email, file storage or AI.
 */
export function ParentFamilyForm({ answers, submitLabel = 'Save', onSaved }) {
  const times = useOnboardingLookup('study_time');
  const goals = useOnboardingLookup('challenge_areas');

  const form = useForm({
    initialValues: valuesFrom(answers),
    validationSchema: {
      homeworkHelpers: [required('Choose at least one')],
    },
    async onSubmit(values) {
      const { data } = await onboardingService.saveParentOnboarding(values);
      await onSaved?.(data);
    },
  });

  return (
    <form onSubmit={form.handleSubmit} noValidate>
      {form.submitError && (
        <Alert variant="error" className="ui-field">
          {form.submitError}
        </Alert>
      )}

      <CheckboxGroup
        name="homeworkHelpers"
        label="Who helps with schoolwork at home?"
        options={asOptions(HOMEWORK_HELPERS)}
        value={form.values.homeworkHelpers}
        onChange={(next) => form.setFieldValue('homeworkHelpers', next)}
        error={form.touched.homeworkHelpers ? form.errors.homeworkHelpers : null}
        columns={1}
      />

      <MultiSelect
        name="homeworkTimes"
        label="When does homework usually happen?"
        hint={times.loading ? 'Loading…' : 'Pick all that apply'}
        options={times.options}
        value={form.values.homeworkTimes}
        onChange={(next) => form.setFieldValue('homeworkTimes', next)}
        disabled={times.loading}
      />

      <MultiSelect
        name="goals"
        label="What would you most like help with for your child?"
        hint={goals.loading ? 'Loading…' : 'Pick the ones that matter most'}
        options={goals.options}
        value={form.values.goals}
        onChange={(next) => form.setFieldValue('goals', next)}
        disabled={goals.loading}
        searchable
      />

      <Textarea
        label="What helps your child focus or calm down?"
        rows={3}
        hint="e.g. a snack first, a quiet corner, knowing how long something will take"
        {...form.getFieldProps('focusHelps')}
      />
      <Textarea
        label="What tends to upset or frustrate them?"
        rows={3}
        {...form.getFieldProps('upsetTriggers')}
      />
      <Textarea
        label="Anything their teachers should know?"
        rows={3}
        {...form.getFieldProps('notesForTeachers')}
      />
      <Textarea
        label="About your family"
        rows={3}
        hint="Anything about your family setup that helps us support your child"
        {...form.getFieldProps('familyContext')}
      />
      <Textarea label="About your child" rows={3} {...form.getFieldProps('childContext')} />

      {/* Phase 1 §4: parents are told how their child's writing is screened and when they're alerted. */}
      <SafetyNoticeCard audience="parent" className="ui-field" />

      <Button type="submit" loading={form.isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}

export default ParentFamilyForm;
