# Frontend - Claude context

React 19 + Vite, Tailwind v4 (`@layer utilities`), shadcn primitives in `src/components/ui`, and our own design system in `src/components/common`. The root `CLAUDE.md` localization rules apply here too.

**Each feature module has its own `CLAUDE.md`** (`src/modules/<module>/CLAUDE.md`). It is loaded when you work in that folder, and it lists the module's routes, API, backend files and the rules that must not break. Read it before changing the module. The index is at the bottom of this file.

## Commands
- `npm run dev` (port 5173, usually a colleague's running server, so don't stop it) · `npm run build` · `npx eslint <files>` · `npm test` (node:test, `src/**/*.test.js`, pure logic only)
- Headless UI checks with a mocked API: `.claude/testing/` (see its README and the `ui-tester` agent).

## Structure
| Path | What |
|---|---|
| `routes/routeConfig.js` | Every route per role (`path`, `label`, `permissions`, `component`, `props`). Student pages that differ by band use `GradeBandPage` with `props: { junior, standard }`. Pages are `lazy(() => import(...))` (one chunk each); `AppRoutes` wraps each in `Suspense`, so add new pages the same way. |
| `layouts/` | `SuperAdminLayout`, `TeacherLayout`, `ParentLayout` (onboarding + subscription gates), `StudentLayout` (grade band, check-in gate, subscription lock; K-5 → `KidLayout`, Grade 6+ → `AuthenticatedLayout`). The layouts render `<Toast />`, so pages must not render another. |
| `components/common/` | Button, Input, Select, MultiSelect, Modal, ConfirmationModal, DataTable, FilterBar, Tabs (`items` prop), Alert, Badge, StatusBadge, PageHeader, … Use these before writing new ones. |
| `hooks/` | `useApi` (loading/error/data + `run`), `useForm` (values, validation, `getFieldProps`), `useToast`, `useModal`, `usePhotoField`, `usePagination`, `useDebounce` |
| `utils/` | `date.js` (all date display), `format.js` (currency, names, initials), `locale.js` (active timezone/locale, `detectBrowserTimezone`), `canadianTimezone.js` (device zone → Canadian zone; there is no time zone picker), `phone.js`, `postalCode.js`, `gradeBand.js`, `permissions.js`, `constants.js` (roles and statuses), `errorHandler.js` |
| `theme/` | `variables.css` (tokens), `accent.css` (`data-accent` colour themes), `portalTheme.css` (`body.portal-theme` - Admin/Teacher/Parent), `studentTheme.css` (Grade 6+) · `styles/kid-theme.css` (`.kid-theme` - K-5) |
| `store/` | Redux: `authSlice` (token and user from localStorage `eflp.accessToken` / `eflp.user`), `themeSlice`, `uiSlice` |

