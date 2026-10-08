# notifications module

In-app notifications for every role: the header bell, unread count, mark read, the notifications page, and where each notification takes you. **Roles:** all.

## Where it lives
| Frontend | Purpose |
|---|---|
| `pages/NotificationsPage.jsx` + `components/notificationsPage.css` (`sn-`) | **The notifications page** for students (Grade 6+, `/student/notifications`), teachers (`/teacher/notifications`) and parents (`/parent/notifications`), built to the student notifications mockup: filter chips (All / Unread; students also Deadlines / Rewards, server-side `category`), Today / Earlier cards, unread tint + dot, messages up to two lines, Mark all as read, Show older. Opening a row marks it read and goes to `notificationPathFor(role, n)`; reading dispatches `notifications:changed` so the bell badge drops at once. Wording of the empty state per role. |
| `components/NotificationBellLink.jsx` | **Teacher and Parent header bell (2026-10-08):** a link to their page with the unread badge - no dropdown list. The phone top bar does the same (`MobileChrome#NotificationsLink`). Wired by `AuthenticatedLayout`'s `notificationsPath` prop (`TeacherLayout` / `ParentLayout` pass it; students pass it too and hide the desktop bell - they use the sidebar). |
| `components/NotificationBell.jsx` | Bell + dropdown list, now only for a role without a page (**Super Admin**). |
| `notificationPath.js` (+ test) | `notificationPathFor(role, n)` - where a notification leads: student = `studentNotificationPath`; teacher: assignment → its page, student (check-in/safety alert) → the student, invitation → Invitations, connection → Students, shared work → Shared with me; parent: assignment/student (help asked, alerts) → Progress, invitation/connection → My Children, `subscriptions`/`payment_transactions` → Subscription. Null = informational. Also `NOTIFICATIONS_PAGE_BY_ROLE`, `NOTIFICATIONS_CHANGED_EVENT`. |
| `studentNotificationPath.js` | The student rules (assignments, own tasks, check-in, weekly plan, rewards, note reminders: `sticky_note` → `/student`, a note on an assignment comes as `assignment`). |
| `hooks/useNotifications.js` | List, unread count (polled every 30s, and on `notifications:changed`), mark read / read all |
| `services/notification.service.js` | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |

**Backend:** `routes/notification.routes.js` (`/notifications`, **not** paywalled so billing notices reach a locked parent - and `/parent/notifications` is in `ParentLayout`'s `SUBSCRIPTION_EXEMPT_PATHS` for the same reason) → `controllers/notification.controller.js` → `services/notification.service.js` (`notify`, `notifyMany`, `CATEGORY_TYPES`, `categoryOf`) → `repositories/notification.repository.js` (`deleteForRelated`). Types: `utils/constants.js#NOTIFICATION_TYPES`. Student reminders: `services/studentReminder.service.js` + `jobs/sendStudentReminders.js`. Note reminders (`note_reminder`, Deadlines category) are written by `stickyNote.service.js#deliverDueReminders` when the student's app asks (see the `student` module). Parents' overdue work (`assignment_overdue`, Deadlines; related `assignment_recipient` or `student_task` → `/parent/progress`) comes from `parentOverdue.service.js`, and `subscription_renewal_reminder` from `subscriptionRenewal.service.js#sendRenewalReminders`. Most notices now also have an email - see `services/emailEvents.service.js` and `EMAIL_SETUP.md`. Models: `Notification`, `NotificationPreference`.

## Rules - read before changing
- **Notifying never fails the action.** `notify`/`notifyMany` swallow and log their own errors. Call them after the write has committed, never inside a transaction you need to roll back.
- A **new type**: add it to `NOTIFICATION_TYPES`, give it a category in `CATEGORY_TYPES` if students filter by it (deadlines / rewards / plan / checkin, everything else `info`), set `relatedType` + `relatedId`, and add its destination in `notificationPath.js` (per role, + a test line).
- Withdrawing: unpublishing an assignment deletes its "new assignment" notices (`deleteForRelated`). Use the same approach for anything that can be undone.
- Wording is plain and addressed to the reader. Family-facing notices about Super Admin changes say **what** changed and never the internal reason.
- Emails are separate (`services/email`). Safety and check-in alerts email parents directly, not filtered by notification preferences.

## Verify
- `npm test` (`notificationPath.test.js`).
- UI: `.claude/testing/scenarios/notifications-pages.mjs` - teacher/parent bell is a link with the count (no dropdown), sidebar link, the page (sections, filters, unread tint), each row's destination, badge drops after reading, Mark all as read, a parent without a plan can still open it, phones, Super Admin keeps the dropdown, students keep Deadlines/Rewards.
- Backend: api-tester. The type → category mapping, read/read-all only affect your own rows.

## Related
Everything that calls `notify`: `assignments`, `superAdmin`/`invitations`, `checkIn` (alerts), `student` (rewards, reminders), `subscription` (billing).
