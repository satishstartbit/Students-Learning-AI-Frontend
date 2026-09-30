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
| `components/PriorityList.jsx`, `WorkList.jsx` | Unreferenced since 2026-09-30 (kept, not deleted): the schoolwork List view's orders replaced them (Priority / Next 3 / Due date / Subject) |
| `components/StudyBlockDialog.jsx` | Move / resize / keep a study time (`expectedVersion` refuses stale edits) |
| `components/AvailabilityEditor.jsx`, `CommitmentsEditor.jsx`, `pages/StudyTimesPage.jsx` | Weekly study times + busy times. `/student/study-times`, `/parent/schedule/study-times`. No time zone picker. |
| `components/AddWorkDialog.jsx` (+ `IntakeConfirm.jsx`, `VoiceRecorder.jsx`) | Add work: Type it (6+ quick-add, created at once), Say it (record → transcript → check), Photo, PDF. Asks only the uncertain facts; Grades 4-5 (`guided`) get big buttons and one date question |
| `components/PendingIntakes.jsx` | "Waiting for you": added work with a question or still being read |
| `components/NeedHelpDialog.jsx`, `SupportCheckBack.jsx`, `SupportSummaryCard.jsx` | Quick help (Keep going, Smaller steps, Explain, Re-plan, Ask an adult, No longer needed), "Did that help?", the parent's counts-only summary |
| `components/ShareWithTeacher.jsx` | On an own task (OwnTaskModal): share with one linked teacher / stop sharing |
| `components/ProvenanceBadge.jsx`, `planView.js` (+ `planView.test.js`) | Pure grouping/labels; provenance never claims a teacher |
| `pages/ParentSchedulePage.jsx` (`/parent/schedule`, sidebar "Schedule") | The viewing child's schoolwork in the same three views (board: a parent moves only parent-added work; list with who added what; read-only week `ScheduleWeek`), Customize for the child, add work for them, take family-added work off the plan (from the note dialog), Coming up, support summary |

### Schoolwork views (Growing Focus views PDF: sticky notes, list, calendar)
Every view shows the **same server plan** (same work, priority order, deadlines, subject colours, details); only the layout changes. CSS prefix `sw-` (`components/schoolwork/schoolwork.css`).
| Frontend | Purpose |
|---|---|
| `schoolwork.js` (+ `schoolwork.test.js`) | Pure: `VIEW_OPTIONS`, `COLUMNS`, `LIST_ORDERS`, `orderByPlan`, `boardColumns`, `listSections`, `dueInfo`, `agendaItems` (study times + personal events in time order), `moveActions`, `canTick` |
| `hooks/useSchoolwork.js` | `GET /students/:id/work?includeDone=true` + `move(work, to)` → `PATCH …/work/:id/progress` |
| `hooks/useSchoolworkSettings.js`, `components/SchoolworkSettingsProvider.jsx` | "Customize My Growing Focus" (`GET/PATCH /students/:id/schoolwork-settings`): preferences, every subject's colour, palette, activity categories. The student's copy lives in the provider (mounted in `StudentLayout`, both bands), which also feeds `useSubjectColors` app-wide; a parent's hook fetches the child's |
| `hooks/useWorkTypeOptions.js` | Assignment Types master as options with icons ("Kind of work" on Type it and OwnTaskModal) |
| `components/schoolwork/SchoolworkBoard.jsx` | To Do / Doing / Done (+ "Personal" column when switched on); drag and drop or the buttons on each note; `canMove(work)` |
| `components/schoolwork/SchoolworkList.jsx` | Checklist in plan order ("Sorted by due date and urgency") or Next 3 / Due date / Subject; tick own work; teacher work's circle opens it to hand in; "Why now" in plan order; who added it |
| `components/schoolwork/DayAgenda.jsx`, `ScheduleWeek.jsx` | The full calendar: study times (subject colour, "📝 Homework · Mathematics") and personal events (category colour) in time order; `compact` for narrow week columns |
| `components/schoolwork/WorkNoteDialog.jsx` | Open a note: details, steps (subtasks, student `focusService.listSteps`), moves, Hand in, Focus, a parent's Take it off |
| `components/schoolwork/SchoolworkPreferences.jsx`, `SubjectColorsDialog.jsx`, `ViewSwitcher.jsx`, `SchoolworkBits.jsx`, `schoolworkFormat.js` | The settings screen (three view cards + switches + subject colours in place), the colour editor, the switcher, chips/labels/due/estimate text |

