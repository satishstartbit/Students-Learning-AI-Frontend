# invitations module

The teacher-invitation link a teacher opens from the email, plus the shared status vocabulary for invitations. **Roles:** anyone with the link (signed in or not), TEACHER to accept.

## Where it lives
| Frontend | Purpose |
|---|---|
| `pages/TeacherInvitationPage.jsx` (`/invitations/teacher/:token`, an `OPEN_ROUTES` route) | Shows who invited, the child, subjects, grade and year, then Accept / Decline (with an optional reason) |
| `invitationStatus.js` | **The** label/tone map for every status: `awaiting_approval` "Awaiting approval", `pending`, `accepted`, `declined`, `expired`, `cancelled`, `rejected` "Not approved". Parent, teacher and admin screens all read it. |
| `services/teacherInvitation.service.js` | Token endpoints plus the parent/teacher/admin invitation calls used by other modules |

**Backend:** `routes/teacherInvitation.routes.js` (`/teacher-invitations/:token`, `/accept`, `/decline`) · parent (`/parent/.../teacher-invitations`), teacher (`/teacher/invitations`) and admin (`/admin/teacher-invitations`) routes → `controllers/teacherInvitation.controller.js` → `services/teacherInvitation.service.js`. Email: `services/email/email.service.js#renderTeacherInvitationEmail` + `services/email/copy.js` (`copy/teacher-invitation.txt`, `email_copy` overrides). Job: `jobs/expireTeacherInvitations.js`. Model `TeacherInvitation` (migrations 093, 094, 099).

## Rules - read before changing
- **Lifecycle:** `awaiting_approval` (parent request) → Super Admin approves → `pending` (token emailed) → `accepted` | `declined` | `expired` (`TEACHER_INVITATION_TTL_DAYS`, default 14) | `cancelled`. A rejected request becomes `rejected`. Teachers never see `awaiting_approval` or `rejected` rows (`listForTeacher` / `loadTeacherInvitation` filter them out).
- Tokens are stored as a SHA-256 hash only (`token_hash`). The raw token exists only in the email link. Approving issues a fresh token and a fresh expiry.
- Accepting creates the `teacher_student` relationships (per subject, grade, academic year) and notifies the family. "Accept for teacher" (Super Admin) runs the same `acceptInvitation`.
- The teacher email is lower-cased. If an account exists for it, accepting links that account. The page works signed in or out.
- A new status needs changes in five places: DB check (migration), model, `validators/teacherInvitation.validator.js#STATUSES`, `invitationStatus.js`, and every list that filters by status.
- The email wording is the client's. Don't write it. `[CLIENT COPY PENDING]` blocks sending in production (see `superAdmin`).

## Verify
- UI: harness scenario opening `/invitations/teacher/<token>` with a mocked `GET /teacher-invitations/:token`.
- Backend: api-tester. Token accept/decline on a private backend with a zz invitation, and check that expired and cancelled tokens are refused.

## Related
`parent` (requests), `superAdmin` (approve/reject/resend), `teacher` (`TeacherInvitationsPage`), `notifications`.
