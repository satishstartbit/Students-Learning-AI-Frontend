# auth module

Sign-in and account pages, the current-user API, and the **shared profile field groups** used by every user form. **Roles:** everyone. Super Admin signs in on a separate page.

## Where it lives
| Frontend | Purpose |
|---|---|
| `components/AuthSplitLayout.jsx` + `authSplit.css` (`lg-`) | The shared frame for `/login`, `/register`, `/forgot-password` and `/reset-password`. **Desktop:** photo hero on the left (600px, `public/image/39b1fbfc….png`, glass cards that illustrate the app, not live data) with the page on the right. **Phone:** the hero becomes a banner carrying the title and "< Back". Wrapped in `data-accent="forest"` (green on these pages only), Poppins headings, Nunito text, brand from `APP_NAME` (`VITE_APP_NAME`, default "Growing Focus"). Props: `title`, `lead`, `back` (`{ to }` or `{ onClick }`), `wide`. All four routes are `fullPage`: `AppRoutes` renders them without `PublicLayout`'s column. |
| `pages/LoginPage.jsx` (`/login`) | States: normal; wrong password ("That didn't match" + "You have N tries left before sign-in pauses"); paused (fields locked, live "Try again in m:ss", Reset my password); **unverified teacher/parent** (right password, `EMAIL_NOT_VERIFIED`) → the shared "Check your email" step, which sends a fresh code as it opens and signs them in once it's entered. |
| `pages/RegisterPage.jsx` (`/register`) + `components/CodeInput.jsx` | **Sign-up:** "I'm signing up as" parent/teacher cards, first/last name, email, password, terms. No phone or profile fields; those come later in onboarding and My Profile. `confirmPassword` is sent equal to `password`. **Then "Check your email"** (`components/VerifyEmailStep.jsx`, shared with `/login`): 6 code boxes (paste, autofill, arrows), verifies when the last digit is typed, shows wrong and expired states, a 45s resend countdown, and "The email didn't go out" when the API says `emailSent: false`. An email that's already signed up gets "You already have an account" with a Sign in link (sign-in leads to a fresh code). A verified account is **signed straight in**. "Back" keeps the form, and re-submitting the same email returns to the code without creating a duplicate. **Teacher invitation** (`?invite=`): the role is fixed, name and email are prefilled, the address counts as proven, so there's no code step and they're signed in at once. |
| `AdminLoginPage.jsx` (`/admin/login`) | Super Admin email + password (`POST /auth/admin/login`), still in `PublicLayout`. |
| `pages/ForgotPasswordPage.jsx` (`/forgot-password`) | Built to the reset mockups, four steps on one page: **"Forgot your password? 🔑"** (username or email, the "Students" note, Send code) → **"Enter your reset code 🔢"** (6 boxes, checked when the last digit is typed; wrong/expired clear the boxes and refocus; resend after a 45s countdown; Back keeps the name, and re-sending the same name inside the wait returns to the same code) → **"Choose a new password 🔒"** → **"Password updated 🎉"**. |
| `pages/ResetPasswordPage.jsx` (`/reset-password?token=`) | The emailed link (Super Admin reset, set-a-password invite). Same last two steps; no token → "This link is incomplete". |
| `components/PasswordResetSteps.jsx` + `passwordReset.js` (+ `.test.js`) | `NewPasswordStep` (live checklist: 8 characters, upper, lower, number; confirm; `restart` for "Start again"), `PasswordUpdatedStep`, `ResetAlert`. Pure helpers: `PASSWORD_RULES`/`checkPassword`, `codeSentLine`, `codeProblem`, `clock`. |
| `pages/VerifyEmailPage.jsx` | `/verify-email?token=` link (`PublicLayout`) |
| `components/RoleProfileFields.jsx` | Per-role profile fields (STUDENT/TEACHER/PARENT) shared by registration, admin create/edit, and parent add/edit child. `includeAdminOnly` switches free text to master dropdowns. `lookupFetcher` picks the endpoint. `layout="profile"` puts STUDENT fields in the two-column `pf-grid`. |
| `components/AddressFields.jsx` | Address group: Canada → province picker + "A1A 1A1" postal code with FSA auto-fill of city/province (`/postal-lookup/:fsa`); other countries → free text. `layout="profile"` gives the two-column version. |
| `components/profilePayload.js` | `buildProfilePayload(role, values)`: joins multi-select arrays to CSV, drops empty values |
| `components/ChangePasswordForm.jsx` | Change password (`compact` variant for My Profile; `layout="profile"` for a full-width card: current password at half width, new + confirm side by side; default `stacked`) |
| `services/auth.service.js` | login/logout/register/me/verify/forgot (`{identifier}`)/verify-reset-code/reset/change-password, `GET /auth/lookups/master/:type` |

