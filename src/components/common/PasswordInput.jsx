import { forwardRef, useState } from 'react';
import Input from './Input';

/**
 * Password field with a show/hide toggle.
 *
 * Never logs or persists its value - the raw password only travels to the
 * auth service, which sends it to the API over HTTPS.
 */
export const PasswordInput = forwardRef(function PasswordInput(
  { showToggle = true, autoComplete = 'current-password', ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      endAdornment={
        showToggle ? (
          <button
            type="button"
            className="ui-input-affix"
            style={{ position: 'static' }}
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={0}
          >
            <span aria-hidden="true">{visible ? '🙈' : '👁'}</span>
          </button>
        ) : null
      }
      {...props}
    />
  );
});

export default PasswordInput;
