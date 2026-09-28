import { Link } from 'react-router-dom';
import { LuStar } from 'react-icons/lu';
import { APP_NAME } from '../../utils/constants';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/poppins/600.css';
import { StatusIllustration } from './StatusIllustration';
import { statusCopy } from './statusCopy';
import './status.css';

/**
 * The one layout for every "this didn't work" moment: an illustration, a
 * small label (Error 404, No internet...), a title, a sentence of help and
 * the actions. Used by ErrorState (every failed load), the 404 and error
 * pages, KidOops and the connection banner's wording.
 *
 * @param kind     offline | unreachable | timeout | maintenance | server |
 *                 notFound | forbidden | crash | pageNotFound | generic -
 *                 picks the picture and the default words (statusCopy.js)
 * @param variant  inline (inside a page or card, default) | compact (a
 *                 dialog or a small panel) | page (the whole screen, with
 *                 the brand in the corner)
 * @param title, description, eyebrow  override the kind's words
 * @param actions  buttons / links under the text
 * @param children anything extra under the actions (e.g. the address that
 *                 wasn't found)
 */
export function StatusView({
  kind = 'generic',
  variant = 'inline',
  title,
  description,
  eyebrow,
  actions,
  children,
  className = '',
  role = 'alert',
}) {
  const copy = statusCopy(kind);
  const illustration = kind === 'pageNotFound' ? 'notFound' : kind;
  const label = eyebrow === undefined ? copy.eyebrow : eyebrow;
  const Heading = variant === 'page' ? 'h1' : 'h2';

  return (
    <section className={`st-view st-view--${variant} ${className}`.trim()} role={role} data-kind={kind}>
      {variant === 'page' && (
        <Link to="/" className="st-brand">
          <span className="st-brand__mark" aria-hidden="true">
            <LuStar />
          </span>
          {APP_NAME}
        </Link>
      )}

      <StatusIllustration kind={illustration} />
      {label && <p className="st-eyebrow">{label}</p>}
      <Heading className="st-title">{title ?? copy.title}</Heading>
      {(description ?? copy.description) && <p className="st-desc">{description ?? copy.description}</p>}
      {actions && <div className="st-actions">{actions}</div>}
      {children}
    </section>
  );
}

export default StatusView;