## Conventions
- **API calls** only through a module's `services/*.service.js` (`utils/apiClient.js`). Responses are `{ success, message, data, meta }`. Use `getErrorMessage(err)` for the user-facing error text.
- **Colours** come from tokens only (`var(--color-*)`, `var(--accent-base|hover|soft|on)`, `--kid-*` under `.kid-theme`). Never use raw hex for app colours. Accent themes and dark mode must keep working.
- **Module CSS** sits next to its components with a short class prefix per module (listed in each module doc). Page wrappers get `td-page`.
- **Two student experiences:** `useStudentExperience().isJunior`. K-5 uses `components/kid/*`, `KidButton`, `PaperCard` and `font-kid-*` classes. Grade 6+ uses the standard student styles. The band is set at runtime by the backend (`/auth/me → gradeBand`, env `KIDS_UI`), with `VITE_KIDS_UI` as the fallback. A student feature normally needs both versions.
- **Admin-managed lists** (subjects, grades, moods, task types, difficulty reasons, body areas, available time, …) come from the API. Never hardcode them.
- **Confirmations and messages:** `ConfirmationModal` (`variant="danger"` for destructive actions) and `toast.*`. Never `window.confirm`/`alert`.
- **Lint:** `react-hooks/set-state-in-effect` (use derived state or a keyed remount) and `react-refresh/only-export-components` (put hooks and constants in their own files, e.g. `useX.js`, `xConfig.js`). On Windows, file names that differ only by case collide.
- **Phone width:** 390px (and 360px) with no horizontal scroll.
- **Phones and tablets (the mobile mockups):** below 1024px Teacher, Parent and Grade 6+ Student get a top bar (brand, bell, avatar → "More" sheet with the non-tab pages and Log out) and a five-tab bar instead of the sidebar: `layouts/MobileChrome.jsx` + `mobileChrome.css` (`am-`), tabs in each layout's `MOBILE_TABS`, shared helpers in `layouts/navConfig.js`. Super Admin (no tabs) keeps the sidebar, which is a drawer below 768px. K-5 has its own tab bar (`KidChrome`).
- **Shared phone rules** live in `components/common/responsive.css` (loaded after `common.css`): dialogs are bottom sheets at ≤640px (primary button on top, full width); page-header actions go full width; every `Table` becomes "label · value" cards below 768px (the column header is the label; `mobileLabel`, `hideOnMobile`, `mobileCards={false}` to opt out). A page with its own card design passes `DataTable renderCard={row => …}`, and `cardsBelow={1024|1280}` when its table is too wide for a tablet or a laptop with the sidebar open. Stat rows use `.ui-statgrid`. Grids with a fixed minimum use `minmax(min(Npx, 100%), 1fr)`.
- **Visually hidden text** (`.ui-sr-only`) is pinned top-left of its container (responsive.css); before that, a hidden label inside a sideways-scrolling box made the whole page scroll.
- **Failures have their own views** (`components/status/*`, prefix `st-`; pages in `src/pages/status/`):
  - `ErrorState` classifies the error (`utils/errorKind.js#classifyError`: offline, unreachable, timeout, maintenance 503, server 5xx, notFound 404, forbidden 403, generic) and shows the matching `StatusView`. Offline and can't-reach **retry by themselves** when the connection is back (`hooks/useConnection.js#useRetryWhenReconnected`). A 404 offers Go back, not Try again. Only generic errors use the caller's `title` and the server's message. Just pass the error: `<ErrorState error={x.error} onRetry={reload} />` (`variant="compact"` in dialogs). K-5 uses `KidOops` - pass `error` there too.
  - 5xx bodies are never shown (`utils/errorHandler.js` swaps them for friendly text).
  - `NetworkStatusBanner` (mounted in `App.jsx`): "You're offline" / "Can't reach the server" (polls the backend's `/health`, `utils/apiClient.js#checkServer`) / "You're back online". The API client keeps `utils/connectivity.js` current.
  - Unknown addresses: `NotFoundPage` full screen, or `inShell` inside a role area (each role group has a `*` route in `AppRoutes`).
  - A page that throws while rendering: `AppErrorBoundary` shows `ServerErrorPage` (around the router, and `inShell` around each shell's page area - it clears on the next navigation).
  - Opening the site with no internet: `public/sw.js` (production builds only) serves `public/offline.html`. It caches nothing else. The static page repeats the default colour tokens and reads the product name from `localStorage['eflp.appName']`.
  - Test: `.claude/testing/scenarios/status-pages.mjs`.
- **Check a layout change** with `.claude/testing/functional/responsive-sweep.mjs` (every Teacher/Parent/Student page at 360, 390, 820, 1024, 1440, real private backend, zz accounts, contact sheets for review).

## Module docs (index)
| Module | Owns |
|---|---|
| [aiAssistant](src/modules/aiAssistant/CLAUDE.md) | Student AI learning assistant, parent learning summary, teacher learning activity |
| [assignments](src/modules/assignments/CLAUDE.md) | Shared assignment pieces: question builder, media pickers, student answer UI, assignment + curriculum services |
| [auth](src/modules/auth/CLAUDE.md) | Login/register/reset/verify, `/auth/me`, shared profile field groups (RoleProfileFields, AddressFields) |
| [checkIn](src/modules/checkIn/CLAUDE.md) | Daily check-in (moods, energy, body areas, time), K-5 required gate, difficulty picker |
| [invitations](src/modules/invitations/CLAUDE.md) | Teacher invitation token page and status labels |
| [masterManagement](src/modules/masterManagement/CLAUDE.md) | Super Admin master data (generic engine + dedicated masters) |
| [notifications](src/modules/notifications/CLAUDE.md) | Bell, unread count, per-role routing of notifications |
| [onboarding](src/modules/onboarding/CLAUDE.md) | Student first-login questionnaire, parent family form |
| [parent](src/modules/parent/CLAUDE.md) | Parent overview, My Children (children + parents, archive/restore), sidebar, invite-teacher requests, progress, profile |
| [planner](src/modules/planner/CLAUDE.md) | Growing Focus: server plan (Next up, Today/Next/Later, views, study blocks), adding work (type/voice/photo/PDF), study & busy times, help when stuck, sharing own work, parent Schedule |
| [platform](src/modules/platform/CLAUDE.md) | Super Admin Platform settings (business rules as versioned data), System status, AI usage |
| [profile](src/modules/profile/CLAUDE.md) | Shared "My Profile" UI kit (cards, photo header, chips) |
| [progress](src/modules/progress/CLAUDE.md) | Shared student progress detail used by the parent and teacher Progress pages |
| [student](src/modules/student/CLAUDE.md) | Everything a student sees: home, plan, assignments, focus, rewards, notes, settings, K-5 kid UI |
| [subscription](src/modules/subscription/CLAUDE.md) | Parent subscription/checkout, paywall, admin subscriptions/payments/revenue |
| [superAdmin](src/modules/superAdmin/CLAUDE.md) | Users, relationships, teacher connections and requests, admin dashboard |
| [teacher](src/modules/teacher/CLAUDE.md) | Teacher dashboard, My Students, assignments list/form/details, progress, invitations |

`calendar`, `dashboard`, `focus`, `regulationToolkit`, `rewards` and `subscriptions` are empty placeholders (README stubs only). That code lives in `student` (focus, rewards, toolkit) and `subscription`.
