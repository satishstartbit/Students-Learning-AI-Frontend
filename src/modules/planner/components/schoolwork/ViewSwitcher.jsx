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
 * decides which one opens first. `labels` renames a view (the Plan page says
 * "Board"); `look="pill"` is the Plan mockup's rounded switch, words only.
 */
export function ViewSwitcher({ value, onChange, labels = {}, label = 'Show my schoolwork as', look, showIcons = look !== 'pill' }) {
  return (
    <div className="sw-views" role="group" aria-label={label} data-look={look}>
      {VIEW_OPTIONS.map((v) => (
        <button key={v.key} type="button" aria-pressed={value === v.key} onClick={() => onChange(v.key)}>
          {showIcons && <ViewIcon view={v.key} size={15} />}
          {labels[v.key] ?? v.label}
        </button>
      ))}
    </div>
  );
}

export default ViewSwitcher;
