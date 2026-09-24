# progress module

Shared, read-only "how is this student doing" UI used by **both** the parent and teacher Progress pages (and the teacher's student page). There are no routes here. The pages live in `parent` (`ParentProgressPage`) and `teacher` (`TeacherProgressPage`, `TeacherStudentPage`).

## Where it lives
| Frontend | Purpose |
|---|---|
| `components/StudentProgressDetail.jsx` + `progressDetail.css` (`pg-`) | The detail panel: today's check-in, recent check-ins, focus time today, task counts and task list |
| `components/CheckInStrip.jsx`, `CheckInBadge.jsx`, `MoodIcon.jsx` | Recent check-ins. Mood icon and colour come from the `emotional_states` master (via `checkIn/MoodGlyph`), never from a name map. |
| `components/TaskCounts.jsx` | Counts per stage |
| `stages.js` | `TASK_STAGES` labels/tones for the stage keys the backend sends (`not_started`, `in_progress`, `returned`, `submitted`, `reviewed`), and `MOOD_TONE` (badge tone per mood code) |

**Backend:** `services/progress.service.js` (`STAGE`, `OPEN_STAGES`, `listTaskRows`, …), served by `GET /parent/progress`, `GET /parent/children/:id/progress`, `GET /teacher/progress`, `GET /teacher/progress/:id` (controllers in `parent.controller.js`). `parentDashboard.service.js` reads the same task rows.

## Rules - read before changing
- **Read-only**, built from `assignment_recipients`/`assignment_submissions` + `daily_checkins`. No AI, email or files.
- **Scope:** a teacher sees only the tasks they created, for students they're linked to. A parent sees every task assigned to their own child. Enforced in the service. Don't filter on the client.
- Stage keys are derived on the server from the recipient status. A new stage needs `progress.service#STAGE` **and** `stages.js#TASK_STAGES`.
- "Today" and recent days are computed in the viewer's/student's timezone (`getUtcRangeFor`, date keys). Show them via `utils/date.js`.
- Mood visuals must follow the admin's Emotional States edits (icon upload or emoji, background colour). An earlier bug showed the wrong icon on parent/teacher pages, so always resolve by mood `code` through the lookup.
- Changes here affect **both** parent and teacher pages. Check both.

## Verify
- UI: harness. `/parent/progress` with `USERS.parent` and `/teacher/progress` with `USERS.teacher`, using the same fixture rows.
- Backend: api-tester. A teacher doesn't see another teacher's tasks, and a parent doesn't see another family's child.

## Related
`parent`, `teacher`, `checkIn`, `assignments`.
