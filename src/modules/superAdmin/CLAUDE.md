# superAdmin module

Super Admin's console: dashboard, users, relationships, and the teacher-connection process. **Role:** SUPER_ADMIN only (`routes/admin.routes.js` guards everything with `requireRole(SUPER_ADMIN)`). Master data is its own module (`masterManagement`), and subscriptions/payments are in `subscription`.

## Where it lives
| Frontend | Purpose |
|---|---|
| `pages/AdminDashboardPage.jsx` (`/admin`) | Overview |
| `pages/AdminProfilePage.jsx` (`/admin/profile`, account menu > Account) | The Super Admin's own profile: name, phone, time zone, password (`profile` kit). No photo (no profile table). The email is **read-only**: changing it would sign every session out until verification, which could lock the admin out. `PATCH /auth/me` allows a Super Admin to edit only their own account (`user.service#updateUser`, `{ self: true }` from `auth.controller#updateMe`), and it drops photo, profile and email for them. User management still refuses to edit any Super Admin. |
| `pages/UsersListPage.jsx` (`/admin/users/students|parents|teachers`), `CreateUserPage`, `EditUserPage`, `UserDetailPage` | User CRUD, suspend/reactivate, reset password. **Create is one page per role:** `/admin/users/teachers/create` and `/admin/users/parents/create` (`CreateUserPage` with `role` from `routeConfig.js`, paths in `utils/constants#ROLE_CREATE_PATH`): no role picker, own title/breadcrumb/profile section/button, keyed by role so switching starts a fresh form. The Teachers/Parents lists and the dashboard link to them; Students has no create (parents add children). The old `/admin/users/create` redirects to the teacher page. Forms use `auth/components/RoleProfileFields` (`includeAdminOnly`). **Students:** no email/phone on Edit; the detail page offers **Set password** (`PATCH /admin/users/:id/password`, reusing `parent/components/SetChildPasswordModal` with `save`) instead of the emailed reset, which the API refuses for an account without email; delete asks for the username. **Unverified teacher/parent:** an "Email not verified" alert with **Resend verification email** (`POST …/resend-verification`, reports `emailSent`) and **Mark as verified** (`POST …/mark-email-verified`, audited) - that alert is currently commented out in `UserDetailPage.jsx` (not by the email-delivery change; it leaves two unused-variable lint errors there). **Email failures are never reported as success (2026-10-01):** `POST …/reset-password` returns `{ emailSent, emailProblem }` and the page shows an error toast plus an alert that stays ("The reset email didn't go out", the reason, "Check email on System status"); `POST /admin/users` returns `inviteEmail: { sent, problem }` and Create says when the set-password email didn't go out. Reason codes → words: `src/utils/emailProblem.js` (+ test). Test `.claude/testing/scenarios/admin-email-delivery.mjs`. **Mailing address (2026-10-06):** the detail grid prints the user's address as a Canada Post block via `utils/address.js#formatMailingAddress` (name, line 2, street, "CITY PR  A1A 1A1"). |
| `components/ParentChildrenPanel.jsx` | A parent's children on the user page (add child for a family). Add child = name + password (no email/phone); rows show `@username` and "Not signed in yet". |
| `pages/RelationshipsPage.jsx` (`/admin/relationships`, "Assignments") | Teacher↔student links by Subject + Grade + Academic Year (view/edit) |
| `pages/TeacherConnectionsPage.jsx` | **Removed from the app at the client's request (2026-10-01):** no route or nav item, `/admin/relationships/connections` redirects to `/admin/relationships`. File kept unreferenced. It held **Requests from parents** (approve/reject - the only UI for it, so parents' requests now stay `awaiting_approval`), **Connections** (assisted create/edit/move/remove), **Waiting on a teacher** (resend, accept for teacher) and the **Change log**. The `/admin/teacher-connections` and `/admin/teacher-invitations/*` APIs are unchanged. |
| `components/ConnectionModal.jsx` | Used only by the removed page: create / edit (can switch teacher = hand-over) / move. The reason field is required. |
| `pages/TeacherInvitationsAdminPage.jsx`, `components/InviteTeachersModal.jsx` | Invitation list; Super Admin can invite directly |
| `pages/InvitationEmailPage.jsx` | Editor for the client-written invitation email. **Hidden** (route and nav commented out in `routeConfig.js` / `SuperAdminLayout.jsx`). The file is kept on purpose. |
| `services/adminUser.service.js`, `services/teacherConnection.service.js` | `/admin/*` calls |

