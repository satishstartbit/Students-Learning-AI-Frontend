import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { validateField, validateForm } from '../utils/validation';
import { getFieldErrors } from '../utils/errorHandler';

/**
 * Controlled-form state with validation.
 *
 * @param initialValues  starting values
 * @param validationSchema  { field: [rule, rule] } from utils/validation
 * @param onSubmit  async (values) => void - throwing an API error maps its
 *                  field errors back onto the form automatically
 */
export function useForm({ initialValues = {}, validationSchema = {}, onSubmit } = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // The snapshot `isDirty` compares against; updated by reset().
  const [baseline, setBaseline] = useState(initialValues);

  const schemaRef = useRef(validationSchema);
  useEffect(() => {
    schemaRef.current = validationSchema;
  });

  // `isSubmitting` only disables the button after a re-render, so two submits
  // in the same tick would both get through - this ref closes that window.
  const inFlightRef = useRef(false);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  }, []);

  const setFieldError = useCallback(
    (name, message) => setErrors((prev) => ({ ...prev, [name]: message })),
    []
  );

  /** Drop-in onChange for the common Input/Select/Checkbox components. */
  const handleChange = useCallback(
    (event) => {
      const target = event?.target ?? {};
      const { name, type } = target;
      if (!name) return;

      let value;
      if (type === 'checkbox') value = target.checked;
      else if (type === 'file') value = target.multiple ? Array.from(target.files) : target.files[0];
      else value = target.value;

      setFieldValue(name, value);
    },
    [setFieldValue]
  );

  const handleBlur = useCallback((event) => {
    const name = event?.target?.name;
    if (!name) return;

    setTouched((prev) => ({ ...prev, [name]: true }));
    setValues((current) => {
      const rules = schemaRef.current[name];
      if (rules) {
        const error = validateField(current[name], rules, current);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
      return current;
    });
  }, []);

  const validate = useCallback(() => {
    const { isValid, errors: nextErrors } = validateForm(values, schemaRef.current);
    setErrors(nextErrors);
    return isValid;
  }, [values]);

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();
      if (inFlightRef.current) return undefined;
      setSubmitError(null);

      setTouched(Object.fromEntries(Object.keys(schemaRef.current).map((k) => [k, true])));
      if (!validate()) return undefined;

      inFlightRef.current = true;
      setIsSubmitting(true);
      try {
        return await onSubmit?.(values);
      } catch (error) {
        // Push server-side field errors back onto the matching inputs.
        // Not rethrown: handleSubmit is passed straight to onClick/onSubmit,
        // where a rejection has no catcher and only surfaces as an unhandled
        // promise rejection - the error is already shown through the form.
        const fieldErrors = getFieldErrors(error);
        if (Object.keys(fieldErrors).length) setErrors((prev) => ({ ...prev, ...fieldErrors }));
        else setSubmitError(error?.message ?? 'Something went wrong');
        return undefined;
      } finally {
        inFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [onSubmit, validate, values]
  );

  /*
   * A stable identity (no `baseline` dependency) on purpose: a caller that
   * seeds the form from an effect - e.g. EditUserPage's
   * `useEffect(() => reset(...), [user, reset])` - would otherwise get a new
   * `reset` on every call, which re-fires that effect and resets again,
   * forever. The functional updater reads the latest baseline without
   * needing it in the closure.
   */
  const reset = useCallback((nextValues) => {
    setBaseline((prevBaseline) => {
      const next = nextValues ?? prevBaseline;
      setValues(next);
      return next;
    });
    setErrors({});
    setTouched({});
    setSubmitError(null);
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline]
  );

  /** Spread onto a common form component: <Input {...getFieldProps('email')} /> */
  const getFieldProps = useCallback(
    (name) => ({
      name,
      value: values[name] ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] ? errors[name] : null,
    }),
    [values, errors, touched, handleChange, handleBlur]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    isDirty,
    isValid: Object.values(errors).every((e) => !e),
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setValues,
    validate,
    reset,
    getFieldProps,
  };
}

export default useForm;
