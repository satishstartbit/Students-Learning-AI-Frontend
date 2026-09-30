# planner module

Growing Focus planning, shared by the student (both bands), the parent and the teacher: the server-computed plan, adding work any way, study/busy times, help when work gets hard, and sharing own work with a teacher. **Roles:** STUDENT (own plan), PARENT (their children's), TEACHER (checkpoints/steps on their own assignments, work shared with them). CSS prefix `pl-` (`planner.css`).

## Where it lives
| Frontend | Purpose |
|---|---|
| `services/plan.service.js` | `/students/:studentId/{plan,replan,work,availability,commitments,blocks}` (`'me'` for the student, a child id for a parent) |
| `services/intake.service.js` | `/work-intakes` (create - JSON or multipart `files[]` - get, list, confirmation, reextract, cancel) and `/voice/transcriptions` |
| `services/support.service.js` | `/students/:id/support/*`, `/work/:id/withdraw|restore`, `/teachers`, `/work/:id/shares` |
| `hooks/usePlan.js` | The plan; re-reads every 3 s (max 1 min) while `updating` |
| `hooks/useIntakeProgress.js` | Follows one intake while it is read (1.5 s poll, stops after 90 s and says so) |
| `hooks/useSupport.js` | `ask(reasonCodes)` → ranked ideas; `run({ action | strategyCode })` → does it (toasts / navigates to focus with `?minutes=`, the assistant, the toolkit) |
| `components/NextActionsCard.jsx` | "Next up": next study times with the plan's reason, Start (→ `/student/focus?assignment=&step=`), optional Help |
| `components/PlanNotices.jsx` | Updating…, time problems with the shortfall, suggested-times notice, what changed |
| `components/PriorityList.jsx`, `WorkList.jsx` | Today / Next / Later in priority order (Next 3 = `limit`), all work by due date or subject with who added it |
| `components/StudyBlockDialog.jsx` | Move / resize / keep a study time (`expectedVersion` refuses stale edits) |
| `components/AvailabilityEditor.jsx`, `CommitmentsEditor.jsx`, `pages/StudyTimesPage.jsx` | Weekly study times + busy times. `/student/study-times`, `/parent/schedule/study-times`. No time zone picker. |
| `components/AddWorkDialog.jsx` (+ `IntakeConfirm.jsx`, `VoiceRecorder.jsx`) | Add work: Type it (6+ quick-add, created at once), Say it (record → transcript → check), Photo, PDF. Asks only the uncertain facts; Grades 4-5 (`guided`) get big buttons and one date question |
| `components/PendingIntakes.jsx` | "Waiting for you": added work with a question or still being read |
| `components/NeedHelpDialog.jsx`, `SupportCheckBack.jsx`, `SupportSummaryCard.jsx` | Quick help (Keep going, Smaller steps, Explain, Re-plan, Ask an adult, No longer needed), "Did that help?", the parent's counts-only summary |
| `components/ShareWithTeacher.jsx` | On an own task (OwnTaskModal): share with one linked teacher / stop sharing |
| `components/ProvenanceBadge.jsx`, `planView.js` (+ `planView.test.js`) | Pure grouping/labels; provenance never claims a teacher |
| `pages/ParentSchedulePage.jsx` (`/parent/schedule`, sidebar "Schedule") | The viewing child's plan, all-source work, add work for them, take family-added work off the plan, support summary |

Used by: `student` (Home: Next up, check-back, pending, Add assignment → AddWorkDialog; Plan page views + study blocks; K-5 `KidPlanCard`), `checkIn` (DifficultyPicker records reasons), `teacher` (`TeacherPlanCard`, `SharedWorkPage`).

**Backend:** `routes/planning.routes.js`, `intake.routes.js`, `voice.routes.js`, `sharedWork.routes.js`, `assignment.routes.js` (`/:id/plan|checkpoints|teacher-plan`) → `services/planner/*`, `services/intake/*`, `services/ocr/*`, `services/speech/*`, `services/support/*`, `services/outbox/*`, `services/ai/workflows/{breakdown,intake}.workflow.js`. Settings: `planner.policy`, `planner.copy`, `planner.stepTemplates`, `intake.policy`, `support.policy`, `ai.routing`, `ai.prompts`, `ai.observability`. Models (migrations 108-110): `StudentPlan`, `PlanVersion`, `CalendarEvent` (study blocks), `StudentAvailability`, `StudentCommitment`, `StudentTaskStep` (+ `StepDependency`), `StudentMilestone`, `AssignmentCheckpoint`, `AiTaskBreakdown`, `WorkIntake`, `OcrResult`, `SupportEvent`, `AssignmentShare`, `OutboxEvent`.

## Rules - read before changing
- **The server plans; the client never sorts by guesswork.** Home's order = the student's dragged order, then the plan's priority (`useTodayTasks` + `planRankMap`), then due date.
- **Every change that affects the plan requests a replan in its own transaction** (backend). The UI just reloads; `usePlan` polls while `updating`. That includes a student's time zone change (device sync, parent or Super Admin edit → `user.service#replanForNewTimezone`), because study times are local wall-clock times.
- **Provenance is truthful:** own work is `student_created` / `parent_created`, never teacher-verified (only a teacher's explicit adoption makes it so). A parent-added task is read-only for the child except Mark done.
- **Dates:** due dates and plan days are `YYYY-MM-DD` keys (`formatDateKey`); block times use `formatTime(…, { timeZone: plan.timezone })` so a parent sees the child's times.
- **Added work:** a person's answers (`confirmed_fields`) always win over a re-read. Blocked text is never echoed. The model may only pick a numbered date candidate.
- **Help:** codes only, no free text. "Share with a grown-up" off = the parent's summary never counts it. "No longer needed" only for work that person may remove (never teacher work).
- **Teachers** see a student's own work only when it's shared with them, and only while shared.
- **Billing (Q11):** after grace, reads work and writes get 403 `SUBSCRIPTION_REQUIRED` with a `capability`; the layouts show `AccessBanner` instead of locking.
- **Archived children (Q12):** readable, not editable (`resolveStudent` write → 403 until restored).

## Verify
- `npm test` (`planView.test.js`) · `npx eslint src/modules/planner` · `npm run build`
- UI: `.claude/testing/scenarios/growing-focus-planner.mjs` (student, K-5, parent, teacher, support, billing, archive; mocked API).
- Backend: `DB_NAME=students_learning_ai_gf_test npm run test:integration` - `planner`, `breakdown`, `intake`, `teacherPlan`, `support`, `billing`, `archive` itests; `tests/planner/scheduler.test.js`, `tests/planner/canadaZones.test.js` (all 8 Canadian zones, DST), `tests/intake/*.test.js`, `timezone` itest.
- Real HTTP + UI in Canadian zones: `APP_URL=http://localhost:5199 node .claude/testing/functional/canada-fields.mjs` (private :5099).
