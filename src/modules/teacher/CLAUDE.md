# teacher module

The teacher's portal: dashboard, My Students, assignments, progress, invitations and profile. **Role:** TEACHER (Super Admin can reach some endpoints).

## Where it lives
| Route | Page | Notes |
|---|---|---|
| `/teacher` | `pages/TeacherDashboardPage.jsx` | "Three things need you today". CSS `components/dashboard/teacherDashboard.css` (`td-`) |
| `/teacher/students` | `pages/MyStudentsPage.jsx` | Roster with filters, check-in alert flags. `components/students/*` (`ts-`), `StudentDetailModal`. **Below 1024px:** cards (`StudentCard`: avatar, "Grade 3 · Active today", subject chips, alert, mood face; `activeDayLabel`), tabs scroll in one row, filters fold behind the search box's filter button (below 768px). Grade and Last active columns hide below 1280px. |
| `/teacher/students/:id` | `pages/TeacherStudentPage.jsx` | One student: overview, focus time this week, alerts (mark seen) |
| `/teacher/assignments` | `pages/AssignmentsListPage.jsx` | Status tabs with counts (`?view=`), filters, table. `components/assignmentsList/*` (`al-`). Cards below 1280px (`al-mcard`: title + ⋮ menu, subject, due, submitted bar, status, Edit); same folding filters as My Students. |
| `/teacher/assignments/new`, `/:id/edit` | `pages/AssignmentFormPage.jsx` | Collapsible `FormSection`s, `PublishPanel`, `RosterPicker`, `TagListInput`. Uses `assignments/*` components. |
| `/teacher/assignments/:id` | `pages/AssignmentDetailsPage.jsx` | Submissions and review (`assignments/ReviewSubmissionModal`). **Steps and checkpoints** (`components/assignmentDetails/TeacherPlanCard.jsx`, PDF Q3/Q5): fixed checkpoints (on or before the due date) and the assignment's **step breakdown**, made by AI when the assignment is saved (draft or publish) and previewed/edited here: "Making suggested steps…" (polled), the missing core fields named, each step "Suggested" or "Yours" (edited/added = required for students). A draft's steps are never shown to students; once live, a save replaces every student's unfinished, untouched steps. **No regenerate, suggest or clear button** - see the planner rules. `GET /assignments/:id/plan` (now with `breakdown`), `PUT /:id/checkpoints`, `PUT /:id/teacher-plan` (steps with their `key`; at least one; owning teacher only). |
| `/teacher/shared-work` | `pages/SharedWorkPage.jsx` ("Shared with me") | Students' own work shared with this teacher on purpose; "Take this on" = adopt (teacher-verified, origin kept). `services/sharedWork.service.js` → `/teacher/shared-work` |
| `/teacher/progress` | `pages/TeacherProgressPage.jsx` | Uses `progress/StudentProgressDetail` |
| `/teacher/invitations` | `pages/TeacherInvitationsPage.jsx` | Accept/decline invitations (no `awaiting_approval`/`rejected` rows are ever shown) |
| `/teacher/profile` | `pages/TeacherProfilePage.jsx` | My Profile (`profile` kit), one column like the parent's (2026-10-01): Colour theme → Personal details with the photo row inside → Address → Teaching (+ Save changes) → Change password. Test `scenarios/profile-one-column.mjs` |
| `/teacher/learning-activity` | in `aiAssistant` | Aggregate AI-assistant activity |

Services: `services/dashboard.service.js` (`GET /dashboard`), `teacherStudent.service.js` (`/teacher/students`, `/roster`, `/roster/counts`, `/students/:id/overview`, alerts seen, `/teacher/lookups/*`), `progress.service.js` (`/teacher/progress`).

**Backend:** `routes/teacher.routes.js` (`/teacher`, not paywalled) → `controllers/teacherRoster.controller.js`, `parent.controller.js` (shared progress/learning endpoints), `teacherInvitation.controller.js` → `services/teacherRoster.service.js`, `progress.service.js`, `checkInAlert.service.js`, `teacherInvitation.service.js`. Dashboard: `routes/dashboard.routes.js` → `services/teacherDashboard.service.js`. Assignments: see `assignments`.

## Rules - read before changing
- **A teacher sees only their students:** those linked by an active `teacher_student` relationship (subject + grade + academic year). Every `/teacher/students/:id…` call checks this in the service. Keep it that way for new endpoints.
- Teachers are connected **only** by accepting an invitation (or by Super Admin as an assisted change). There's no self-serve "add student".
- A teacher sees an invitation only once it was actually sent (`sent_count > 0` in `teacherInvitation.service#listForTeacher`/`loadTeacherInvitation`): a request the parent withdrew while it awaited approval stays invisible, and 404 by id. `teacher_user_id` is set when the request is filed, so Super Admin sees at once that the teacher has an account.
- **Dates** on the dashboard and lists resolve in the teacher's timezone (`getUtcRangeFor`). "This week" ends Sunday. Due-date filters (Overdue / Today / Next 7 days / Later / None) are computed server-side in that timezone.
- **Waiting to mark** groups `submitted` submissions by assignment and counts pending free-text answers.
- **Check-in alerts** (see `checkIn`) show on My Students and the student page until the teacher marks them seen (`POST /teacher/students/:studentId/alerts/:alertId/seen`).
- Assignment-list tabs: All / Published / Scheduled / Drafts / Completed, and Archived only when it has rows. The row actions sit in a ⋮ menu.
- Lookups for pickers come from `/teacher/lookups/*` (master data). Don't call `/admin/master`.

## Verify
- `npx eslint src/modules/teacher` · `npm run build`
- UI: harness with `USERS.teacher`. Mock `/dashboard`, `/teacher/roster`, `/assignments` with the real response shapes (read the service mappers).
- Backend: api-tester. Another teacher's student id returns 404, and date buckets are correct in a non-Toronto timezone.

## Related
`assignments`, `progress`, `checkIn` (alerts), `invitations`, `profile`, `aiAssistant`.
