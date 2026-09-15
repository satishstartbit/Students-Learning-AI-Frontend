/**
 * Task stages as the Progress pages show them. The keys come from the
 * backend (services/progress.service.js#STAGE), which derives them from
 * assignment_recipients.status.
 */
export const TASK_STAGES = {
  not_started: { label: 'Not started', tone: 'neutral' },
  in_progress: { label: 'In progress', tone: 'info' },
  returned: { label: 'Sent back to fix', tone: 'warning' },
  submitted: { label: 'Submitted', tone: 'primary' },
  reviewed: { label: 'Scored / feedback given', tone: 'success' },
};

/** Badge tone for a check-in mood - "needs support" moods stand out, without alarming red. */
export const MOOD_TONE = {
  ready_to_focus: 'success',
  calm: 'success',
  tired: 'warning',
  distracted: 'warning',
  tense: 'warning',
  overwhelmed: 'warning',
};
