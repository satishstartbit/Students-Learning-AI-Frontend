import { useState } from 'react';
import { DatePicker, Input, Select, Textarea } from '../../../components/common';
import { formatDateKey } from '../../../utils/date';
import FormSection from '../../assignments/components/FormSection';
import { PRIORITY_OPTIONS } from '../workForm';
import '../../assignments/components/assignmentForm.css';

/**
 * The work form's fields in the teacher assignment form's look (collapsible
 * sections with status chips, 2026-10-13: "same look, role-fitted fields").
 * Used by "Add work → Type it" (Grade 6+ students and parents) and the
 * student's own task. Teachers keep their full form; this is the same
 * Details + dates part, without roster, questions or audio.
 *
 *   values     { title, description, priority, subject, workType, minutes, startDate, dueDate }
 *   onChange(field, value)
 *   errors     { title?, minutes?, startDate?, dueDate? } (shown as given)
 *   minDate    the earliest day the pickers offer (today - no work on a day that has gone)
 *   subjectOptions, subjectsLoading, subjectHint, workTypeOptions, workTypesLoading
 *   forOptions [{ value, label }] + forValue + onForChange: a parent picks the child
 *   titleLabel / titlePlaceholder / titleRequired / autoFocus / maxMinutes
 */
const plainChip = (label, tone) => ({ label, tone });

export function WorkFormSections({
  values,
  onChange,
  errors = {},
  subjectOptions = [],
  subjectsLoading = false,
  subjectHint,
  subjectError,
  workTypeOptions = [],
  workTypesLoading = false,
  forOptions,
  forValue,
  onForChange,
  titleLabel = 'Title',
  titlePlaceholder = 'e.g. Finish worksheet 6.2',
  titleRequired = true,
  autoFocus = false,
  maxMinutes = 1440,
  extraDetails = null,
  minDate,
}) {
  const [open, setOpen] = useState({ for: true, details: true, dates: true });
  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));
  const set = (field) => (e) => onChange(field, e.target.value);

  const hasTitle = Boolean(values.title.trim()) || !titleRequired;
  const hasNotes = Boolean(values.description.trim());
  const detailsBad = errors.title;
  const datesBad = errors.minutes || errors.startDate || errors.dueDate;
  const dueMin = values.startDate && (!minDate || values.startDate > minDate) ? values.startDate : minDate;
  const chips = {
    for: plainChip(forOptions?.find((o) => o.value === forValue)?.label ?? 'Choose', forValue ? 'accent' : 'warning'),
    details: detailsBad
      ? plainChip('Needs a title', 'danger')
      : hasTitle && hasNotes
        ? plainChip('Complete', 'success')
        : hasTitle
          ? plainChip('Add instructions')
          : plainChip('Needs a title', 'warning'),
    dates: datesBad
      ? plainChip('Check these', 'danger')
      : values.dueDate
        ? plainChip(`Due ${formatDateKey(values.dueDate)}`, 'accent')
        : plainChip('No due date'),
  };

  return (
    <div className="af-sections pl-workform">
      {forOptions?.length > 1 && (
        <FormSection title="Who it’s for" description="The child this work goes to." chip={chips.for} open={open.for} onToggle={() => toggle('for')}>
          <Select label="Child" value={forValue} onChange={(e) => onForChange?.(e.target.value)} options={forOptions} />
        </FormSection>
      )}

      <FormSection title="Details" description="Name the work and say what it is about." chip={chips.details} open={open.details} onToggle={() => toggle('details')}>
        {extraDetails}
        <Input
          label={titleLabel}
          required={titleRequired}
          value={values.title}
          maxLength={200}
          onChange={set('title')}
          placeholder={titlePlaceholder}
          error={errors.title}
          autoFocus={autoFocus}
        />
        <Textarea label="Instructions" rows={3} maxLength={2000} value={values.description} onChange={set('description')} placeholder="What needs doing? Anything to remember?" />
        <Select label="Priority" value={values.priority} onChange={set('priority')} options={PRIORITY_OPTIONS} placeholder="Not set" />
      </FormSection>

      <FormSection title="Subject & dates" description="What it is for, when it is due and how long it takes." chip={chips.dates} open={open.dates} onToggle={() => toggle('dates')}>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Select
            label="Subject"
            value={values.subject}
            onChange={set('subject')}
            options={subjectOptions}
            placeholder="No subject"
            loading={subjectsLoading}
            hint={subjectHint}
            error={subjectError}
          />
          <Select label="Kind of work" value={values.workType} onChange={set('workType')} options={workTypeOptions} placeholder="Not sure" loading={workTypesLoading} />
        </div>
        <div className="grid gap-x-4 sm:grid-cols-3">
          <DatePicker label="Start date" value={values.startDate} onChange={set('startDate')} min={minDate || undefined} max={values.dueDate || undefined} error={errors.startDate} />
          <DatePicker label="Due date" value={values.dueDate} onChange={set('dueDate')} min={dueMin || undefined} error={errors.dueDate} />
          <Input
            label="Estimated time (minutes)"
            type="number"
            inputMode="numeric"
            min={1}
            max={maxMinutes}
            value={values.minutes}
            onChange={set('minutes')}
            error={errors.minutes}
          />
        </div>
      </FormSection>
    </div>
  );
}

export default WorkFormSections;
