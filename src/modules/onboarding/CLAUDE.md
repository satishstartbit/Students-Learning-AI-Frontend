# onboarding module

The first-login questionnaires: students (about themselves and how they work) and parents (family context). **Roles:** STUDENT, PARENT.

## Where it lives
| Frontend | Purpose |
|---|---|
| `pages/StudentOnboardingPage.jsx` | Grade 6+ questionnaire (`/student/onboarding`, standard band). The K-4 version is `student/pages/kid/KidOnboardingPage.jsx`. |
| `pages/ParentOnboardingPage.jsx` (`/parent/onboarding`) | Family form, required before the rest of the parent portal |
| `components/ParentFamilyForm.jsx` | The family form, reused on Parent My Profile ("About your family") |
| `components/CheckboxGroup.jsx`, `options.js`, `hooks/useOnboardingLookup.js` | Choice lists. Master-backed ones load via `GET /onboarding/lookups/:type`. |
| `services/onboarding.service.js` | `GET /onboarding/me`, `PUT /onboarding/student`, `PUT /onboarding/parent`, lookups |

**Backend:** `routes/onboarding.routes.js` (mounted with `authenticate` + `requireActiveSubscription({ roles: [STUDENT] })`) → `controllers/onboarding.controller.js` → `services/onboarding.service.js`. Lookup allowlist: `validators/onboarding.validator.js#LOOKUP_TYPES`. Data: `student_profiles` (grade, subjects, interests, strengths, challenges as CSV text; `learning_preferences` JSONB), `parent_profiles` (`family_context`, `child_context`, `family_onboarding` JSONB), `onboarding_completed_at`.

## Rules - read before changing
- **Gates:** `StudentLayout` sends a student without `profile.onboarding_completed_at` to `/student/onboarding` (exempt: onboarding, settings). `ParentLayout` sends a parent to `/parent/onboarding` until `GET /onboarding/me` says `completed`.
- `onboarding_completed_at` is stamped on the first save and kept on later edits. It means "ever finished", not "last edited".
- Student answers share columns with the parent/Super Admin child forms (CSV text), so all three stay in sync. Keep the CSV convention (`auth/components/profilePayload.js`).
- Submitted choices are validated against the active master items **plus** the person's previous values, so a later-deactivated item doesn't block re-saving.
- A new lookup type must be added to `LOOKUP_TYPES` (backend). The client can't widen what it reads.
- Parent family context is edited in two places (onboarding and My Profile) through the same `ParentFamilyForm`. Keep them as one component so the two can't drift.

## Verify
- UI: harness. Return `{ completed: false }` from `/onboarding/me` (parent) or omit `onboarding_completed_at` (student) to land on the form.
- Backend: api-tester. First save stamps the date, a re-save keeps it, and unknown values are refused.

## Related
`parent` (layout gate, My Profile), `student` (layout gate, kid onboarding), `auth` (profile fields), `masterManagement` (lists).
