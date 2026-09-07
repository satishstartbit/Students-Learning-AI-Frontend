import Breadcrumb from './Breadcrumb';

/** Page title block: breadcrumb, heading, description and page-level actions. */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className = '',
  ...rest
}) {
  return (
    <header className={`ui-pageheader ${className}`.trim()} {...rest}>
      <div>
        {breadcrumbs?.length > 0 && <Breadcrumb items={breadcrumbs} />}
        <h1 className="ui-pageheader__title">{title}</h1>
        {description && <p className="ui-pageheader__description">{description}</p>}
      </div>

      {actions && <div className="ui-pageheader__actions">{actions}</div>}
    </header>
  );
}

export default PageHeader;
