/*
 * Why an email didn't go out, in words Super Admin can act on. The backend
 * sends one of these codes (services/email/problem.js) - never the email
 * service's own text, which can contain addresses or credentials. Used by
 * the user page (reset), Create user (set-password link) and System status.
 */
const PROBLEM_TEXT = {
  not_configured:
    "Email isn't set up on the server. Set EMAIL_PROVIDER and that provider's settings on the backend host (see EMAIL_SETUP.md).",
  unreachable:
    "The server couldn't reach the email service. Hosts such as Render (free) and Railway (below Pro) block SMTP, so Gmail SMTP can't connect there - use EMAIL_PROVIDER=brevo (or ses) on that host.",
  auth_failed:
    "The email service refused the server's login. Check the SMTP username and app password, or the Brevo API key (and Brevo's authorised IP list).",
  rejected: "The email service refused the message. Check that the sender address is verified with the provider.",
  no_address: 'Your account has no email address to send a test to.',
  unknown: "The email service didn't accept it. The backend log has the details.",
};

/** One sentence for an email problem code; a generic one for anything unknown. */
export const emailProblemText = (problem) => PROBLEM_TEXT[problem] ?? PROBLEM_TEXT.unknown;

/** Short labels for a status badge. */
const PROBLEM_LABEL = {
  not_configured: 'Not set up',
  unreachable: "Can't reach the service",
  auth_failed: 'Login refused',
  rejected: 'Message refused',
  no_address: 'No address',
  unknown: 'Failed',
};
export const emailProblemLabel = (problem) => PROBLEM_LABEL[problem] ?? PROBLEM_LABEL.unknown;
