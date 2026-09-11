import { forwardRef } from 'react';
import Input from './Input';

/**
 * Search field with a clear button.
 *
 * Debouncing belongs to the caller (useDebounce) so this component stays a
 * pure controlled input.
 *
 * A filter box never validates, so it does not reserve the empty helper line
 * the way a form field does - that would only add dead space to a toolbar.
 * Pass a hint or error and the line appears as usual.
 */
export const SearchInput = forwardRef(function SearchInput(
  { value, onChange, onClear, placeholder = 'Search…', name = 'search', ...props },
  ref
) {
  const handleClear = () => {
    onClear?.();
    onChange?.({ target: { name, value: '' } });
  };

  return (
    <Input
      ref={ref}
      type="search"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      reserveHelper={false}
      startAdornment={<span aria-hidden="true">🔍</span>}
      endAdornment={
        value ? (
          <button
            type="button"
            className="ui-input-affix"
            style={{ position: 'static' }}
            onClick={handleClear}
            aria-label="Clear search"
          >
            <span aria-hidden="true">✕</span>
          </button>
        ) : null
      }
      {...props}
    />
  );
});

export default SearchInput;
