import { useEffect, useRef, useState } from 'react';
import { LuChevronDown, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { addDaysToKey, formatDateKey, weekdayOfKey } from '../../../../utils/date';

const monthStartOf = (key) => `${key.slice(0, 7)}-01`;

function shiftMonth(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 10);
}

/** Every day key shown for a month, Monday-first, padded with the neighbouring months' days. */
function monthGrid(monthKey) {
  const first = addDaysToKey(monthKey, -weekdayOfKey(monthKey));
  const nextMonth = shiftMonth(monthKey, 1);
  const keys = [];
  for (let key = first; key < nextMonth || keys.length % 7 !== 0; key = addDaysToKey(key, 1)) keys.push(key);
  return keys;
}

/**
 * The week label that opens a month calendar. Days with tasks are tinted,
 * with one dot per task (up to three); a day holding overdue work is
 * outlined in orange. Picking a day jumps the board to it.
 */
export function PlanMonthPicker({ label, selectedKey, todayKey, counts, onPick }) {
  const [open, setOpen] = useState(false);
  const [monthKey, setMonthKey] = useState(() => monthStartOf(selectedKey));
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setMonthKey(monthStartOf(selectedKey));
    setOpen((o) => !o);
  };

  const pick = (key) => {
    onPick(key);
    setOpen(false);
  };

  const days = monthGrid(monthKey);
  const weekdayNames = days.slice(0, 7).map((key) => ({
    key,
    narrow: formatDateKey(key, { weekday: 'narrow', month: undefined, day: undefined, year: undefined }),
    long: formatDateKey(key, { weekday: 'long', month: undefined, day: undefined, year: undefined }),
  }));
  const monthLabel = formatDateKey(monthKey, { month: 'long', day: undefined, year: 'numeric' });

  return (
    <div className="sp-picker" ref={rootRef}>
      <button type="button" className="sp-picker__trigger" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
        {label}
        <LuChevronDown size={14} aria-hidden="true" />
      </button>

      {open && (
        <div className="sp-picker__pop" role="dialog" aria-label="Choose a day">
          <div className="sp-picker__head">
            <button type="button" className="sp-iconbtn" onClick={() => setMonthKey((m) => shiftMonth(m, -1))} aria-label="Previous month">
              <LuChevronLeft size={16} aria-hidden="true" />
            </button>
            <span className="sp-picker__month" aria-live="polite">
              {monthLabel}
            </span>
            <button type="button" className="sp-iconbtn" onClick={() => setMonthKey((m) => shiftMonth(m, 1))} aria-label="Next month">
              <LuChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="sp-picker__grid">
            {weekdayNames.map((w) => (
              <abbr key={w.key} className="sp-picker__dow" title={w.long}>
                {w.narrow}
              </abbr>
            ))}
            {days.map((key) => {
              const info = counts.get(key);
              const total = info?.total ?? 0;
              const label = `${formatDateKey(key, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${
                total ? `, ${total} ${total === 1 ? 'task' : 'tasks'}` : ''
              }${info?.overdue ? ', overdue work' : ''}`;
              return (
                <button
                  key={key}
                  type="button"
                  className="sp-picker__day"
                  data-outside={key.slice(0, 7) !== monthKey.slice(0, 7) || undefined}
                  data-today={key === todayKey || undefined}
                  data-selected={key === selectedKey || undefined}
                  data-has={total > 0 || undefined}
                  data-overdue={info?.overdue ? true : undefined}
                  aria-label={label}
                  aria-current={key === todayKey ? 'date' : undefined}
                  onClick={() => pick(key)}
                >
                  <span>{Number(key.slice(8, 10))}</span>
                  <span className="sp-picker__dots" aria-hidden="true">
                    {Array.from({ length: Math.min(total, 3) }, (_, i) => (
                      <i key={i} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="sp-picker__foot">
            <span>Pick a day to jump to it</span>
            <button type="button" className="sp-picker__today" onClick={() => pick(todayKey)}>
              Today <LuChevronRight size={12} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanMonthPicker;