Client session: `store/slices/authSlice.js` + `utils/auth.js`. Tokens and user are in localStorage `eflp.accessToken` / `eflp.user`. The client only checks the token's `exp`. Route guards: `routes/ProtectedRoutes.jsx`, `RoleRoutes.jsx`, `utils/permissions.js`.

**Backend:** `routes/auth.routes.js` → `controllers/auth.controller.js` → `services/auth.service.js` (sessions, refresh tokens, verification, reset) + `services/user.service.js#updateUser` (for `PATCH /auth/me`). Models: `User`, `UserSession`, `EmailVerification`, `PasswordReset`, `Role`, profile tables. Postal: `routes/postalLookup.routes.js`.

## Rules - read before changing
- `GET /auth/me` returns the full user (profile, photo URL, relationships, `timezone`, `locale`) and, for students, `gradeBand`. Layouts depend on this shape, so change it only with every consumer updated (`StudentLayout`, `AuthenticatedLayout`'s locale sync).
- `PATCH /auth/me` is self-only (always `req.user.id`, never an id from the body or URL) and allow-listed (`PROFILE_FIELDS`). Teacher/Parent/Super Admin only.
- Only hashes are stored for passwords, refresh tokens, reset and verification tokens. Change password revokes all sessions.
- **Email verification by code** (migration 101: `email_verifications.kind` `'link'|'code'`, `attempts`): register and resend issue both a link and a 6-digit code. Only a hash of `<user_id>:<code>` is stored, and only the newest code counts. `POST /auth/verify-email-code {email, code}`:
  - A wrong code replies 400 `{ code: 'INVALID_CODE', attemptsLeft }`.
  - An expired code, or the `VERIFICATION_CODE_MAX_ATTEMPTS`th wrong one (default 5), replies `{ code: 'CODE_EXPIRED' }`.
  - An unknown address gets the same INVALID_CODE reply.
  - Settings: `VERIFICATION_CODE_MINUTES` (10), and `VERIFICATION_RESEND_SECONDS` (45) enforced server-side on `/resend-verification`.
  - Register (`verification.emailSent`) and resend (`emailSent`) say whether the provider accepted the message; false only when a send was attempted and failed.
  - Sign-in by a teacher/parent with the right password but no verified email: 403 `{ code: 'EMAIL_NOT_VERIFIED', email }` (the address is only revealed after a correct password). Students and Super Admins are never asked to verify.
  - Super Admin: `POST /admin/users/:id/resend-verification` (`{ emailSent }`, no wait, audited) and `POST /admin/users/:id/mark-email-verified` (teacher/parent only, audited).
  - Outside production the code is logged to the server console.
  - The link route `/verify-email?token=` still works.
  - Test: `.claude/testing/functional/register-verify.mjs`.
- **A reset verifies the address (2026-10-01):** `POST /auth/reset-password` sets `email_verified_at` for an unverified teacher/parent, because their link or code only ever goes to their own address. So someone Super Admin created can set a password from the emailed link and sign straight in, without a second email (the verification code). Students are untouched.
- **Password reset by code** (migration 102: `password_resets.kind` `'link'|'code'`, `attempts`):
  - `POST /auth/forgot-password {identifier}` (username, email or phone; the older `{email}` still works) sends a 6-digit code. A **student's code goes to their active parents** (their own email only if they have none), and the email names the child. Always 200 with `{ method, codeLength, expiresInMinutes, resendAfterSeconds }`. At most one code per `PASSWORD_RESET_RESEND_SECONDS` (45); only the newest counts.
  - `POST /auth/verify-reset-code {identifier, code}`: 400 `INVALID_CODE` or `CODE_EXPIRED` (after `PASSWORD_RESET_CODE_MINUTES` 10, a used code, or the `PASSWORD_RESET_CODE_MAX_ATTEMPTS`th (5) wrong try, claimed atomically so parallel guesses can't pass it). A right code is used up and swapped for `{ resetToken }`, a `'link'` row valid for `PASSWORD_RESET_AFTER_CODE_TTL` (15m).
  - `POST /auth/reset-password {token, …}` accepts `'link'` rows only (a code hash must never pass as a token), and expires every other open code/link for the account.
  - **No enumeration:** unknown names get identical replies, down to `CODE_EXPIRED` after the same wrong tries (in-memory stand-in). The mockup's masked line ("n•••n@yopmail.com, the grown-up on Sanjay's account") needs `PASSWORD_RESET_SHOW_DESTINATION=true`, which adds `destination { emails, toGuardian, accountFirstName }` and so reveals that the account exists. Off by default; the page then says "If there's an account for …".
  - Outside production the code is logged to the server console. Test: `.claude/testing/functional/password-reset.mjs` (two private backends, email captured) and `scenarios/forgot-password-page.mjs` (mocked UI).
- **Sign-in pause** (`auth.service` "sign-in pause", migration 100: `users.failed_login_count`, `login_locked_until`): wrong passwords reply 401 with `errors[0] = { code: 'INVALID_CREDENTIALS', attemptsLeft }`. The `LOGIN_MAX_ATTEMPTS`th in a row (default 5) pauses the account for `LOGIN_PAUSE_MINUTES` (default 10), replying 429 `{ code: 'SIGNIN_PAUSED', lockedUntil, retryAfterSeconds, pauseMinutes }`. While paused, even the right password is refused. A good sign-in or a password reset clears it. Unknown usernames get identical replies from an in-memory counter, so replies never reveal whether an account exists. Applies to `/auth/admin/login` too. The IP rate limit (`AUTH_RATE_MAX`, 10 per 15 min) stays as a backstop. The login thunk passes `status` + `errors` through (`authSlice`). Test: `.claude/testing/functional/login-pause.mjs`.
- Users have `timezone` and `locale` (default from env). The signed-in user's values drive every date display (`useSyncUserLocale`). No form asks for a time zone: registration sends the device's Canadian zone (`detectBrowserTimezone`), and `useSyncUserLocale` → `hooks/useDeviceTimezone.js` saves it with `PATCH /auth/me/timezone` (any role, Canadian zones only, `validators/auth.validator.js#updateMyTimezone`) whenever it differs. `PATCH /auth/me` still accepts `timezone` but the pages no longer send it.
- Phone numbers are validated and normalised to E.164 with libphonenumber (`utils/phone.js`, both apps), never a regex.
- `RoleProfileFields`/`AddressFields` are shared by several callers. New options must default to the current behaviour (e.g. `layout='stacked'`).
- **Students sign in with their username only** (`utils/username.js`). They have no email or phone (migration 104 made `users.email` nullable); an older student's email or phone is answered exactly like an unknown name, before the password is checked (`auth.service#authenticate`). Teachers and parents still use username, email or phone.

## Verify
- `npx eslint src/modules/auth` · `npm run build`
- A change to the shared field groups: screenshot Register, Admin Create User, Parent Add/Edit child, and Teacher/Parent Profile.
- Backend: api-tester on a private backend. Login/me/logout, wrong-role 403, self-only PATCH.

## Related
`profile`, `parent`, `superAdmin`, `onboarding`.
