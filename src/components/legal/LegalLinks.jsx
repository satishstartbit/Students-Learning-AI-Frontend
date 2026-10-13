import { Link } from 'react-router-dom';
import './legal.css';

/**
 * "Terms of Use · Privacy Policy" - opens each in a new tab, so a half-filled
 * form (sign-up, add a child, the consent screen) is never lost.
 * Titles come from the admin's documents when known.
 */
export function LegalLinks({ content, className = '', prefix = 'Read the' }) {
  const terms = content?.terms?.title || 'Terms of Use';
  const privacy = content?.privacy?.title || 'Privacy Policy';
  return (
    <p className={`lgl-links ${className}`.trim()}>
      {prefix ? `${prefix} ` : ''}
      <Link to="/terms" target="_blank" rel="noreferrer">
        {terms}
      </Link>
      {' · '}
      <Link to="/privacy" target="_blank" rel="noreferrer">
        {privacy}
      </Link>
    </p>
  );
}

export default LegalLinks;
