/**
 * Filled, colourful icons for the K-5 navigation - the cut-paper icons in
 * the mockup. Each is decorative (aria-hidden): the visible label beside it
 * carries the meaning. Colours are part of the drawing, so they don't follow
 * the text colour.
 */

function Svg({ children, className, ...props }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className} {...props}>
      {children}
    </svg>
  );
}

export function HomeIcon(props) {
  return (
    <Svg {...props}>
      <path d="M7.5 14.2v11.3a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V14.2L16 7.2z" fill="#3565b0" />
      <path
        d="M4.5 15.4 16 5.6l11.5 9.8"
        fill="none"
        stroke="#244a8c"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="13" y="18.5" width="6" height="9" rx="1.6" fill="#d3e3f6" />
    </Svg>
  );
}

export function NotebookIcon(props) {
  return (
    <Svg {...props}>
      <rect x="7" y="3.5" width="18.5" height="25" rx="3" fill="#f0a060" />
      <rect x="7" y="3.5" width="4.5" height="25" rx="2.2" fill="#c96a36" />
      <path
        d="M14.5 10.5h7.5M14.5 15h7.5M14.5 19.5h5"
        stroke="#fff3e4"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function LeafIcon(props) {
  return (
    <Svg {...props}>
      <path
        d="M27 4.5C15 4.5 6 11 6 21.2c0 1.9.4 3.6 1.1 5.1 1.9 1.3 3.9 1.7 6.2 1.7C22.4 28 27.5 19 27 4.5z"
        fill="#4f9a45"
      />
      <path
        d="M8 27.5c3.2-6.5 7.7-11.4 14-15.6"
        fill="none"
        stroke="#2f6e2a"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function StarIcon(props) {
  return (
    <Svg {...props}>
      <path
        d="M16 3.4l3.3 8.1 8.7.6-6.7 5.6 2.2 8.5L16 21.5l-7.5 4.7 2.2-8.5L4 12.1l8.7-.6z"
        fill="#f6c445"
        stroke="#e7a81c"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SparkleIcon(props) {
  return (
    <Svg {...props}>
      <path
        d="M13.5 3.5c.9 5.7 3.4 8.2 9.1 9.1-5.7.9-8.2 3.4-9.1 9.1-.9-5.7-3.4-8.2-9.1-9.1 5.7-.9 8.2-3.4 9.1-9.1z"
        fill="#7b68d6"
      />
      <path
        d="M24.2 17.6c.4 2.5 1.6 3.7 4.1 4.1-2.5.4-3.7 1.6-4.1 4.1-.4-2.5-1.6-3.7-4.1-4.1 2.5-.4 3.7-1.6 4.1-4.1z"
        fill="#f6c445"
      />
    </Svg>
  );
}

export function CalendarIcon(props) {
  return (
    <Svg {...props}>
      <rect x="4.5" y="6.5" width="23" height="21" rx="3" fill="#fdfaf3" stroke="#e2d5bd" strokeWidth="1.5" />
      <path d="M4.5 12.5h23" stroke="#3565b0" strokeWidth="2.4" />
      <rect x="9" y="3" width="3" height="6" rx="1.5" fill="#3565b0" />
      <rect x="20" y="3" width="3" height="6" rx="1.5" fill="#3565b0" />
      <g fill="#f6c445">
        <rect x="8.5" y="16" width="4" height="4" rx="1.2" />
        <rect x="14" y="16" width="4" height="4" rx="1.2" />
        <rect x="19.5" y="16" width="4" height="4" rx="1.2" />
        <rect x="8.5" y="21.5" width="4" height="4" rx="1.2" />
      </g>
    </Svg>
  );
}

export function GearIcon(props) {
  return (
    <Svg {...props}>
      <g fill="#8a8178">
        {[0, 45, 90, 135].map((angle) => (
          <rect key={angle} x="13.8" y="3" width="4.4" height="26" rx="1.8" transform={`rotate(${angle} 16 16)`} />
        ))}
        <circle cx="16" cy="16" r="9" />
      </g>
      <circle cx="16" cy="16" r="3.8" fill="#f8f3ea" />
    </Svg>
  );
}
