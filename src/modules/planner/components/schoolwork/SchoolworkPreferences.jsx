import { useRef, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { toast } from '../../../../hooks/useToast';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { VIEW_OPTIONS } from '../../schoolwork';
import { SubjectColorsEditor } from './SubjectColorsDialog';
import { ViewIcon } from './ViewSwitcher';
import './schoolwork.css';

const OPTIONS = [
  { key: 'showTypeIcons', label: 'Show assignment type icons', hint: 'A small picture for homework, reading, projects…' },
  { key: 'showEstimatedTime', label: 'Show estimated time', hint: 'How long each piece of work should take' },
  { key: 'showPersonalEvents', label: 'Show personal events on schoolwork board', hint: 'Practice, family time and plans - always on the calendar' },
];

function SwitchRow({ id, label, hint, checked, onChange }) {
  return (
    <li className="sw-option">
      <span className="sw-option__text">
        <span id={`${id}-label`} className="sw-option__label">
          {label}
        </span>
        <span className="sw-option__hint">{hint}</span>
      </span>
      <span className="pl-row" style={{ flexWrap: 'nowrap' }}>
        <span className="sw-switch__state" aria-hidden="true">
          {checked ? 'On' : 'Off'}
        </span>
        <button type="button" role="switch" aria-checked={Boolean(checked)} aria-labelledby={`${id}-label`} className="sw-switch" data-testid={id} onClick={() => onChange(!checked)} />
      </span>
    </li>
  );
}

/**
 * "Customize My Growing Focus": which view the schoolwork opens in (sticky
 * notes, list or calendar - switchable any time), three display switches and
 * the subject colours. For the student themself, or a parent for their child
 * (`store` = useSchoolworkSettings('me' | childId), `whose` = "your" | "Ava's").
 * Every choice saves at once.
 */
export function SchoolworkPreferences({ store, whose = 'your', idPrefix = 'sw' }) {
  const { preferences, update } = store;
  // Subject colours open in place (with Back), so this also works inside a dialog.
  const [showColors, setShowColors] = useState(false);
  const radios = useRef([]);

  const save = (patch) =>
    update(patch).catch((err) => {
      toast.error(getErrorMessage(err) || 'Couldn’t save that - please try again.');
    });

  const pick = (index) => {
    const option = VIEW_OPTIONS[(index + VIEW_OPTIONS.length) % VIEW_OPTIONS.length];
    radios.current[VIEW_OPTIONS.indexOf(option)]?.focus();
    if (option.key !== preferences.defaultView) save({ defaultView: option.key });
  };

  if (showColors) {
    return (
      <div className="sw-prefs">
        <div className="pl-row" style={{ justifyContent: 'space-between' }}>
          <h3 className="sw-prefs__title" style={{ margin: 0 }}>
            Subject colours
          </h3>
          <button type="button" className="pl-link" onClick={() => setShowColors(false)}>
            <LuChevronLeft size={15} aria-hidden="true" /> Back
          </button>
        </div>
        <p className="sw-muted" style={{ margin: 0 }}>
          Each subject keeps one colour on {whose} sticky notes, list and calendar.
        </p>
        <SubjectColorsEditor store={store} />
      </div>
    );
  }

  return (
    <div className="sw-prefs">
      <section aria-labelledby={`${idPrefix}-view-title`}>
        <h3 id={`${idPrefix}-view-title`} className="sw-prefs__title">
          How would you like to see {whose} schoolwork?
        </h3>
        <div className="sw-choices" role="radiogroup" aria-labelledby={`${idPrefix}-view-title`}>
          {VIEW_OPTIONS.map((v, index) => {
            const checked = preferences.defaultView === v.key;
            return (
              <button
                key={v.key}
                ref={(el) => {
                  radios.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                className="sw-choice"
                data-testid={`${idPrefix}-view-${v.key}`}
                onClick={() => !checked && save({ defaultView: v.key })}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    pick(index + 1);
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    pick(index - 1);
                  }
                }}
              >
                <span className="sw-choice__icon">
                  <ViewIcon view={v.key} size={22} />
                </span>
                <span className="sw-choice__label">{v.label}</span>
                <span className="sw-choice__hint">{v.hint}</span>
              </button>
            );
          })}
        </div>
        <p className="sw-muted" style={{ margin: '8px 0 0' }}>
          This is where {whose === 'your' ? 'you start' : 'they start'}. Switch views any time - every view shows the same plan.
        </p>
      </section>

      <section aria-labelledby={`${idPrefix}-options-title`}>
        <h3 id={`${idPrefix}-options-title`} className="sw-prefs__title">
          Other customization options
        </h3>
        <ul className="sw-options">
          {OPTIONS.map((o) => (
            <SwitchRow key={o.key} id={`${idPrefix}-${o.key}`} label={o.label} hint={o.hint} checked={preferences[o.key]} onChange={(v) => save({ [o.key]: v })} />
          ))}
          <li>
            <button type="button" className="sw-option" onClick={() => setShowColors(true)}>
              <span className="sw-option__text">
                <span className="sw-option__label">Customize subject colors</span>
                <span className="sw-option__hint">One colour per subject, everywhere</span>
              </span>
              <LuChevronRight size={18} aria-hidden="true" />
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default SchoolworkPreferences;
