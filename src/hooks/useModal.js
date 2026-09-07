import { useCallback, useState } from 'react';

/**
 * Open/close state for Modal, Drawer and ConfirmationModal.
 * `payload` carries the record a modal was opened for.
 */
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [payload, setPayload] = useState(null);

  const open = useCallback((data = null) => {
    setPayload(data);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPayload(null);
  }, []);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return { isOpen, payload, open, close, toggle };
}

export default useModal;
