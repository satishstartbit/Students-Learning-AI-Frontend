# auth module

Sign-in and account pages, the current-user API, and the **shared profile field groups** used by every user form. **Roles:** everyone. Super Admin signs in on a separate page.

## Where it lives
| Frontend | Purpose |
|---|---|
| `pages/LoginPage.jsx` (`/login`), `AdminLoginPage.jsx` (`/admin/login`) | Email/username + password. Super Admin uses `POST /auth/admin/login`. |
| `pages/RegisterPage.jsx`, `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx`, `VerifyEmailPage.jsx` | Public account flows (`PublicLayout`) |
| `components/RoleProfileFields.jsx` | Per-role profile fields (STUDENT/TEACHER/PARENT) shared by registration, admin create/edit, and parent add/edit child. `includeAdminOnly` switches free text to master dropdowns. `lookupFetcher` picks the endpoint. `layout="profile"` puts STUDENT fields in the two-column `pf-grid`. |
| `components/AddressFields.jsx` | Address group: Canada → province picker + "A1A 1A1" postal code with FSA auto-fill of city/province (`/postal-lookup/:fsa`); other countries → free text. `layout="profile"` gives the two-column version. |
| `components/profilePayload.js` | `buildProfilePayload(role, values)`: joins multi-select arrays to CSV, drops empty values |
| `components/ChangePasswordForm.jsx` | Change password (`compact` variant for My Profile) |
| `services/auth.service.js` | login/logout/register/me/verify/reset/change-password, `GET /auth/lookups/master/:type` |

Client session: `store/slices/authSlice.js` + `utils/auth.js`. Tokens and user are in localStorage `eflp.accessToken` / `eflp.user`. The client only checks the token's `exp`. Route guards: `routes/ProtectedRoutes.jsx`, `RoleRoutes.jsx`, `utils/permissions.js`.

**Backend:** `routes/auth.routes.js` → `controllers/auth.controller.js` → `services/auth.service.js` (sessions, refresh tokens, verification, reset) + `services/user.service.js#updateUser` (for `PATCH /auth/me`). Models: `User`, `UserSession`, `EmailVerification`, `PasswordReset`, `Role`, profile tables. Postal: `routes/postalLookup.routes.js`.

## Rules - read before changing
- `GET /auth/me` returns the full user (profile, photo URL, relationships, `timezone`, `locale`) and, for students, `gradeBand`. Layouts depend on this shape, so change it only with every consumer updated (`StudentLayout`, `AuthenticatedLayout`'s locale sync).
- `PATCH /auth/me` is self-only (always `req.user.id`, never an id from the body or URL) and allow-listed (`PROFILE_FIELDS`). Teacher/Parent/Super Admin only.
- Only hashes are stored for passwords, refresh tokens, reset and verification tokens. Change password revokes all sessions.
- Users have `timezone` and `locale` (default from env). The signed-in user's values drive every date display (`useSyncUserLocale`). Registration and forms offer `CANADIAN_TIMEZONES`.
- Phone numbers are validated and normalised to E.164 with libphonenumber (`utils/phone.js`, both apps), never a regex.
- `RoleProfileFields`/`AddressFields` are shared by several callers. New options must default to the current behaviour (e.g. `layout='stacked'`).
- Students can sign in with a username (`utils/username.js`).

## Verify
- `npx eslint src/modules/auth` · `npm run build`
- A change to the shared field groups: screenshot Register, Admin Create User, Parent Add/Edit child, and Teacher/Parent Profile.
- Backend: api-tester on a private backend. Login/me/logout, wrong-role 403, self-only PATCH.

## Related
`profile`, `parent`, `superAdmin`, `onboarding`.
