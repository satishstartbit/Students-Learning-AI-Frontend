import { Link } from 'react-router-dom';
import { LuCalendarDays, LuChevronLeft, LuHouse, LuListChecks, LuSettings2, LuStickyNote, LuTimer, LuTrophy } from 'react-icons/lu';
import '../components/settings/studentSettings.css';

/**
 * /student/help - "Help and how-to" from Settings (Grade 6+). Short guides,
 * one per part of the app, each linking straight to the page it explains.
 * Uses native <details> so every guide opens with keyboard and screen readers
 * without extra state.
 */
const GUIDES = [
  {
    icon: LuHouse,
    title: 'Your Home page',
    to: '/student',
    steps: [
      'Check in first - tap the "Today’s check-in" card and tell us how you feel.',
      'Today’s Tasks shows what’s due today. The highlighted one is up next - press Start.',
      'Drag the dots on the left of a task to put your day in your own order.',
    ],
  },
  {
    icon: LuListChecks,
    title: 'Adding your own tasks',
    to: '/student/assignments',
    steps: [
      'Under "Add assignment", choose Type it to write a task, or Add photo to snap a worksheet.',
      'Tick the circle when you finish. Only you can see tasks you add.',
      'Find all of them under My own tasks on the Assignments page.',
    ],
  },
  {
    icon: LuStickyNote,
    title: 'Sticky notes',
    to: '/student',
    steps: [
      'Use "Add a note" on Home for quick reminders.',
      'Tap a note to edit it or change its colour. Tick it when it’s done - it stays on the board, faded.',
    ],
  },
  {
    icon: LuCalendarDays,
    title: 'Planning your week',
    to: '/student/calendar',
    steps: ['Plan shows your week at a glance.', 'Turn on the Sunday "Weekly plan nudge" in Settings for a reminder.'],
  },
  {
    icon: LuTimer,
    title: 'Focus sessions',
    to: '/student/focus',
    steps: [
      'Pick a task and a length, then press Start.',
      'Change the starting length and background sound in Settings → Focus sessions.',
      'Finishing a session earns points.',
    ],
  },
  {
    icon: LuTrophy,
    title: 'Points and rewards',
    to: '/student/rewards',
    steps: ['You earn points for check-ins, focus sessions and finished assignments.', 'Spend them on rewards on the Rewards page.'],
  },
  {
    icon: LuSettings2,
    title: 'Making the app comfortable',
    to: '/student/settings',
    steps: [
      'Settings → Look and feel: choose light or dark, larger text, or reduce motion.',
      'Your name, grade and school are looked after by your parent and teachers - ask them if something is wrong.',
    ],
  },
];

export default function StudentHelpPage() {
  return (
    <div className="ss-page">
      <Link to="/student/settings" className="ss-link" style={{ marginBottom: 12 }}>
        <LuChevronLeft size={14} aria-hidden="true" /> Settings
      </Link>
      <h1 className="ss-title">Help and how-to</h1>
      <p className="ss-subtitle">Short guides for every part of the app.</p>

      <ul className="ss-card">
        {GUIDES.map(({ icon: Icon, title, to, steps }) => (
          <li key={title}>
            <details className="ss-guide">
              <summary className="ss-row ss-row--button">
                <span className="ss-row__text" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={16} aria-hidden="true" />
                  <span className="ss-row__label">{title}</span>
                </span>
                <span className="ss-value" aria-hidden="true">
                  <span className="ss-guide__chevron">›</span>
                </span>
              </summary>
              <div className="ss-guide__body">
                <ol>
                  {steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <Link to={to} className="ss-link">
                  Go there <span aria-hidden="true">›</span>
                </Link>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
