import { Link } from 'react-router-dom';

/**
 * Breadcrumb trail.
 * @param items - [{ label, to }] - the last entry renders as the current page
 */
export function Breadcrumb({ items = [], separator = '/', className = '' }) {
  if (items.length === 0) return null;

  return (
    <nav className={`ui-breadcrumb ${className}`.trim()} aria-label="Breadcrumb">
      <ol className="ui-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.to ?? item.label}>
              {isLast || !item.to ? (
                <span className="ui-breadcrumb__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link to={item.to} className="ui-breadcrumb__link">
                    {item.label}
                  </Link>
                  <span className="ui-breadcrumb__separator" aria-hidden="true">
                    {' '}
                    {separator}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
