import { LuPhone } from 'react-icons/lu';
import './safety.css';

/**
 * The safety help lines - Kids Help Phone, 911 - as the admin set them in
 * Platform settings ("Safety messages"). A line with a link (tel:, sms:,
 * https:) is tappable. `lines` = { title, items: [{ label, detail, href }] }.
 */
export function HelpLines({ lines, size = 'md', className = '' }) {
  const items = lines?.items ?? [];
  if (!items.length) return null;
  return (
    <section className={`sf-lines sf-lines--${size} ${className}`.trim()} aria-label={lines.title || 'Help lines'}>
      {lines.title && <p className="sf-lines__title">{lines.title}</p>}
      <ul className="sf-lines__list">
        {items.map((line) => {
          const body = (
            <>
              <span className="sf-lines__icon" aria-hidden="true">
                <LuPhone />
              </span>
              <span className="min-w-0">
                <span className="sf-lines__label">{line.label}</span>
                {line.detail && <span className="sf-lines__detail">{line.detail}</span>}
              </span>
            </>
          );
          return (
            <li key={`${line.label}-${line.detail}`}>
              {line.href ? (
                <a
                  className="sf-lines__item"
                  href={line.href}
                  {...(/^https:/i.test(line.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  {body}
                </a>
              ) : (
                <div className="sf-lines__item">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default HelpLines;
