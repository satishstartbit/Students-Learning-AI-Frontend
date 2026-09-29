# superAdmin module

Super Admin's console: dashboard, users, relationships, and the teacher-connection process. **Role:** SUPER_ADMIN only (`routes/admin.routes.js` guards everything with `requireRole(SUPER_ADMIN)`). Master data is its own module (`masterManagement`), and subscriptions/payments are in `subscription`.

## Where it lives
| Frontend | Purpose |
|---|---|
| `pages/AdminDashboardPage.jsx` (`/admin`) | Overview |
| `pages/AdminProfilePage.jsx` (`/admin/profile`, account menu > Account) | The Super Admin's own profile: name, phone, time zone, password (`profile` kit). No photo (no profile table). The email is **read-only**: changing it would sign every session out until verification, which could lock the admin out. `PATCH /auth/me` allows a Super Admin to edit only their own account (`user.service#updateUser`, `{ self: true }` from `auth.controller#updateMe`), and it drops photo, profile and email for them. User management still refuses to edit any Super Admin. |
| `pages/UsersListPage.jsx` (`/admin/users/students|parents|teachers`), `CreateUserPage`, `EditUserPage`, `UserDetailPage` | User CRUD, suspend/reactivate, reset password. Forms use `auth/components/RoleProfileFields` (`includeAdminOnly`). **Students:** no email/phone on Edit; the detail page offers **Set password** (`PATCH /admin/users/:id/password`, reusing `parent/components/SetChildPasswordModal` with `save`) instead of the emailed reset, which the API refuses for an account without email; delete asks for the username. **Unverified teacher/parent:** an "Email not verified" alert with **Resend verification email** (`POST …/resend-verification`, reports `emailSent`) and **Mark as verified** (`POST …/mark-email-verified`, audited). |
| `components/ParentChildrenPanel.jsx` | A parent's children on the user page (add child for a family). Add child = name + password (no email/phone); rows show `@username` and "Not signed in yet". |
| `pages/RelationshipsPage.jsx` (`/admin/relationships`, "Assignments") | Teacher↔student links by Subject + Grade + Academic Year (view/edit) |
| `pages/TeacherConnectionsPage.jsx` (`/admin/relationships/connections`) | Tabs: **Requests from parents** (approve/reject) · **Connections** (create/edit/move/remove) · **Waiting on a teacher** (resend, accept for teacher) · **Change log** |
| `components/ConnectionModal.jsx` | create / edit (can switch teacher = hand-over) / move. The reason field is required. |
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
- UI: harness with `USERS.superAdmin`.

## Related
`parent` (sends requests), `invitations` (token page, status labels), `teacher` (accepts), `notifications`, `masterManagement`.
