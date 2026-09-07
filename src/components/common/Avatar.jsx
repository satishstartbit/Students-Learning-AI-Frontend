import { useState } from 'react';
import { getInitials } from '../../utils/format';

/**
 * User or profile image with an initials fallback.
 *
 * Falls back to initials when no src is given or the image fails to load, so
 * a broken avatar URL never leaves an empty circle.
 */
export function Avatar({ src, name, alt, size = 'md', className = '', ...rest }) {
  const [failed, setFailed] = useState(false);

  const initials = getInitials(name);
  const showImage = src && !failed;
  const label = alt ?? (typeof name === 'string' ? name : undefined);

  return (
    <span
      className={`ui-avatar ui-avatar--${size} ${className}`.trim()}
      title={label}
      role={showImage ? undefined : 'img'}
      aria-label={showImage ? undefined : label || 'User avatar'}
      {...rest}
    >
      {showImage ? (
        <img src={src} alt={label ?? ''} onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{initials || '?'}</span>
      )}
    </span>
  );
}

export default Avatar;
