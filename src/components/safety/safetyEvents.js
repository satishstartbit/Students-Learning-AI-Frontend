/**
 * A save the server safety-screened (a note, the check-in note, a step, an
 * answer) can come back with `safetyNotice` - { title, message, resources }.
 * utils/apiClient announces it here; SafetyNoticeHost (mounted once in the
 * student area) shows it. No screen has to remember to.
 */
export const SAFETY_NOTICE_EVENT = 'eflp:safety-notice';

export function announceSafetyNotice(notice) {
  if (!notice || typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SAFETY_NOTICE_EVENT, { detail: notice }));
}
