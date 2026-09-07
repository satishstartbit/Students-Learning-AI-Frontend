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
      setSubmitError(null);

      setTouched(Object.fromEntries(Object.keys(schemaRef.current).map((k) => [k, true])));
      if (!validate()) return undefined;

      setIsSubmitting(true);
      try {
        return await onSubmit?.(values);
      } catch (error) {
        // Push server-side field errors back onto the matching inputs.
        const fieldErrors = getFieldErrors(error);
        if (Object.keys(fieldErrors).length) setErrors((prev) => ({ ...prev, ...fieldErrors }));
        else setSubmitError(error?.message ?? 'Something went wrong');
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, validate, values]
  );

  const reset = useCallback(
    (nextValues) => {
      const next = nextValues ?? baseline;
      setBaseline(next);
      setValues(next);
      setErrors({});
      setTouched({});
      setSubmitError(null);
    },
    [baseline]
  );

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
