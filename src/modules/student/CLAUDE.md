# student module

Everything a signed-in student sees, in **two experiences**: the K-5 kid UI ("My Learning Space", `pages/kid/*`, `components/kid/*`) and the Grade 6+ standard UI. **Role:** STUDENT.

## The band split (read this first)
- `layouts/StudentLayout.jsx` decides the band: `isJuniorGrade(grade, me.gradeBand.juniorMaxGrade)`. The backend sends `gradeBand` on `/auth/me` from env `KIDS_UI` (default `K-5`), with `VITE_KIDS_UI` as the fallback. K-5 renders `KidLayout` (`.kid-theme`), Grade 6+ renders `AuthenticatedLayout` (`studentTheme.css`, Poppins).
- Pages that differ by band are declared in `routes/routeConfig.js` as `GradeBandPage` with `props: { junior: KidXPage, standard: XPage }`. `useStudentExperience()` gives `{ isJunior, checkInRequired, grade, profile, onboarded, refreshProfile }`.
- **A student feature normally needs both versions.** Kid UI uses `KidButton`, `PaperCard`, `KidSkeleton`, `font-kid-*` and `--kid-*` tokens, which follow the student's accent. Grade 6+ uses module CSS with `var(--accent-*)`.
- Work routes use `guards: [RequireCheckIn]`. That gate only holds the kid band (check-in is required for K-5 and optional for 6+). See `checkIn`.

## Where it lives
| Area | Route | Junior / Standard page | Key pieces |
|---|---|---|---|
| Home | `/student` | `KidHomePage` / `StudentHomePage` | `components/home/*` (`sh-`), `components/kid/*` |
| Onboarding | `/student/onboarding` | `KidOnboardingPage` / `onboarding/StudentOnboardingPage` | first-login questionnaire (gate in StudentLayout) |
| Assignments | `/student/assignments` | `KidAssignmentsPage` / `MyAssignmentsPage` | `components/assignments/*` (`sa-`), `components/kid/TaskCard.jsx`. Grade 6+ to the mobile mockup: "Assignments" + **Add assignment** (own task, `OwnTaskModal`), one empty card when there is nothing at all, phone cards (`sa-mcard`). The page owns the own-task list and dialog. |
| Assignment detail | `/student/assignments/:id` | `AssignmentDetailPage` (both; `isJunior` → simple page, else `components/assignment/StandardAssignmentView`, `ad-`) | answers via `assignments/components/QuestionAnswer` |
| Focus | `/student/focus`, `/focus/:activityKey` | `KidFocusPage` + `KidFocusActivityPage` / `FocusTimerPage` | `hooks/useFocusTimer.js`, `useFocusSteps.js`, `components/focus/*` (`fs-`), `components/kid/KidFocusTimerCard.jsx` |
| Plan | `/student/calendar` | `KidMyWeekPage` / `StudentPlanPage` | `components/plan/*` (`sp-`), `hooks/useWeekPlan`, `useTodayTasks` |
| Brain boosters | `/student/brain-boosters` | `BrainBoostersPage` | `components/brainBoosters/*` (`bb-`); pure game logic has `*.test.js` |
| Rewards | `/student/rewards` | `KidRewardsPage` / `RewardsPage` | `components/rewards/*` (`rw-`), `hooks/useRewards` |
| Make it yours | `/student/make-it-yours` | `KidMakeItYoursPage` / `MakeItYoursPage` | `components/personalize/*` (`my-`): accent, avatar, note style, card style |
| Settings / Help | `/student/settings`, `/help` | `KidSettingsPage` / `StudentSettingsPage`, `StudentHelpPage` | `StudentSettingsProvider.jsx` (Grade 6+) applies settings app-wide |
| Notifications | `/student/notifications` | `NotificationsPage` | `components/notifications/*` (`sn-`) |
| Check-in UI | `/student/check-in` | `KidCheckInPage` / `checkIn/CheckInPage` | `components/kid/CheckInModal`, `MoodCelebration` (`mc-`, `moodCelebrationConfig.js`) |

