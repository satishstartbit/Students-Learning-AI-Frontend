import { useEffect, useMemo, useRef, useState } from 'react';
import { LuPlus, LuUpload, LuX } from 'react-icons/lu';
import { Button, PageHeader } from '../../../components/common';
import { IMAGE_ACCEPT, validateImage } from '../../../utils/file';
import { getInitials } from '../../../utils/format';

/**
 * The frame every My Profile page shares (parent, teacher, Super Admin): the
 * standard page header and the full page width, like every other page, then
 * two columns - the forms (`children`) on the left, `head` (the photo card)
 * and `extra` (colour theme, password) on the right. Under 1080px it stacks
 * as head, forms, extra.
 */
export function ProfilePageLayout({ description, notice, head, extra, children }) {
  return (
    <div className="pf-page td-page">
      <PageHeader title="My Profile" description={description} />
      {notice}
      <div className="pf-layout">
        {head && <div className="pf-layout__head">{head}</div>}
        <div className="pf-layout__main">{children}</div>
        {extra && <div className="pf-layout__extra">{extra}</div>}
      </div>
    </div>
  );
}

/** A titled card - one section of the profile page. */
export function ProfileSection({ title, hint, children, className = '', ...rest }) {
  return (
    <section className={`pf-card ${className}`.trim()} {...rest}>
      {title && <h2 className="pf-card__title">{title}</h2>}
      {hint && <p className="pf-card__hint">{hint}</p>}
      {children}
    </section>
  );
}

/**
 * The card at the top of the page: photo (or initials), name, one line of
 * context ("Teacher · Central High · 4 years teaching"), and the photo's own
 * Upload / Remove - which save straight away, separate from the form below.
 *
 * A form that saves the photo with the rest of its fields (the parent's Add /
 * Edit child dialogs) passes `canRemove`/`removeLabel`/`note` to say so
 * instead, and `placeholderName` for while no name has been typed yet.
 * Without `onUpload` (Super Admin, who has no photo) it shows initials only.
 */
export function ProfileHeaderCard({
  name,
  placeholderName,
  meta,
  photoUrl,
  busy,
  onUpload,
  onRemove,
  canRemove = Boolean(photoUrl),
  removeLabel = 'Remove',
  note = 'Profile photo · JPG, PNG, WEBP or HEIC',
}) {
  const inputRef = useRef(null);
  const [failedUrl, setFailedUrl] = useState(null);
  const showPhoto = photoUrl && failedUrl !== photoUrl;

  return (
    <section className="pf-card pf-header" aria-label="Profile photo">
      <span className="pf-avatar" aria-hidden="true">
        {showPhoto ? <img src={photoUrl} alt="" onError={() => setFailedUrl(photoUrl)} /> : getInitials(name) || '?'}
      </span>
      <div className="pf-header__text">
        <p className="pf-header__name">{name || placeholderName}</p>
        {meta && <p className="pf-header__meta">{meta}</p>}
        {note && <p className="pf-header__note">{note}</p>}
      </div>
      {onUpload && (
      <div className="pf-header__actions">
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          hidden
          data-testid="profile-photo-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            const { valid, error } = validateImage(file);
            onUpload(valid ? file : null, valid ? null : error);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          startIcon={<LuUpload aria-hidden="true" />}
          loading={busy === 'upload'}
          disabled={Boolean(busy)}
          onClick={() => inputRef.current?.click()}
        >
          Upload photo
        </Button>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" loading={busy === 'remove'} disabled={Boolean(busy)} onClick={onRemove}>
            {removeLabel}
          </Button>
        )}
      </div>
      )}
    </section>
  );
}

/**
 * Picked values as removable chips, plus "+ Add ..." opening a searchable
 * list of what's left - the "Subjects taught" / "Grades taught" rows.
 * `options` are { value, label }; `value` is an array of option values.
 * Chips keep the order of `options` (master display order).
 */
export function ChipMultiSelect({ label, options, value = [], onChange, addLabel = 'Add', loading = false, name }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef(null);
  const labelId = `pf-chips-${name}`;

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = useMemo(() => new Set(value), [value]);
  // A saved value no longer in the master list still shows (and can be removed).
  const chips = useMemo(() => {
    const known = options.filter((o) => selected.has(o.value));
    const extra = value.filter((v) => !options.some((o) => o.value === v)).map((v) => ({ value: v, label: v }));
    return [...known, ...extra];
  }, [options, selected, value]);
  const remaining = options.filter((o) => !selected.has(o.value) && o.label.toLowerCase().includes(search.trim().toLowerCase()));

  const add = (optionValue) => {
    onChange([...value, optionValue]);
    setSearch('');
  };

  return (
    <div className="ui-field">
      <span id={labelId} className="ui-label">
        {label}
      </span>
      <ul className="pf-chips" ref={rootRef} aria-labelledby={labelId} data-testid={`chips-${name}`}>
        {chips.map((chip) => (
          <li key={chip.value} className="pf-chip">
            {chip.label}
            <button
              type="button"
              className="pf-chip__remove"
              aria-label={`Remove ${chip.label}`}
              onClick={() => onChange(value.filter((v) => v !== chip.value))}
            >
              <LuX size={13} aria-hidden="true" />
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="pf-chip pf-chip--add"
            aria-haspopup="listbox"
            aria-expanded={open}
            disabled={loading}
            onClick={() => setOpen((o) => !o)}
          >
            <LuPlus size={14} aria-hidden="true" /> {loading ? 'Loading…' : addLabel}
          </button>
        </li>
        {open && (
          <li className="pf-chip-menu">
            <input
              className="pf-chip-menu__search"
              placeholder="Search…"
              aria-label={`Search ${label.toLowerCase()}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <ul className="pf-chip-menu__list" role="listbox" aria-label={label}>
              {remaining.length === 0 ? (
                <li className="pf-chip-menu__empty">{options.length === value.length ? 'All added' : 'No matches'}</li>
              ) : (
                remaining.map((o) => (
                  <li key={o.value}>
                    <button type="button" role="option" aria-selected="false" className="pf-chip-menu__option" onClick={() => add(o.value)}>
                      {o.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </li>
        )}
      </ul>
    </div>
  );
}
