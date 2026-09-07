import { useSyncExternalStore } from 'react';

/**
 * Toast store.
 *
 * A module-level store rather than a context, so any module service or util
 * can raise a toast without the caller needing to be inside a provider.
 * <Toast /> renders whatever is here.
 */
let toasts = [];
const listeners = new Set();

const emit = () => listeners.forEach((l) => l());
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => toasts;

let nextId = 0;

export function addToast({ message, variant = 'info', title, duration = 5000 }) {
  const id = ++nextId;
  toasts = [...toasts, { id, message, variant, title }];
  emit();

  if (duration > 0) setTimeout(() => dismissToast(id), duration);
  return id;
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function clearToasts() {
  toasts = [];
  emit();
}

export const toast = {
  success: (message, options) => addToast({ ...options, message, variant: 'success' }),
  error: (message, options) => addToast({ ...options, message, variant: 'error', duration: 8000 }),
  warning: (message, options) => addToast({ ...options, message, variant: 'warning' }),
  info: (message, options) => addToast({ ...options, message, variant: 'info' }),
};

export function useToast() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { toasts: items, ...toast, dismiss: dismissToast, clear: clearToasts };
}

export default useToast;
