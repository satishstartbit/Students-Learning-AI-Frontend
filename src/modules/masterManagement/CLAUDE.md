# masterManagement module

Super Admin's master data: every admin-editable list the app reads (moods, subjects, grades, task types, difficulty reasons, rewards, avatars, plans, …). **Role:** SUPER_ADMIN edits. Everyone else reads active items through lookup endpoints.

## Where it lives
| Frontend | Purpose |
|---|---|
| `pages/MasterDashboardPage.jsx` (`/admin/masters`) + `masterDashboard.css` (`mm-`) | Stat tiles and a table of every master with counts |
| `pages/MasterListPage.jsx`, `MasterFormPage.jsx` (`/admin/masters/:masterType`, `/create`, `/:id/edit`; registered **after** the dedicated routes in `routeConfig.js` because it is a catch-all) | **Generic engine** pages for any `master_types` row. `components/DynamicExtraFields.jsx` renders the type's `field_schema` extras; `IconField.jsx` handles emoji or uploaded icons; `GradeRangeFields.jsx`. |
| `pages/<area>/*ListPage.jsx` + `*FormPage.jsx` | **Dedicated masters** with a fixed shape: academic years, schools, regulation activities, reward activities, student rewards, subscription plans, discount codes, themes, avatars, sticky-note styles, stickers, and curriculum (task types, subjects, topics, audio tracks, question types via `components/CurriculumMasterList.jsx`) |
| `components/masterPages.css` (`ms-`) | `.ms-form`: form card capped at 760px, two columns (one under 720px) |
| `services/*.service.js` | `masterGeneric.service.js` (`/admin/master/types`, `/admin/master/:type/items…`), plus `academic`, `billing`, `reward`, `regulation`, `appearance`, `curriculum`, `dashboard` |

**Backend:** `routes/admin.routes.js` → `/admin/master` → `routes/master.routes.js` (nests `masterGeneric`, `masterAcademic`, `masterBilling`, `masterReward`, `masterRegulation`, `masterAppearance`, `masterCurriculum` routes; `middlewares/resolveMasterType.middleware.js`) → matching controllers/services/repositories. Generic tables: `master_types` (code, `field_schema`) and `master_items` (name, code, icon, `extra` JSONB, `display_order`, `is_active`). Read side for other roles: `routes/masterLookup.routes.js` (`/lookups/:type`, `/lookups/difficulty-picker`, allowlist `services/masterLookup.service.js#LOOKUP_TYPES`), plus `/parent/lookups/master/:type`, `/teacher/lookups/*`, `/auth/lookups/master/:type`, `/onboarding/lookups/:type`.

## Rules - read before changing
- **New databases get the masters from migrations.** `seeders/masterData/masterData.json` is a snapshot of every dashboard master (plans and discount codes excluded). Migration 111 and `npm run db:seed:masters` load it idempotently: insert missing rows, update only rows nobody has edited, never delete. After changing masters that other environments need, run `npm run db:masters:export`. Databases that already ran 111 then need `db:seed:masters` or a new migration that calls `applyMasterData`. A dedicated master table added later goes into `TABLES` in `seeders/masterData/masterData.js`.
- **Nothing the admin can edit is hardcoded elsewhere.** A new admin-managed list is a `master_types` row, seeded idempotently, with per-type fields in `field_schema` → `extra`. It only needs a dedicated table if it has real relations.
- `extra` is validated against the type's `field_schema` in `masterGeneric.service.js`, not in a static Joi schema.
- **Delete vs deactivate:** delete is refused while a record is in use ("…deactivate it instead") via real FK checks. Deactivated items vanish from pickers but must still resolve for history (e.g. old check-ins show their mood). Activate/deactivate writes an audit row.
- **Non-admins read only through lookup endpoints with an allowlist.** Adding a type readable by students, parents or teachers means editing `LOOKUP_TYPES` (or the role's lookup route). Clients can't widen it.
- Cross-list links live in `extra` (e.g. difficulty reasons → support strategies, used by `/lookups/difficulty-picker`). Emotional States carry `code`, icon or uploaded icon, background colour and `extra.intensity_level` (drives check-in alerts).
- **Schoolwork views (migration 112):** Subjects carry `extra.color` - the one colour a subject has everywhere (sticky notes, list, calendar, Home, teacher lists; a student may pick their own on top). Assignment Types carry an `icon` (the kind of own work), and curriculum **Task Types** have an `icon` column (the form's Icon field, shown in the list) for teacher work. **Personal Activity Categories** (`activity_categories`: Extracurricular, Personal / family, Social plans, Appointment, Other; `code` + icon + `extra.color`) label busy times on the full calendar; students and parents read them via `LOOKUP_TYPES`. 112 only fills empty values, so an admin's choices are never overwritten.
- Uploaded icons and pictures go through private storage. The old file is deleted only after the DB write commits.
- A pre-existing bug fixed earlier: `masterAppearance.service#pickFields` didn't copy `name`. When adding fields to a dedicated master, check the service's field pick-list.
- UI conventions: compact `FilterBar`, icon row actions (edit/view accent, activate green, deactivate amber, delete red), `ConfirmationModal` for delete/deactivate, `.ms-form` two-column forms.

## Verify
- UI: harness with `USERS.superAdmin`. List + create + edit for the master you changed, at 1366px and 390px.
- Backend: api-tester. `extra` validation, delete refused when in use, lookup allowlist returns 404 for unknown types, deactivated items hidden from lookups.
- Seeders: check the seeder's idempotency guard (insert only where the natural key is missing) by reading it. Never re-seed the shared DB without asking.

## Related
Consumers: `checkIn` (moods, body areas, time, difficulty), `assignments` (task types, subjects, topics, question types, audio), `student` (avatars, rewards, toolkit, stickers, note styles), `subscription` (plans, discount codes), `auth`/`onboarding` (grades, subjects, strengths…).