Used by: `student` (Home: Next up, check-back, pending, Add assignment → AddWorkDialog; Plan page = My Schoolwork (sticky notes / list / calendar); Settings "My Growing Focus"; K-5 My week (same three views, kid look) and Settings "How I see my work"; K-5 `KidPlanCard`), `checkIn` (DifficultyPicker records reasons), `teacher` (`TeacherPlanCard`, `SharedWorkPage`).

**Backend:** `routes/planning.routes.js`, `intake.routes.js`, `voice.routes.js`, `sharedWork.routes.js`, `assignment.routes.js` (`/:id/plan|checkpoints|teacher-plan`) → `services/planner/*`, `services/intake/*`, `services/ocr/*`, `services/speech/*`, `services/support/*`, `services/outbox/*`, `services/ai/workflows/{breakdown,intake}.workflow.js`. Settings: `planner.policy`, `planner.copy`, `planner.stepTemplates`, `intake.policy`, `support.policy`, `ai.routing`, `ai.prompts`, `ai.observability`. Models (migrations 108-110): `StudentPlan`, `PlanVersion`, `CalendarEvent` (study blocks), `StudentAvailability`, `StudentCommitment`, `StudentTaskStep` (+ `StepDependency`), `StudentMilestone`, `AssignmentCheckpoint`, `AiTaskBreakdown`, `WorkIntake`, `OcrResult`, `SupportEvent`, `AssignmentShare`, `OutboxEvent`. Schoolwork views (migration 112): `services/planner/schoolworkPrefs.js` (pure; `student_profiles.app_settings.schoolwork`, kept by `studentSettings#normalizeAppSettings`), `schoolworkSettings.service.js`, `workDisplay.js` (type name/icon, activity categories, busy times → dated `personalEvents`), `studentPlanning.service#listWork` (`kind`, `progress`, `moves`, `typeName`/`typeIcon`, `details`, `includeDone` = last 14 days) and `#setProgress`; `task_types.icon`, `assignments.work_type` (own work's Assignment Types name), `student_commitments.category` (Personal Activity Categories code).

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
- **Sticky-note columns are the real status, never a board-only field:** own/parent work pending/in_progress/completed = To Do/Doing/Done (a move requests a replan); teacher work assigned → To Do, started/returned → Doing, handed in → Done. From the board teacher work can only be started (`startAssignment`); it is handed in on its page and never goes back. A student moves any of their work (a parent-added task's progress too); a parent moves only parent-added work. The server sends `moves` - the UI never decides.
- **Personal events** (busy times with a category: Extracurricular, Personal / family, Social plans…) are always on the calendar, never schoolwork; on the board/list only with "Show personal events on schoolwork board". The scheduler already keeps study time off them (`scheduler#commitmentsOn` is the one rule for both).
- **One colour per subject everywhere:** admin default on the Subjects master (`extra.color`), the student's own choice on top (`subjectColors`, keyed by lower-case name), a steady fallback for subjects not on the master - all resolved server-side in the settings payload. Paint with `components/subjects/subjectColor#subjectPaint`; never hardcode a subject colour. Type icons: `task_types.icon` (teacher work), Assignment Types `icon` (own work's `work_type`).
- **Default view** comes from the settings; switching views on a page is for now only. Nobody's view is chosen for them except by the student or their parent.
- **Dates:** plan `from`/`to` and busy-time days are day keys validated by `planning.validator#dateKey` (kept as strings; the old `isoDate()` rule turned them into timestamps and refused every week request - fixed 2026-09-30). Busy-time HH:MM display: `utils/date#formatClockTime`.

## Verify
- `npm test` (`planView.test.js`, `schoolwork.test.js`, `components/subjects/subjectColor.test.js`) · `npx eslint src/modules/planner` · `npm run build`
- UI: `.claude/testing/scenarios/growing-focus-planner.mjs` (student, K-5, parent, teacher, support, billing, archive; mocked API) and `scenarios/schoolwork-views.mjs` (board moves by button and drag, note steps, list order and ticks, full-calendar order, Customize, Settings, K-5, parent, busy-time category, kind of work, teacher colours, admin task-type icon; 390px and dark mode).
- Backend: `tests/planner/schoolwork.test.js` (preferences, colours, personal events, columns, the PDF Tuesday), `tests/planner/planningValidator.test.js`.
- Backend: `DB_NAME=students_learning_ai_gf_test npm run test:integration` - `planner`, `breakdown`, `intake`, `teacherPlan`, `support`, `billing`, `archive` itests; `tests/planner/scheduler.test.js`, `tests/planner/canadaZones.test.js` (all 8 Canadian zones, DST), `tests/intake/*.test.js`, `timezone` itest.
- Real HTTP + UI in Canadian zones: `APP_URL=http://localhost:5199 node .claude/testing/functional/canada-fields.mjs` (private :5099).
