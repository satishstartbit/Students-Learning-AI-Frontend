# teacher module

The teacher's portal: dashboard, My Students, assignments, progress, invitations and profile. **Role:** TEACHER (Super Admin can reach some endpoints).

## Where it lives
| Route | Page | Notes |
|---|---|---|
| `/teacher` | `pages/TeacherDashboardPage.jsx` | "Three things need you today". CSS `components/dashboard/teacherDashboard.css` (`td-`) |
| `/teacher/dashboard` | `pages/MyStudentsPage.jsx` | Roster with filters, check-in alert flags. `components/students/*` (`ts-`), `StudentDetailModal` |
| `/teacher/students/:id` | `pages/TeacherStudentPage.jsx` | One student: overview, focus time this week, alerts (mark seen) |
| `/teacher/assignments` | `pages/AssignmentsListPage.jsx` | Status tabs with counts (`?view=`), filters, table. `components/assignmentsList/*` (`al-`) |
| `/teacher/assignments/new`, `/:id/edit` | `pages/AssignmentFormPage.jsx` | Collapsible `FormSection`s, `PublishPanel`, `RosterPicker`, `TagListInput`. Uses `assignments/*` components. |
| `/teacher/assignments/:id` | `pages/AssignmentDetailsPage.jsx` | Submissions and review (`assignments/ReviewSubmissionModal`) |
| `/teacher/progress` | `pages/TeacherProgressPage.jsx` | Uses `progress/StudentProgressDetail` |
| `/teacher/invitations` | `pages/TeacherInvitationsPage.jsx` | Accept/decline invitations (no `awaiting_approval`/`rejected` rows are ever shown) |
| `/teacher/profile` | `pages/TeacherProfilePage.jsx` | My Profile (`profile` kit) |
| `/teacher/learning-activity` | in `aiAssistant` | Aggregate AI-assistant activity |

Services: `services/dashboard.service.js` (`GET /dashboard`), `teacherStudent.service.js` (`/teacher/students`, `/roster`, `/roster/counts`, `/students/:id/overview`, alerts seen, `/teacher/lookups/*`), `progress.service.js` (`/teacher/progress`).

**Backend:** `routes/teacher.routes.js` (`/teacher`, not paywalled) → `controllers/teacherRoster.controller.js`, `parent.controller.js` (shared progress/learning endpoints), `teacherInvitation.controller.js` → `services/teacherRoster.service.js`, `progress.service.js`, `checkInAlert.service.js`, `teacherInvitation.service.js`. Dashboard: `routes/dashboard.routes.js` → `services/teacherDashboard.service.js`. Assignments: see `assignments`.

## Rules - read before changing
- **A teacher sees only their students:** those linked by an active `teacher_student` relationship (subject + grade + academic year). Every `/teacher/students/:id…` call checks this in the service. Keep it that way for new endpoints.
- Teachers are connected **only** by accepting an invitation (or by Super Admin as an assisted change). There's no self-serve "add student".
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
