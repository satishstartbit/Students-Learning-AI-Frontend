/**
 * Pure parts of the shared work form (components/WorkFormSections.jsx): the
 * empty values, the teacher form's priority options, field problems, and
 * the body each API takes.
 */
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

/** Form values from nothing, a default due date, or a saved own task. */
export function initialWorkValues({ task = null, defaultDueDate = '' } = {}) {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? '',
    subject: task?.subject ?? '',
    workType: task?.workType ?? '',
    minutes: task?.estimatedMinutes ? String(task.estimatedMinutes) : '',
    startDate: task?.startDate ?? '',
    dueDate: task?.dueDate ?? defaultDueDate ?? '',
  };
}

/** Field problems (shown once the person tries to save); null = fine. */
export function workFormErrors(values, { titleRequired = true, maxMinutes = 1440 } = {}) {
  const minutes = values.minutes === '' ? null : Number(values.minutes);
  return {
    title: titleRequired && !values.title.trim() ? 'Give the work a title' : null,
    minutes: minutes !== null && !(Number.isInteger(minutes) && minutes >= 1 && minutes <= maxMinutes) ? `Whole minutes, 1 to ${maxMinutes}` : null,
    startDate: values.startDate && values.dueDate && values.startDate > values.dueDate ? 'On or before the due date' : null,
  };
}

export const hasErrors = (errors) => Object.values(errors).some(Boolean);

/** "Type it" (POST /work-intakes, method typed): `fields`. */
export const toIntakeFields = (v) => ({
  title: v.title.trim(),
  description: v.description.trim() || null,
  priority: v.priority || null,
  subject: v.subject || null,
  taskType: v.workType || null,
  estimatedMinutes: v.minutes === '' ? null : Number(v.minutes),
  startDate: v.startDate || null,
  dueDate: v.dueDate || null,
});

/** The student's own task (/my-tasks): '' clears an optional field. */
export const toOwnTaskValues = (v) => ({
  title: v.title.trim(),
  description: v.description.trim(),
  priority: v.priority,
  subject: v.subject,
  workType: v.workType,
  estimatedMinutes: v.minutes === '' ? '' : Number(v.minutes),
  startDate: v.startDate,
  dueDate: v.dueDate,
});
