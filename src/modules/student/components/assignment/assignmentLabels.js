import { ASSIGNMENT_RECIPIENT_STATUS as STATUS } from '../../../../utils/constants';

/**
 * Shared words and status groups for the student's assignment page (both
 * bands). Kept out of the component files (react-refresh: a component file
 * exports only components).
 */

/** Handed in: the work can't be changed any more. */
export const HANDED_IN_STATUSES = [STATUS.SUBMITTED, STATUS.REVIEWED, STATUS.COMPLETED];

/** The teacher has reviewed it - final, never sent back (a sent-back task is `returned`). */
export const REVIEWED_STATUSES = [STATUS.REVIEWED, STATUS.COMPLETED];

/** The teacher's priority, in the student's words ("medium" reads as "Normal"). */
export const PRIORITY_LABELS = { low: 'Low', medium: 'Normal', high: 'High' };

/** How the teacher expects the work to be done ("Doing it"). */
export const WORK_MODE_LABELS = { independent: 'On my own', needs_help: 'With help from an adult' };

/** "Maria Rivera" from an API person object, or '' when unknown. */
export const personName = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(' ');
