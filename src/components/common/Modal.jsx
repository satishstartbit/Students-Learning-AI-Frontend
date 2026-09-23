import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import IconButton from './IconButton';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: renders in a portal, traps focus, closes on Escape or
 * overlay click, restores focus to the trigger, and locks body scroll.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  // For a dialog that draws its own heading in the body instead of passing
  // `title` (so the header row would duplicate it) - without one, an
  // aria-modal dialog reaches a screen reader unnamed.
  ariaLabel,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
}) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    triggerRef.current = document.activeElement;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog once it has painted.
    const timer = setTimeout(() => {
      const target = dialogRef.current?.querySelector(FOCUSABLE) ?? dialogRef.current;
      target?.focus();
    }, 0);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = overflow;
      triggerRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="ui-overlay"
      onMouseDown={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className={`ui-modal ui-modal--${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="ui-modal__header">
            {title && (
              <div className="min-w-0">
                <h2 id={titleId} className="ui-modal__title">
                  {title}
                </h2>
                {description && (
                  <p className="ui-modal__description">{description}</p>
                )}
              </div>
            )}
            {showCloseButton && (
              <IconButton
                icon={<span aria-hidden="true">✕</span>}
                label="Close dialog"
                onClick={onClose}
              />
            )}
          </div>
        )}

        <div className="ui-modal__body">{children}</div>

        {footer && <div className="ui-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
