# notifications module

In-app notifications for every role: the header bell, unread count, mark read, and where each notification takes you. **Roles:** all. The student full page is `student/pages/NotificationsPage.jsx`.

## Where it lives
| Frontend | Purpose |
|---|---|
| `components/NotificationBell.jsx` | Header bell + dropdown (rendered by `AuthenticatedLayout` and `StudentLayout`) |
| `hooks/useNotifications.js` | List, unread count (polled every 30s), mark read / read all |
| `studentNotificationPath.js` | Where a **student's** notification links to (shared by the bell and `/student/notifications`). Returns null for informational ones. |
| `services/notification.service.js` | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |

**Backend:** `routes/notification.routes.js` (`/notifications`, **not** paywalled so billing notices reach a locked parent) → `controllers/notification.controller.js` → `services/notification.service.js` (`notify`, `notifyMany`, `CATEGORY_TYPES`, `categoryOf`) → `repositories/notification.repository.js` (`deleteForRelated`). Types: `utils/constants.js#NOTIFICATION_TYPES`. Student reminders: `services/studentReminder.service.js` + `jobs/sendStudentReminders.js`. Models: `Notification`, `NotificationPreference`.

## Rules - read before changing
- **Notifying never fails the action.** `notify`/`notifyMany` swallow and log their own errors. Call them after the write has committed, never inside a transaction you need to roll back.
- A **new type**: add it to `NOTIFICATION_TYPES`, give it a category in `CATEGORY_TYPES` if students filter by it (deadlines / rewards / plan / checkin, everything else `info`), and add routing in the bell (per role) or `studentNotificationPath.js`. Set `relatedType` + `relatedId` so the link can be built.
- Withdrawing: unpublishing an assignment deletes its "new assignment" notices (`deleteForRelated`). Use the same approach for anything that can be undone.
- Wording is plain and addressed to the reader. Family-facing notices about Super Admin changes say **what** changed and never the internal reason.
- Emails are separate (`services/email`). Safety and check-in alerts email parents directly, not filtered by notification preferences.

## Verify
- UI: harness. Mock `/notifications` with one item per type and assert each item's link for each role.
- Backend: api-tester. The type → category mapping, read/read-all only affect your own rows.

## Related
Everything that calls `notify`: `assignments`, `superAdmin`/`invitations`, `checkIn` (alerts), `student` (rewards, reminders), `subscription` (billing).
