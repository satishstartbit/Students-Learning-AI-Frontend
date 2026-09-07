import { forwardRef } from 'react';
import Input from './Input';

/**
 * Time field built on the native time input. Emits HH:MM (24-hour), which the
 * browser presents in the viewer's locale format.
 */
export const TimePicker = forwardRef(function TimePicker({ value, step, ...props }, ref) {
  return <Input ref={ref} type="time" value={value ?? ''} step={step} {...props} />;
});

export default TimePicker;