Layout: `layouts/SuperAdminLayout.jsx` (nav groups, black sidebar via `theme/superAdminSidebar.css`, `usePortalTheme()`).

**Backend:** `routes/admin.routes.js` → `controllers/user.controller.js`, `teacherInvitation.controller.js`, `teacherConnection.controller.js`, `emailCopy.controller.js` → `services/user.service.js`, `relationship.service.js`, `parent.service.js`, `teacherInvitation.service.js` (requests, approve/reject, deliver), `teacherConnection.service.js` (assisted changes, `tellFamily`), `emailCopy.service.js`. Audit: `userRepository.writeAuditLog`. Models: `User`, `UserRelationship`, `TeacherInvitation`, `AuditLog`, `EmailCopy`.

## API (all under `/admin`)
Users: `GET|POST /users`, `GET|PATCH|DELETE /users/:id`, `POST /users/:id/suspend|reactivate|reset-password`, `GET|POST /users/:parentId/children`, `GET /roles`, `GET /subjects`
Relationships: `GET /relationships`, `/relationships/grouped`, `POST /relationships`, `PATCH|DELETE /relationships/:id`
Connections: `GET /teacher-connections`, `GET /teacher-connections/changes`, `POST /teacher-connections`, `PATCH /teacher-connections`, `POST /teacher-connections/move`, `POST /teacher-connections/remove`
Invitations: `GET|POST /teacher-invitations`, `POST /teacher-invitations/:id/approve|reject|accept-for-teacher|resend|cancel`
Email copy: `GET /email-copy`, `GET|PUT|DELETE /email-copy/:name`, `POST /email-copy/:name/preview`

## Rules - read before changing
- **The connection process:** parent sends a request (`awaiting_approval`) → Super Admin approves (fresh token, status `pending`, client-written email to the teacher) or rejects (`rejected` + `review_note`, which the family sees) → the teacher accepts/declines. Only `awaiting_approval` can be approved or rejected. A rejection note must be at least 5 characters.
- **Assisted changes are exceptions,** not the normal path. Every create/edit/move/remove/accept-for-teacher requires a **reason** (min 5 characters), writes an `audit_logs` row (actor, before/after, reason), and appears in the Change log. The reason is internal and **never shown to the family**.
- **Families are always told:** every assisted change notifies the child's parents in-app (`NOTIFICATION_TYPES.TEACHER_CONNECTION_UPDATED`), in plain words, without the reason.
- **Moves merge:** moving subjects to a teacher who already teaches the student must add to their connection, never wipe it (`writeSubjects({ merge: true })`). The same applies to a year change.
- Editing a connection can switch the teacher. That is a hand-over (`moveConnection`), not an in-place update.
- The one-open-invitation rule is a DB partial unique index (`uq_teacher_invitations_one_pending WHERE status IN ('pending','awaiting_approval')`). `blockerFor({ excludeId })` checks it in the service.
- **Invitation email copy:** `services/email/copy/teacher-invitation.txt` still has `[CLIENT COPY PENDING]` slots. In production, approve/send is blocked (503) until they're filled (`assertCopyReady`). A saved `email_copy` row overrides the file. With the editor page hidden, fill the file.
- Direct linking without an invitation was removed on purpose (`bulk-assign` is gone). Don't bring it back without asking.
- Row actions are icon buttons with semantic colours (delete red, activate green, deactivate amber, edit/view accent). Filters use a compact `FilterBar`.

## Verify
- `npx eslint src/modules/superAdmin` · `npm run build`
- Service rules: `.claude/testing/backend/dry-run.cjs` with `teacherConnection.service` / `teacherInvitation.service` (rolled back, notifications captured). Earlier runs are recorded in `memory-bank/progress.md`.
- UI: harness with `USERS.superAdmin`. Create pages: `.claude/testing/scenarios/admin-create-users.mjs` (mocked API); real backend: `functional/canada-fields.mjs` creates one teacher and one parent through them.

## Related
`parent` (sends requests), `invitations` (token page, status labels), `teacher` (accepts), `notifications`, `masterManagement`.
