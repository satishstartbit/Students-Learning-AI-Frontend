# parent module

The parent's side of the portal: an overview, their children, asking for teachers, progress, and their own profile. **Role:** PARENT (Super Admin reaches some endpoints for support).

## Where it lives
| Frontend | Purpose |
|---|---|
| `pages/ParentDashboardPage.jsx` (`/parent`, "Overview") | Family overview (`GET /parent/dashboard`). CSS `components/dashboard/parentDashboard.css` (`pd-`) |
| `pages/ParentChildrenPage.jsx` (`/parent/children`) | One card per child: subjects (coloured per subject, teacher `SubjectChips`), teachers (grouped per teacher), invitations, actions. Card foot per the mobile mockup: **View details** (outlined), Edit, Set password; ⋮ menu: View progress, Invite a teacher, Remove child. CSS `parentChildren.css` (`pc-`) |
| `components/AddChildModal.jsx`, `EditChildModal.jsx` | Create/edit a child account. Laid out like My Profile (`ProfileHeaderCard`, `ProfileSection`, `pf-grid`), dialog class `pc-childform`. The photo saves with the form. |
| `components/ChildDetailsModal.jsx` | "View details": profile, teachers, invitations |
| `components/InviteTeacherModal.jsx`, `TeacherInvitationsList.jsx` | "Invite a teacher for Sam" (the mobile mockup, a bottom sheet on phones): subjects as tap-to-toggle chips (up to 10) → grade (set from the child's profile) → teacher picker ("Showing Grade 1 teachers who teach Math or Science"), or email. The button stays **Send request**, since Super Admin approves before any invitation goes out. Shows request/invitation status. |
| `components/SetChildPasswordModal.jsx` | Parent sets the child's password |
| `pages/ParentProgressPage.jsx` (`/parent/progress`) | Progress per child using `progress/StudentProgressDetail`. CSS `parentPanels.css` (`pp-`) |
| `pages/ParentProfilePage.jsx` (`/parent/profile`) | My Profile: details, address, family form, colour theme, password |
| `services/parent.service.js` | All `/parent/*` calls. `masterOptionsFetcher` feeds master dropdowns for RoleProfileFields. |
| Learning summary page | lives in `aiAssistant` (`/parent/learning-summary`) |

**Backend:** `routes/parent.routes.js` (mounted at `/parent`, behind `subscriptionGated`) → `controllers/parent.controller.js` + `teacherInvitation.controller.js` → `services/parent.service.js`, `parentDashboard.service.js`, `progress.service.js`, `teacherInvitation.service.js`, `checkInAlert.service.js`. Models: `User`, `StudentProfile`, `ParentProfile`, `UserRelationship` (`parent_child`, `teacher_student`), `TeacherInvitation`.

## API
`GET /parent/dashboard` · `GET|POST /parent/children` · `GET|PATCH|DELETE /parent/children/:id` · `PATCH /parent/children/:id/password` · `GET /parent/progress` · `GET /parent/children/:id/progress` · `DELETE /parent/children/:childId/teachers/:relationshipId` · `GET /parent/teacher-directory` · `GET|POST /parent/children/:childId/teacher-invitations` · `POST /parent/teacher-invitations/:id/resend|cancel` · `GET /parent/lookups/master/:type` · `GET /parent/lookups/academic-years` · `GET /parent/learning-summary`, `/parent/children/:id/learning-summary`

## Rules - read before changing
- **ParentLayout gates:** until the family form (onboarding) is done, every page redirects to `/parent/onboarding`. With no subscription in force, only Subscription, My Profile and the family form are reachable (backend returns 403 `SUBSCRIPTION_REQUIRED`).
- **Parents never link teachers directly.** "Invite a teacher" files a **request** (`awaiting_approval`). Super Admin approves it (the invitation email goes to the teacher) or rejects it with a note that the family sees. See `superAdmin` and `invitations`. Status labels come from `invitations/invitationStatus.js`.
- One open request/invitation per child + teacher email (partial unique index). The UI must show "Awaiting approval" / "Not approved" / pending states, never a raw status.
- Parents only ever see their own children: every `/parent/children/:id…` endpoint checks the `parent_child` link in the service. Keep that check when adding endpoints.
- Child forms reuse `auth/components/RoleProfileFields` (`role="STUDENT"`, `includeAdminOnly`, `lookupFetcher={parentService.masterOptionsFetcher}`, `layout="profile"`) and `AddressFields layout="profile"`. Grade, strengths, subjects etc. are master data. Master multi-selects are stored as CSV and split/joined via `profilePayload.js`.
- Canadian address rules: province picker and "A1A 1A1" postal code when the country is Canada, free text otherwise (`AddressFields`). The postal code FSA auto-fills city/province.
- Every Super Admin change to a child's teacher connections notifies the parents in-app (`teacherConnection.service#tellFamily`). Parent UI copy shouldn't promise email for those.

## Verify
- `npx eslint src/modules/parent` · `npm run build`
- UI: `.claude/testing` harness with `USERS.parent`. ParentLayout needs `/onboarding/me → { completed: true }` and `/subscriptions/access → { hasAccess: true }` (harness defaults).
- Backend: api-tester with a zz parent + zz child. Check that another parent's child id returns 404.

## Related
`invitations`, `superAdmin` (approves requests), `progress`, `aiAssistant` (learning summary), `profile`, `onboarding`, `subscription`.
