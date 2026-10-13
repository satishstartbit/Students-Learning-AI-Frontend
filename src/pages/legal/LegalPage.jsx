import { Link } from 'react-router-dom';
import { BrandMark, ErrorState, Loader } from '../../components/common';
import { usePortalTheme } from '../../layouts/usePortalTheme';
import LegalText from '../../components/legal/LegalText';
import { useLegalContent } from '../../components/legal/useLegalContent';
import { APP_NAME } from '../../utils/constants';
import '../../components/legal/legal.css';

/**
 * /privacy and /terms - the Privacy Policy and Terms of Use as Super Admin
 * wrote them (Platform settings > Privacy Policy and Terms of Use). Open to
 * everyone, signed in or not: linked from sign-up, the footer, the add-child
 * form and the consent screen.
 */
export default function LegalPage({ doc = 'privacy' }) {
  usePortalTheme();
  const { content, error, retry } = useLegalContent();
  const document = content?.[doc];
  const other = doc === 'privacy' ? { to: '/terms', label: content?.terms?.title || 'Terms of Use' } : { to: '/privacy', label: content?.privacy?.title || 'Privacy Policy' };

  return (
    <div className="lgl-page">
      <header className="lgl-page__top">
        <Link to="/" className="lgl-page__brand" aria-label={`${APP_NAME} home`}>
          <BrandMark size="md" />
        </Link>
      </header>
      <main className="lgl-page__main">
        {!content && !error && <Loader message="Loading…" />}
        {error && !content && <ErrorState error={error} onRetry={retry} />}
        {document && (
          <article className="lgl-doc">
            <h1>{document.title}</h1>
            {(content.effectiveDate || content.version) && (
              <p className="lgl-doc__meta">
                {content.effectiveDate ? `Effective ${content.effectiveDate}` : ''}
                {content.effectiveDate && content.version ? ' · ' : ''}
                {content.version ? `Version ${content.version}` : ''}
              </p>
            )}
            <LegalText body={document.body} />
            <p className="lgl-doc__other">
              See also: <Link to={other.to}>{other.label}</Link>
            </p>
          </article>
        )}
      </main>
    </div>
  );
}
