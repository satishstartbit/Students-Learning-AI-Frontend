# profile module

The shared "My Profile" UI kit. There are no pages here. The Teacher, Parent and Super Admin profile pages (`teacher/TeacherProfilePage`, `parent/ParentProfilePage`, `superAdmin/AdminProfilePage` at `/admin/profile`) and the parent's Add/Edit child dialogs are built from it, so they all look the same.

**Page frame:** `ProfilePageLayout` gives the standard `PageHeader` ("My Profile" plus a description) and the full `.td-page` width (1120px, like every other page). Below that are two columns: the forms go in `children` (left), and `head` (photo card) plus `extra` (colour theme, change password) go on the right (340px). Under 1080px it stacks as head, forms, extra. **Without `head` and `extra` it is one column** (`pf-layout--single`) and the page orders every section itself - the parent's My Profile does this (user request 2026-10-01: Colour theme on top, photo inside Personal details, Change password at the bottom, no side column); Teacher and Super Admin keep two columns. Don't reintroduce a narrow `max-width` or a custom title.

## Where it lives
| File | Purpose |
|---|---|
| `components/ProfileParts.jsx` | `ProfileSection` (titled card), `ProfileHeaderCard` (photo or initials, name, meta line, Upload/Remove; `inline` drops the card frame so it can head another section, `pf-header--inline`), `ChipMultiSelect` (removable chips + "+ Add" searchable list) |
| `components/profile.css` (`pf-`) | `.pf-layout` (two-column page grid), `.pf-card` (6px field spacing on top of the reserved error line), `.pf-card__title/__hint`, **`.pf-grid`** (two columns, one under 640px), `.pf-span-2`, `.pf-half`, `.pf-actions`, `.pf-facts` (label/value rows), header and chip styles |
| `useProfilePhoto.js` | My Profile photo: upload/remove **save immediately** through `PATCH /auth/me` (`removePhoto: true` to clear) |

Used with `auth/components/AddressFields layout="profile"` and `RoleProfileFields layout="profile"` (STUDENT) for two-column field layouts.

## Rules - read before changing
- `ProfileHeaderCard` has two photo modes. **Immediate** (My Profile, via `useProfilePhoto`) is the default. **Saved with the form** (parent Add/Edit child) passes `canRemove`, `removeLabel` ("Undo"/"Remove"), `note` and `placeholderName`. Keep the defaults backward-compatible, because both callers depend on them.
- Every field keeps an empty error line under it (`FieldHelper` reserves the slot so errors don't shift the form). For tighter dialogs, reduce `.ui-field` margin in the caller's CSS (see `parent/parentChildren.css .pc-childform`). Don't remove the slot.
- Theme tokens only. The accent (`--accent-soft`, `--accent-base`) and dark mode must keep working.
- A change to `.pf-*` affects Teacher Profile, Parent Profile and the child dialogs. Screenshot all of them.

## Verify
- UI: harness. `/teacher/profile` (`USERS.teacher`), `/parent/profile` and `/parent/children` → Add / Edit (`USERS.parent`), at 1366px and 390px. `scenarios/profile-pages.mjs` (all three roles) and `scenarios/parent-profile-layout.mjs` (parent one-column order, photo inside Personal details, password grid, upload still immediate, teacher still two columns).

## Related
`auth` (field groups, `PATCH /auth/me`), `parent`, `teacher`.
