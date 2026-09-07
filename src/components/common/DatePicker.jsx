import { forwardRef } from 'react';
import Input from './Input';
import { toDateInputValue } from '../../utils/date';

/**
 * Date field built on the native date input - keyboard accessible and
 * localised by the browser, with no extra dependency.
 *
 * Emits YYYY-MM-DD, which is what the API's DATE columns expect.
 */
export const DatePicker = forwardRef(function DatePicker(
  { value, min, max, ...props },
  ref
) {
  return (
    <Input
      ref={ref}
      type="date"
      value={toDateInputValue(value) || (typeof value === 'string' ? value : '')}
      min={min ? toDateInputValue(min) : undefined}
      max={max ? toDateInputValue(max) : undefined}
      {...props}
    />
  );
});

export default DatePicker;
