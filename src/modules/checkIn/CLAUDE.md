# checkIn module

The student's daily check-in (how they feel, energy, where they feel it, how much time they have, an optional note), the K-4 "check in first" gate, and the "Something's tricky" difficulty picker. **Role:** STUDENT answers. Parents and teachers read the results (Progress pages, alerts).

## Where it lives
| Frontend | Purpose |
|---|---|
| `components/TodayCheckInProvider.jsx` + `hooks/useTodayCheckIn.js` | One shared fetch per session of today's check-in **and** the mood list (`emotional_states` via onboarding lookups). Exposes `checkIn`, `moods`, `refresh`. |
| `components/RequireCheckIn.jsx` | Route guard for work routes. **Holds the K-4 band only.** Grade 6+ can skip. |
| `pages/CheckInPage.jsx` (Grade 6+, `/student/check-in` standard) · `student/pages/kid/KidCheckInPage.jsx` (K-4) | Standalone check-in pages |
| `components/StudentCheckInModal.jsx` + `studentCheckIn.css` (`ci-`) | Grade 6+ check-in modal (mood tiles, energy, body areas, time, note) |
| `components/DifficultyPicker.jsx` + `hooks/useDifficultyPicker.js` + `difficultyPicker.css` (`dp-`) | Grade 6+ "what is making it hard?" → reasons → strategies. The K-4 version is `student/components/kid/KidDifficultyPicker.jsx`. Both now **record** what was picked (`POST /students/me/support/barriers`, codes only - the old note box was removed because it was never saved) and show the server's ranked ideas with "Try this" (the idea's app action: smaller steps, explain, short focus, toolkit, re-plan, ask an adult). "Share with a grown-up" decides whether a parent's summary counts it. See `planner` (`useSupport`). |
| `components/MoodGlyph.jsx`, `hooks/useMoodLookup.js`, `moods.js` | Draw a mood from master data (emoji or uploaded icon, background colour). Also used by parent/teacher Progress. |
| `nextPath.js` | Where to send the student after checking in (`?next=`), with kid-friendly labels |
| `services/checkIn.service.js` | `GET /check-ins/today`, `POST /check-ins`, `GET /check-ins/history` |

**Backend:** `routes/checkIn.routes.js` (`/check-ins`, STUDENT, `subscriptionGated`) → `controllers/checkIn.controller.js` → `services/checkIn.service.js` (+ `checkInAlert.service.js`, `pointsAward.service.js`, `studentAccess.service.js` for history access). Lists: `services/masterLookup.service.js` (`/lookups/:type`, `/lookups/difficulty-picker`). Models: `DailyCheckin`, `CheckinAlert`, `CheckinAlertView`, `MasterItem`.

## Rules - read before changing
- **One check-in per student per day, in the student's timezone** (`getDateKeyInTimezone`). A second submit the same day updates the row. Points (`daily_checkin_completed`) are awarded once per day. Uses an advisory lock.
- **Required for K-4 only** (`gradeBand.checkInRequired` from the backend; `RequireCheckIn` + the kid pages). Optional for Grade 6+. Controlled by `KIDS_UI` / `VITE_KIDS_UI`. Never hardcode a grade number.
- **Every list is master data:** moods = `emotional_states` (with `code`, icon, background colour, `extra.intensity_level`), `body_areas`, `available_time`, `difficulty_categories` → `difficulty_reasons` → `support_strategies`. The backend validates submitted codes against active items. Don't hardcode moods or icons anywhere (parent/teacher views included).
- **The note** ("Anything you want to add?") is stored as written and is **not** safety-screened. It never reaches an AI model. If it is ever sent to a model, it must go through `services/safety` first.
- **Wellbeing alerts:** a mood whose `extra.intensity_level` ≥ `env.checkinAlerts.minIntensity` (default 5) raises one alert per check-in: parents are emailed (direct, not preference-filtered) and teachers get a `checkin_alert` notification and a flag on My Students until marked seen. Changing the answer later sends no second email.
- The K-4 mood celebration (`MoodCelebration`) and Grade 6+ tiles read icons from the picked mood item, never from a name map.

## Verify
- UI: harness with `USERS.kid` (the gate redirects to check-in when `/check-ins/today` returns `{ data: null }`) and `USERS.student` (modal).
- Backend: api-tester. Same-day update, points once, invalid mood code refused, alert once per check-in (email stubbed).

## Related
`student` (kid pages, focus toolkit suggestions via `/regulation-toolkit/recommendation`), `progress` (shows check-ins), `teacher` (alerts on My Students), `masterManagement` (the lists).
