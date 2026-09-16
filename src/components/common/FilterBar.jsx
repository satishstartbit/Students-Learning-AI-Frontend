/**
 * Compact, single-row filter toolbar for a listing page.
 *
 * Replaces the old pattern of a `<Card>` holding a CSS grid of equal-width,
 * full-height fields (each with a label stacked above it) - that took a
 * whole card of vertical space just for filters. This is a single flex row
 * instead: give the search field `fieldClassName="ui-filterbar__search
 * ui-field--compact"` so it flexes wider than the rest, give every other
 * field `fieldClassName="ui-field--compact"` (Input / Select / DatePicker)
 * or `className="ui-field--compact"` (SearchableSelect / MultiSelect), and
 * the row wraps onto a second line only when the screen is too narrow to
 * fit everything - never a horizontal overflow.
 *
 * Purely a layout container: it renders nothing on its own, and changes no
 * filtering behaviour - the fields inside still call whatever `onChange`
 * they always did.
 */
export function FilterBar({ children, className = '', ...rest }) {
  return (
    <div className={`ui-filterbar ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export default FilterBar;
