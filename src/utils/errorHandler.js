/**
 * Normalises anything thrown by the API client into one predictable shape so
 * every screen reports failures the same way.
 *
 *   { status, message, errors, fieldErrors, isNetworkError, isValidationError }
 */
import { APP_NAME } from './constants.js';

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';
const OFFLINE_MESSAGE = 'You’re offline. Check your internet connection and try again.';

const STATUS_MESSAGES = {
  400: 'The request could not be processed.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  409: 'That conflicts with existing data.',
  413: 'That file is too large.',
  422: 'Please correct the highlighted fields.',
  429: 'Too many requests. Please slow down and try again.',
  500: 'Something went wrong on our side. Please try again in a moment.',
  502: 'Something went wrong on our side. Please try again in a moment.',
  503: `${APP_NAME} is being updated. Please try again in a few minutes.`,
  504: 'The server took too long to answer. Please try again.',
};

export function parseApiError(error) {
  // Already normalised: `api.*` (utils/apiClient.js) throws this function's
  // own output, and getErrorMessage / getFieldErrors / useApi then parse it
  // again. Re-parsing finds no `response`, so the server's message and field
  // errors were being replaced by the generic per-status text.
  if (error && !error.response && 'fieldErrors' in error && 'isValidationError' in error) {
    return error;
  }

  // Network failure / request never reached the server - three different
  // stories for the person: their internet is down, it took too long, or
  // our server isn't answering (utils/errorKind.js picks the view).
  if (error?.isNetworkError || (!error?.response && error?.request)) {
    const isTimeout = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT';
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return {
      status: 0,
      message: offline
        ? OFFLINE_MESSAGE
        : isTimeout
          ? 'The server took too long to answer. Please try again.'
          : 'We can’t reach the server right now. Please try again in a moment.',
      errors: [],
      fieldErrors: {},
      isNetworkError: true,
      isTimeout,
      isValidationError: false,
    };
  }

  const status = error?.response?.status ?? error?.status ?? 0;
  const body = error?.response?.data ?? error?.data ?? {};
  const errors = Array.isArray(body.errors) ? body.errors : [];

  const fieldErrors = {};
  for (const item of errors) {
    if (item && typeof item === 'object' && item.field) {
      fieldErrors[item.field] = item.message;
    }
  }

  // A 5xx body is an internal message ("Something went wrong", or a stack
  // outside production) - never what a person should read.
  const serverFault = status >= 500;

  return {
    status,
    message: serverFault
      ? STATUS_MESSAGES[status] || DEFAULT_MESSAGE
      : body.message || STATUS_MESSAGES[status] || error?.message || DEFAULT_MESSAGE,
    errors,
    fieldErrors,
    isNetworkError: false,
    isValidationError: status === 422 || Object.keys(fieldErrors).length > 0,
  };
}

/** Convenience for toasts and inline alerts. */
export const getErrorMessage = (error) => parseApiError(error).message;

/** Field-keyed messages ready to hand to a form. */
export const getFieldErrors = (error) => parseApiError(error).fieldErrors;

export default { parseApiError, getErrorMessage, getFieldErrors };
