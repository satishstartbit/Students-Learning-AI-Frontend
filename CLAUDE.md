# Frontend - Claude context

React 19 + Vite, Tailwind v4 (`@layer utilities`), shadcn primitives in `src/components/ui`, and our own design system in `src/components/common`. The root `CLAUDE.md` localization rules apply here too.

**Each feature module has its own `CLAUDE.md`** (`src/modules/<module>/CLAUDE.md`). It is loaded when you work in that folder, and it lists the module's routes, API, backend files and the rules that must not break. Read it before changing the module. The index is at the bottom of this file.

## Commands
- `npm run dev` (port 5173, usually a colleague's running server, so don't stop it) · `npm run build` · `npx eslint <files>` · `npm test` (node:test, `src/**/*.test.js`, pure logic only)
- Headless UI checks with a mocked API: `.claude/testing/` (see its README and the `ui-tester` agent).

## Structure
| Path | What |
|---|---|
| `routes/routeConfig.js` | Every route per role (`path`, `label`, `permissions`, `component`, `props`). Student pages that differ by band use `GradeBandPage` with `props: { junior, standard }`. |
| `layouts/` | `SuperAdminLayout`, `TeacherLayout`, `ParentLayout` (onboarding + subscription gates), `StudentLayout` (grade band, check-in gate, subscription lock; K-5 → `KidLayout`, Grade 6+ → `AuthenticatedLayout`). The layouts render `<Toast />`, so pages must not render another. |
| `components/common/` | Button, Input, Select, MultiSelect, Modal, ConfirmationModal, DataTable, FilterBar, Tabs (`items` prop), Alert, Badge, StatusBadge, PageHeader, … Use these before writing new ones. |
| `hooks/` | `useApi` (loading/error/data + `run`), `useForm` (values, validation, `getFieldProps`), `useToast`, `useModal`, `usePhotoField`, `usePagination`, `useDebounce` |
| `utils/` | `date.js` (all date display), `format.js` (currency, names, initials), `locale.js` (active timezone/locale, `CANADIAN_TIMEZONES`), `phone.js`, `postalCode.js`, `gradeBand.js`, `permissions.js`, `constants.js` (roles and statuses), `errorHandler.js` |
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
- **Phone width:** 390px with no horizontal scroll.

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
| [parent](src/modules/parent/CLAUDE.md) | Parent overview, My Children, invite-teacher requests, progress, profile |
| [profile](src/modules/profile/CLAUDE.md) | Shared "My Profile" UI kit (cards, photo header, chips) |
| [progress](src/modules/progress/CLAUDE.md) | Shared student progress detail used by the parent and teacher Progress pages |
| [student](src/modules/student/CLAUDE.md) | Everything a student sees: home, plan, assignments, focus, rewards, notes, settings, K-5 kid UI |
| [subscription](src/modules/subscription/CLAUDE.md) | Parent subscription/checkout, paywall, admin subscriptions/payments/revenue |
| [superAdmin](src/modules/superAdmin/CLAUDE.md) | Users, relationships, teacher connections and requests, admin dashboard |
| [teacher](src/modules/teacher/CLAUDE.md) | Teacher dashboard, My Students, assignments list/form/details, progress, invitations |

`calendar`, `dashboard`, `focus`, `regulationToolkit`, `rewards` and `subscriptions` are empty placeholders (README stubs only). That code lives in `student` (focus, rewards, toolkit) and `subscription`.