**Services → backend**
| Service | API | Backend |
|---|---|---|
| `focus.service.js` | `/focus`, `/focus/active`, `/focus/:id/pause|resume|complete|abandon|extend|step`, `/focus/steps*`, `/focus/today-minutes` | `routes/focus.routes.js` → `focus.service.js`, `focusStep.service.js`; models `FocusSession`, `FocusSessionEvent`, `StudentTaskStep` |
| `note.service.js` | `/notes` | `stickyNote.service.js` (`StickyNote`, optional `assignment_id`) |
| `studentTask.service.js` | `/my-tasks` (the student's own tasks, reorder) | `studentTask.service.js` |
| `reward.service.js` | `/rewards/summary|transactions|catalog|redemptions` | `reward.service.js`, `pointsAward.service.js` (`PointTransaction`, `StudentReward`) |
| `studentSettings.service.js` | `/student-settings`, `/student-settings/avatars` | `studentSettings.service.js` (`student_profiles.app_settings` JSONB) |
| `regulationToolkit.service.js` | `/regulation-toolkit`, `/recommendation` | `regulationToolkit.service.js` (exercises are master data) |
| assignments | `/assignments` (student side), `/assignments/:id/start|progress|submit` | see `assignments` module |

## Rules - read before changing
- **Focus:** one live session per student. The server refuses a second (`ConflictError`). Elapsed time comes from the server's event trail (`elapsedSeconds`), so a refresh resumes exactly. Tie a session to work with `assignmentId` (and an optional `stepId`), **never `taskId`** (that is the unused AI tasks table). Completing with `completeStep` awards step points once, ever. Abandon never ticks a step or saves the time.
- **Focus on the task page:** once an assignment is `in_progress`/`returned`, `AssignmentDetailPage` shows `KidTaskFocus` (K-5) or `components/focus/TaskFocusCard` (6+). The clock is tied to the assignment. If a clock is running for another task, the card links to `/student/focus` instead of offering Start.
- **Steps** (`/focus/steps`) are per student per assignment. Task breakdown (assignment page) and the Focus page share them, so a change in one shows in both.
- **Settings** (`app_settings`): defaultFocusMinutes (15/20/25/30/45/60, shared list `components/focus/focusLengths.js`), backgroundSound, appearance, largerText, reduceMotion, preferredName. Values are normalised on read. The kid UI respects reduce motion through `useMotionAllowed()`.
- **Personalisation:** accent via `data-accent` (5 families). The kid UI follows the accent. Avatars, sticky-note styles, stickers and themes are master data (`masterManagement`).
- **Rewards:** points come from `points_rules` (e.g. daily check-in once/day, task steps once). Collectible rewards unlock by threshold, one notification per reward, idempotent (unique `student_rewards(student_id, reward_id)`). Redemption uses a lock against double-spend.
- **Mood visuals are dynamic:** icons and colours come from the `emotional_states` master (`MoodGlyph`, `moodCelebrationConfig`). Never map a mood name to a hardcoded icon.
- Student free text that goes to AI is safety-screened on the backend (see `aiAssistant`). Notes, own tasks and the check-in note don't go to a model.
- Don't add `<Toast />` in pages. `KidLayout` and `AuthenticatedLayout` render it.
- `components/StudentCheckInCard.jsx` is unreferenced (kept, not deleted).

## Verify
- `npm test` (brain-booster logic) · `npx eslint src/modules/student` · `npm run build`
- UI: harness with `USERS.kid` **and** `USERS.student`. Example: `.claude/testing/scenarios/student-task-focus.mjs`.
- Backend focus/rewards rules: api-tester (dry-run or private backend with a zz student).

## Related
`checkIn`, `assignments`, `notifications`, `onboarding`, `aiAssistant` (`/student/assistant`), `masterManagement` (avatars, rewards, toolkit, moods), `subscription` (student lock screens).
