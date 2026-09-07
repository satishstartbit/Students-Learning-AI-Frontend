/**
 * Heading for a section within a page.
 * `as` keeps the document outline correct (h2 under an h1 page title).
 */
export function SectionHeader({
  title,
  description,
  actions,
  as: Heading = 'h2',
  className = '',
  ...rest
}) {
  return (
    <div className={`ui-sectionheader ${className}`.trim()} {...rest}>
      <div>
        <Heading className="ui-sectionheader__title">{title}</Heading>
        {description && <p className="ui-sectionheader__description">{description}</p>}
      </div>
      {actions && <div className="ui-pageheader__actions">{actions}</div>}
    </div>
  );
}

export default SectionHeader;
