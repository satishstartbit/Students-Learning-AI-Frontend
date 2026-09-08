import Modal from './Modal';
import Button from './Button';

/**
 * Confirm-before-acting dialog.
 *
 * Use variant="danger" for destructive actions such as permanent account
 * deletion so the confirm button reads as destructive.
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  confirmDisabled = false,
  children,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p style={{ margin: 0 }}>{message}</p>}
      {children}
    </Modal>
  );
}

export default ConfirmationModal;
