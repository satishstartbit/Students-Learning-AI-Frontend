/**
 * The little figure beside "Where do you feel it in your body?".
 *
 * Purely a reflection of what is picked: each region fills when a body area
 * whose `figure_part` names it is selected. Areas an admin adds without a
 * figure part (or with one this drawing doesn't have, like "Not sure")
 * simply don't light anything - they still work as chips.
 *
 * Decoration, not a control: the chips are what a student operates, so this
 * is aria-hidden rather than a second, harder-to-hit target.
 */
export function CheckInFigure({ parts = [] }) {
  const on = (part) => (parts.includes(part) ? 'true' : 'false');

  return (
    <svg className="ci-figure" viewBox="0 0 64 104" role="presentation" aria-hidden="true">
      {/* head */}
      <rect className="ci-figure__part" data-on={on('head')} x="21" y="4" width="22" height="20" rx="9" />
      <circle className="ci-figure__dot" cx="32" cy="14" r="2.4" />
      {/* neck */}
      <path d="M32 24v4" stroke="currentColor" strokeWidth="1.4" fill="none" />

      {/* chest and tummy - one torso, two regions */}
      <rect className="ci-figure__part" data-on={on('chest')} x="20" y="28" width="24" height="19" rx="8" />
      <circle className="ci-figure__dot" cx="32" cy="37" r="2.6" />
      <rect className="ci-figure__part" data-on={on('tummy')} x="21" y="48" width="22" height="17" rx="7" />
      <circle className="ci-figure__dot" cx="32" cy="56" r="2.6" />

      {/* arms, ending in hands */}
      <path d="M20 33h-6a3 3 0 0 0-3 3v13" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M44 33h6a3 3 0 0 1 3 3v13" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle className="ci-figure__part" data-on={on('hands')} cx="11" cy="53" r="4.5" />
      <circle className="ci-figure__part" data-on={on('hands')} cx="53" cy="53" r="4.5" />

      {/* legs */}
      <rect className="ci-figure__part" data-on={on('legs')} x="22" y="68" width="8.5" height="20" rx="4" />
      <rect className="ci-figure__part" data-on={on('legs')} x="33.5" y="68" width="8.5" height="20" rx="4" />
      {/* feet */}
      <rect className="ci-figure__part" data-on={on('legs')} x="20" y="89" width="12" height="7" rx="3.5" />
      <rect className="ci-figure__part" data-on={on('legs')} x="32" y="89" width="12" height="7" rx="3.5" />
    </svg>
  );
}

export default CheckInFigure;
