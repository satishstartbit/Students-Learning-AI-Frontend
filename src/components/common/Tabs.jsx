import { useId, useRef, useState } from 'react';

/**
 * Tabs following the WAI-ARIA tabs pattern: arrow keys move between tabs,
 * Home/End jump to the ends, and only the active tab is in the tab order.
 *
 * Controlled when `activeKey` is supplied, uncontrolled otherwise.
 *
 * @param items - [{ key, label, content, disabled }]
 */
export function Tabs({ items = [], activeKey, defaultActiveKey, onChange, className = '' }) {
  const baseId = useId();
  const tabRefs = useRef([]);

  const [internalKey, setInternalKey] = useState(defaultActiveKey ?? items[0]?.key);
  const currentKey = activeKey ?? internalKey;

  const select = (key) => {
    if (activeKey === undefined) setInternalKey(key);
    onChange?.(key);
  };

  const handleKeyDown = (event, index) => {
    const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i !== -1);
    const position = enabled.indexOf(index);
    if (position === -1) return;

    let next;
    if (event.key === 'ArrowRight') next = enabled[(position + 1) % enabled.length];
    else if (event.key === 'ArrowLeft')
      next = enabled[(position - 1 + enabled.length) % enabled.length];
    else if (event.key === 'Home') next = enabled[0];
    else if (event.key === 'End') next = enabled[enabled.length - 1];
    else return;

    event.preventDefault();
    select(items[next].key);
    tabRefs.current[next]?.focus();
  };

  const active = items.find((item) => item.key === currentKey);

  return (
    <div className={className}>
      <div className="ui-tabs__list" role="tablist">
        {items.map((item, index) => {
          const isActive = item.key === currentKey;

          return (
            <button
              key={item.key}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`${baseId}-tab-${item.key}`}
              type="button"
              role="tab"
              className="ui-tabs__tab"
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${item.key}`}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.key)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {active && (
        <div
          id={`${baseId}-panel-${active.key}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active.key}`}
          className="ui-tabs__panel"
          tabIndex={0}
        >
          {active.content}
        </div>
      )}
    </div>
  );
}

export default Tabs;
