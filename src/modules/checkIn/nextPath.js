/**
 * The `?next=` a student is sent back to after checking in. Only a student-
 * area path is accepted, so the parameter can't be used to redirect off-site.
 */
export function safeNextPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/student/')) return null;
  if (value.startsWith('//') || value.includes('://') || value.includes('\\')) return null;
  return value;
}

const DESTINATIONS = [
  { prefix: '/student/assignments', label: 'your assignments', kidLabel: 'your tasks' },
  { prefix: '/student/focus', label: 'Focus', kidLabel: 'Focus time' },
  { prefix: '/student/calendar', label: 'your plan', kidLabel: 'My Week' },
  { prefix: '/student/assistant', label: 'the AI Assistant', kidLabel: 'Helper' },
];

/** "your assignments" - what the student was on their way to. */
export function describeNextPath(path, { kid = false } = {}) {
  const match = DESTINATIONS.find((d) => path?.startsWith(d.prefix));
  if (!match) return 'your work';
  return kid ? match.kidLabel : match.label;
}
