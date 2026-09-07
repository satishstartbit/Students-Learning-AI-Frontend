/**
 * Normalises anything thrown by the API client into one predictable shape so
 * every screen reports failures the same way.
 *
 *   { status, message, errors, fieldErrors, isNetworkError, isValidationError }
 */
const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

const STATUS_MESSAGES = {
  400: 'The request could not be processed.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  409: 'That conflicts with existing data.',
  413: 'That file is too large.',
  422: 'Please correct the highlighted fields.',
  429: 'Too many requests. Please slow down and try again.',
  500: DEFAULT_MESSAGE,
  503: 'The service is temporarily unavailable.',
};

export function parseApiError(error) {
  // Network failure / request never reached the server.
  if (error?.isNetworkError || (!error?.response && error?.request)) {
    return {
      status: 0,
      message: 'Cannot reach the server. Check your connection and try again.',
      errors: [],
      fieldErrors: {},
      isNetworkError: true,
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

  return {
    status,
    message: body.message || STATUS_MESSAGES[status] || error?.message || DEFAULT_MESSAGE,
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
