# profile module

The shared "My Profile" UI kit. There are no pages here. The Teacher, Parent and Super Admin profile pages (`teacher/TeacherProfilePage`, `parent/ParentProfilePage`, `superAdmin/AdminProfilePage` at `/admin/profile`) and the parent's Add/Edit child dialogs are built from it, so they all look the same.

**Page frame:** `ProfilePageLayout` gives the standard `PageHeader` ("My Profile" plus a description) and the full `.td-page` width (1120px, like every other page). Below that are two columns: the forms go in `children` (left), and `head` (photo card) plus `extra` (colour theme, change password) go on the right (340px). Under 1080px it stacks as head, forms, extra. Don't reintroduce a narrow `max-width` or a custom title.

## Where it lives
| File | Purpose |
|---|---|
| `components/ProfileParts.jsx` | `ProfileSection` (titled card), `ProfileHeaderCard` (photo or initials, name, meta line, Upload/Remove), `ChipMultiSelect` (removable chips + "+ Add" searchable list) |
| `components/profile.css` (`pf-`) | `.pf-layout` (two-column page grid), `.pf-card` (6px field spacing on top of the reserved error line), `.pf-card__title/__hint`, **`.pf-grid`** (two columns, one under 640px), `.pf-span-2`, `.pf-half`, `.pf-actions`, `.pf-facts` (label/value rows), header and chip styles |
| `useProfilePhoto.js` | My Profile photo: upload/remove **save immediately** through `PATCH /auth/me` (`removePhoto: true` to clear) |

Used with `auth/components/AddressFields layout="profile"` and `RoleProfileFields layout="profile"` (STUDENT) for two-column field layouts.

## Rules - read before changing
- `ProfileHeaderCard` has two photo modes. **Immediate** (My Profile, via `useProfilePhoto`) is the default. **Saved with the form** (parent Add/Edit child) passes `canRemove`, `removeLabel` ("Undo"/"Remove"), `note` and `placeholderName`. Keep the defaults backward-compatible, because both callers depend on them.
- Every field keeps an empty error line under it (`FieldHelper` reserves the slot so errors don't shift the form). For tighter dialogs, reduce `.ui-field` margin in the caller's CSS (see `parent/parentChildren.css .pc-childform`). Don't remove the slot.
- Theme tokens only. The accent (`--accent-soft`, `--accent-base`) and dark mode must keep working.
- A change to `.pf-*` affects Teacher Profile, Parent Profile and the child dialogs. Screenshot all of them.

## Verify
- UI: harness. `/teacher/profile` (`USERS.teacher`), `/parent/profile` and `/parent/children` → Add / Edit (`USERS.parent`), at 1366px and 390px.

## Related
`auth` (field groups, `PATCH /auth/me`), `parent`, `teacher`.
