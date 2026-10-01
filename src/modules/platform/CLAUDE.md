# platform module

Super Admin tools for running the platform: versioned **Platform settings** (business rules as data), **System status** and **AI usage**. **Role:** SUPER_ADMIN. CSS prefix `ps-` (`platform.css`).

## Where it lives
| Frontend | Purpose |
|---|---|
| `pages/PlatformSettingsPage.jsx` (`/admin/settings`) | Every setting by category, with its published version |
| `pages/PlatformSettingPage.jsx` (`/admin/settings/:key`) | Edit a draft → Check → Publish (reason required) → history with Rollback. The form is drawn from the setting's own field list (`components/SettingsFieldEditor.jsx`, recursive: text, textarea, integer, number, boolean, select, multiselect, tags, integerList, object, list) |
| `pages/SystemStatusPage.jsx` (`/admin/system`) | Database, Redis, workers, scheduled sweeps (heartbeats), outbox backlog |
| `pages/AiUsagePage.jsx` (`/admin/ai-usage`) | AI cost per use and model (USD, from the price table), cost per student, provider rate limits, template-fallback and invalid-proposal rates, how often added work needed a question. Counts and money only. |
| `services/platform.service.js` | `/admin/settings/*`, `/admin/system/status`, `/admin/system/ai-usage?days=` |

**Backend:** `routes/settings.routes.js`, `system.routes.js` (inside the Super Admin router) → `services/settings.service.js` (+ `repositories/settings.repository.js`, `config/settings/registry.js`, `fieldSchema.js`, `definitions/*`), `services/ops/{heartbeat,readiness,aiUsage}.service.js`. Models: `PlatformSettingVersion`, `ServiceHeartbeat` (migration 105).

## Settings (keys)
`safety.copy`, `assistant.policy`, `billing.policy`, `ops.monitoring`, `planner.policy`, `planner.copy`, `planner.stepTemplates`, `intake.policy`, `support.policy`, `ai.routing`, `ai.prompts`, `ai.observability`. Adding one = a reviewed definition file (fields + defaults + optional `refine`); changing a value = publishing a version.

## Rules - read before changing
- One field list drives BOTH server validation and this editor - never add a UI-only field.
- Publishing needs a reason and is audited (`settings.publish`); rollback publishes a copy of an older version.
- Services read settings with `settingsService.get(key)` (cache `SETTINGS_CACHE_TTL_MS`, last-known-good if the DB is down, reviewed defaults if nothing was ever published).
- Some rules can't be published away: `billing.policy.afterGrace.readHistory` must stay on; AI prompts can only use their use case's variables, and code-owned safety invariants are always appended.

## Verify
`npx eslint src/modules/platform` · backend `tests/integration/settings.itest.js`.
