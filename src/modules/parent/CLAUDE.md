# parent module

The parent's side of the portal: an overview, their children, asking for teachers, progress, and their own profile. **Role:** PARENT (Super Admin reaches some endpoints for support).

## Where it lives
| Frontend | Purpose |
|---|---|
| `pages/ParentDashboardPage.jsx` (`/parent`, "Overview") | Family overview (`GET /parent/dashboard`). CSS `components/dashboard/parentDashboard.css` (`pd-`) |
| `pages/ParentChildrenPage.jsx` (`/parent/children`, "My Children"; `/parent/family` redirects here) | One page for the whole family, top to bottom: plan usage (`PlanUsage`), **Children** section with Add child (off when the plan is full, reason shown), then **Parents** section (`ParentsSection`). Sidebar entry "My Children", phone tab "Children". Child cards: subjects (coloured per subject, teacher `SubjectChips`), teachers (grouped per teacher), invitations, actions. Card foot per the mobile mockup: **View details** (outlined), Edit, Set password; ⋮ menu: View progress, Invite a teacher, Remove child. CSS `parentChildren.css` (`pc-`) |
| `components/AddChildModal.jsx`, `EditChildModal.jsx` | Create/edit a child account. Laid out like My Profile (`ProfileHeaderCard`, `ProfileSection`, `pf-grid`), dialog class `pc-childform`. The photo saves with the form. |
| `components/ChildDetailsModal.jsx` | "View details": profile, teachers, invitations |
| `components/InviteTeacherModal.jsx`, `TeacherInvitationsList.jsx` | "Invite a teacher for Sam" (the mobile mockup, a bottom sheet on phones): subjects as tap-to-toggle chips (up to 10) → grade (set from the child's profile) → teacher picker ("Showing Grade 1 teachers who teach Math or Science"), or email. The button stays **Send request**, since Super Admin approves before any invitation goes out. Shows request/invitation status. |
| `components/SetChildPasswordModal.jsx` | Parent sets the child's password |
| `components/FamilyParents.jsx` (`PlanUsage`, `ParentsSection`) + `AddParentModal.jsx`, `parentFamily.css` (`pm-`) | Used by My Children. Plan usage (children / parents vs the plan) and one card per parent, Add parent / Remove from family (account holder only). The page's section blocks are `pm-block` / `pm-sectionhead`. Wording in `familyLimits.js` (+ test). The separate Family Members page was merged in (2026-09-28). |
| Sidebar: `layouts/ParentLayout.jsx` `NAV_ITEMS` + `components/ViewingChildPicker.jsx`, `viewingChild.css` (`vc-`) | To the parent sidebar mockup. The first section (`withExtra`, `vc-frame`) is one thin accent-outlined box: the tinted VIEWING card (the whole card is the button; "VIEWING" above avatar · name/grade · chevron) and Overview / Progress / Learning Summary. Then "Family" (`vc-section`): My Children, My Profile, Subscription, Notifications. Links 44px, regular weight until active. `AppSidebar` supports `withExtra` / `className` on any section. Collapsed rail shows only the avatar. |
| `pages/ParentProgressPage.jsx` (`/parent/progress`) | Progress per child using `progress/StudentProgressDetail`. CSS `parentPanels.css` (`pp-`) |
| `pages/ParentProfilePage.jsx` (`/parent/profile`) | My Profile: details, address, family form, colour theme, password |
| `services/parent.service.js` | All `/parent/*` calls. `masterOptionsFetcher` feeds master dropdowns for RoleProfileFields. |
| Learning summary page | lives in `aiAssistant` (`/parent/learning-summary`) |

**Backend:** `routes/parent.routes.js` (mounted at `/parent`, behind `subscriptionGated`) → `controllers/parent.controller.js` + `teacherInvitation.controller.js` → `services/parent.service.js`, `family.service.js` (+ `repositories/family.repository.js`), `parentDashboard.service.js`, `progress.service.js`, `teacherInvitation.service.js`, `checkInAlert.service.js`. Models: `User`, `StudentProfile`, `ParentProfile`, `UserRelationship` (`parent_child`, `teacher_student`, `co_parent`), `TeacherInvitation`.

## API
`GET /parent/family` · `POST /parent/family/parents` · `DELETE /parent/family/parents/:id` · `GET /parent/dashboard` · `GET|POST /parent/children` · `GET|PATCH|DELETE /parent/children/:id` · `PATCH /parent/children/:id/password` · `GET /parent/progress` · `GET /parent/children/:id/progress` · `DELETE /parent/children/:childId/teachers/:relationshipId` · `GET /parent/teacher-directory` · `GET|POST /parent/children/:childId/teacher-invitations` · `POST /parent/teacher-invitations/:id/resend|cancel` · `GET /parent/lookups/master/:type` · `GET /parent/lookups/academic-years` · `GET /parent/learning-summary`, `/parent/children/:id/learning-summary`

## Rules - read before changing
- **ParentLayout gates:** until the family form (onboarding) is done, every page redirects to `/parent/onboarding`. With no subscription in force, only Subscription, My Profile and the family form are reachable (backend returns 403 `SUBSCRIPTION_REQUIRED`).
- **Parents never link teachers directly.** "Invite a teacher" files a **request** (`awaiting_approval`). Super Admin approves it (the invitation email goes to the teacher) or rejects it with a note that the family sees. See `superAdmin` and `invitations`. Status labels come from `invitations/invitationStatus.js`.
- One open request/invitation per child + teacher email (partial unique index). The UI must show "Awaiting approval" / "Not approved" / pending states, never a raw status.
- Parents only ever see their own children: every `/parent/children/:id…` endpoint checks the `parent_child` link in the service. Keep that check when adding endpoints.
- **Families and plan limits** (`family.service.js`): the parent who pays is the **account holder**; extra parents hang off them as `co_parent` rows (user_id = holder, one family per extra parent, migration 103) and get `parent_child` rows for every family child, so the ownership checks above just work. The holder's plan sets `max_students` (children) and `max_parents` (parents, holder included); blank = no limit, and lowering a limit never removes anyone. Adding a child or parent re-checks the limit under a `family:<holderId>` advisory lock inside the create transaction (`userService.createUser` `onCreated`). A new child is linked to every family parent; Remove child removes it from the whole family. Only the holder adds/removes parents and manages billing; a removed parent keeps their account but loses the children and the plan. A new extra parent skips the family form (marked done).
- Child forms reuse `auth/components/RoleProfileFields` (`role="STUDENT"`, `includeAdminOnly`, `lookupFetcher={parentService.masterOptionsFetcher}`, `layout="profile"`) and `AddressFields layout="profile"`. Grade, strengths, subjects etc. are master data. Master multi-selects are stored as CSV and split/joined via `profilePayload.js`.
- Canadian address rules: province picker and "A1A 1A1" postal code when the country is Canada, free text otherwise (`AddressFields`). The postal code FSA auto-fills city/province.
- Every Super Admin change to a child's teacher connections notifies the parents in-app (`teacherConnection.service#tellFamily`). Parent UI copy shouldn't promise email for those.

## Verify
- `npx eslint src/modules/parent` · `npm run build`
- UI: `.claude/testing` harness with `USERS.parent`. ParentLayout needs `/onboarding/me → { completed: true }` and `/subscriptions/access → { hasAccess: true }` (harness defaults).
- Backend: api-tester with a zz parent + zz child. Check that another parent's child id returns 404.
- Family limits + My Children UI + sidebar: `.claude/testing/scenarios/family-plan-limits.mjs` (mocked API, 38 checks, including the `/parent/family` redirect and the sidebar box/card).

## Related
`invitations`, `superAdmin` (approves requests), `progress`, `aiAssistant` (learning summary), `profile`, `onboarding`, `subscription`.
