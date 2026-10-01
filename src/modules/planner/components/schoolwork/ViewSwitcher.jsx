import { LuCalendarDays, LuListChecks, LuStickyNote } from 'react-icons/lu';
import { VIEW_OPTIONS } from '../../schoolwork';
import './schoolwork.css';

const ICONS = { board: LuStickyNote, list: LuListChecks, calendar: LuCalendarDays };

/** The icon for one of the three views. */
export function ViewIcon({ view, size = 16 }) {
  const Icon = ICONS[view] ?? LuListChecks;
  return <Icon size={size} aria-hidden="true" />;
}

/**
 * Sticky notes / List / Calendar - switch at any time; the settings screen
 * decides which one opens first. `labels` renames a view (K-5 says "My week").
 */
export function ViewSwitcher({ value, onChange, labels = {}, label = 'Show my schoolwork as' }) {
  return (
    <div className="sw-views" role="group" aria-label={label}>
      {VIEW_OPTIONS.map((v) => (
        <button key={v.key} type="button" aria-pressed={value === v.key} onClick={() => onChange(v.key)}>
          <ViewIcon view={v.key} size={15} />
          {labels[v.key] ?? v.label}
        </button>
      ))}
    </div>
  );
}

export default ViewSwitcher;
