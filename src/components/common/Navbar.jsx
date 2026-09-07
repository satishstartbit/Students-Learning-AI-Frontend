import { Link } from 'react-router-dom';

/**
 * Top application bar.
 *
 * Purely presentational: brand, optional start/end slots and children. The
 * layouts decide what goes in it, so one Navbar serves every role.
 */
export function Navbar({
  brand = 'Executive Functioning',
  brandTo = '/',
  start,
  end,
  children,
  className = '',
  ...rest
}) {
  return (
    <header className={`ui-navbar ${className}`.trim()} {...rest}>
      <div className="ui-navbar__section">
        <Link to={brandTo} className="ui-navbar__brand">
          {brand}
        </Link>
        {start}
      </div>

      {children}

      <div className="ui-navbar__section">{end}</div>
    </header>
  );
}

export default Navbar;
