import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import IconButton from './IconButton';

/**
 * Side panel dialog - used for filters, details and mobile navigation.
 * Shares Modal's accessibility behaviour: Escape to close, focus restored on
 * exit, body scroll locked while open.
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
  closeOnOverlayClick = true,
  className = '',
}) {
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    triggerRef.current = document.activeElement;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);

    const timer = setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      triggerRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="ui-overlay"
      style={{ padding: 0, justifyContent: position === 'left' ? 'flex-start' : 'flex-end' }}
      onMouseDown={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        className={`ui-drawer ui-drawer--${position} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        <div className="ui-modal__header">
          {title && (
            <h2 id={titleId} className="ui-modal__title">
              {title}
            </h2>
          )}
          <IconButton
            icon={<span aria-hidden="true">✕</span>}
            label="Close panel"
            onClick={onClose}
          />
        </div>

        <div className="ui-modal__body">{children}</div>

        {footer && <div className="ui-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export default Drawer;
