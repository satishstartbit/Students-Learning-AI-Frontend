import { useEffect, useRef, useState } from 'react';
import { LuCheck, LuChevronDown } from 'react-icons/lu';
import { formatName, getInitials } from '../../../utils/format';
import { useViewingChild } from '../hooks/useViewingChild';
import './viewingChild.css';

/**
 * Phone top bar chip for the child being viewed ("SK Sanjay ˅", the parent
 * "child view" mobile mockup) - the phone counterpart of the sidebar's
 * ViewingChildPicker. With more than one child it opens the same list to
 * switch; with one it is just a label. ParentLayout passes it only when the
 * family has children.
 */
export default function ViewingChildChip() {
  const { viewingChild, children, setViewingChildId } = useViewingChild();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!viewingChild) return null;

  const initials = getInitials(formatName(viewingChild)) || '?';
  const canSwitch = children.length > 1;
  const face = (
    <>
      <span className="vc-avatar vc-avatar--sm" aria-hidden="true">
        {initials}
      </span>
      <span className="vc-chip__name">{viewingChild.firstName}</span>
    </>
  );

  if (!canSwitch) {
    return (
      <span className="vc-chip" aria-label={`Viewing ${formatName(viewingChild)}`}>
        {face}
      </span>
    );
  }

  return (
    <div ref={containerRef} className="vc-chip__wrap">
      <button
        type="button"
        className="vc-chip"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Viewing ${formatName(viewingChild)}. Switch child`}
        onClick={() => setOpen((v) => !v)}
      >
        {face}
        <LuChevronDown aria-hidden="true" className={`vc-chip__chevron${open ? ' vc-chip__chevron--open' : ''}`} />
      </button>

      {open && (
        <div role="listbox" aria-label="Choose a child" className="vc-dropdown vc-chip__menu">
          {children.map((child) => {
            const childName = formatName(child);
            const active = child.id === viewingChild.id;
            return (
              <button
                key={child.id}
                type="button"
                role="option"
                aria-selected={active}
                className="vc-option"
                onClick={() => {
                  setViewingChildId(child.id);
                  setOpen(false);
                }}
              >
                <span className="vc-avatar vc-avatar--sm" aria-hidden="true">
                  {getInitials(childName) || '?'}
                </span>
                <span className="vc-option__body">
                  <span className="vc-option__name">{childName}</span>
                  {child.grade && <span className="vc-option__grade">{child.grade}</span>}
                </span>
                {active && <LuCheck className="vc-option__check" size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
