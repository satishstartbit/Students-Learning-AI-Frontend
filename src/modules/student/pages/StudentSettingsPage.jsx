import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuBell, LuChevronRight, LuCircleHelp, LuPalette, LuSmile, LuTimer } from 'react-icons/lu';
import { Alert, Button, Input, Modal } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useStudentSettings } from '../hooks/useStudentSettings';
import '../components/settings/studentSettings.css';

/**
 * /student/settings for Grade 6+ (K-5 has KidSettingsPage), built to the
 * student settings mockup. Every control saves straight to /student-settings
 * (StudentSettingsProvider - optimistic, rolled back with a message if the
 * save fails) and the app-wide ones (appearance, larger text, reduce motion)
 * take effect immediately. Name here is the name the app greets the student
 * by; their real name, grade and school stay with their parent and teachers.
 */

const FOCUS_LENGTHS = [15, 20, 25, 30, 45, 60];
const APPEARANCES = [
  { value: 'system', label: 'Match device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function Group({ icon: Icon, label, children }) {
  const id = `ss-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <section className="ss-group" aria-labelledby={id}>
      <h2 id={id} className="ss-group__label">
        <Icon size={13} aria-hidden="true" /> {label}
      </h2>
      <ul className="ss-card">{children}</ul>
    </section>
  );
}

function RowText({ label, hint, danger, id }) {
  return (
    <span className="ss-row__text">
      <span id={id} className={`ss-row__label ${danger ? 'ss-row__label--danger' : ''}`.trim()}>
        {label}
      </span>
      {hint && <span className="ss-row__hint">{hint}</span>}
    </span>
  );
}

/** A row that opens a dialog, showing its current value and a chevron. */
function OpenRow({ label, hint, value, onClick }) {
  return (
    <li>
      <button type="button" className="ss-row ss-row--button" onClick={onClick} aria-haspopup="dialog">
        <RowText label={label} hint={hint} />
        <span className="ss-value">
          <span className="ss-value__text">{value}</span>
          <LuChevronRight size={16} aria-hidden="true" />
        </span>
      </button>
    </li>
  );
}

function SwitchRow({ id, label, hint, checked, onChange }) {
  return (
    <li className="ss-row">
      <RowText id={`${id}-label`} label={label} hint={hint} />
      <span className="ss-row__control">
        <button
          type="button"
          role="switch"
          className="ss-switch"
          aria-checked={Boolean(checked)}
          aria-labelledby={`${id}-label`}
          data-testid={id}
          onClick={() => onChange(!checked)}
        />
      </span>
    </li>
  );
}

function SelectRow({ id, label, hint, value, options, onChange }) {
  return (
    <li className="ss-row">
      <RowText id={`${id}-label`} label={label} hint={hint} />
      <span className="ss-row__control">
        <select id={id} className="ss-select" aria-labelledby={`${id}-label`} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </span>
    </li>
  );
}

function NameDialog({ isOpen, onClose, current, fullName, onSave }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="What should we call you?" description="This is the name on your dashboard. Your teachers still see your real name." size="sm">
      {isOpen && <NameForm current={current} fullName={fullName} onSave={onSave} onCancel={onClose} />}
    </Modal>
  );
}

function NameForm({ current, fullName, onSave, onCancel }) {
  const [value, setValue] = useState(current ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(value.trim());
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}
      <Input
        label="Name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={50}
        placeholder={fullName}
        hint={`Leave it empty to use ${fullName || 'your name'}.`}
        autoFocus
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={saving}>
          Save
        </Button>
      </div>
    </form>
  );
}

const INFO = {
  grade: {
    title: 'Your grade',
    body: 'Your grade is set by your parent or guardian. If it’s wrong, ask them to update it from their family account.',
  },
  school: {
    title: 'Your school',
    body: 'Your school comes from the teachers who send you assignments. If something looks wrong, let your teacher or parent know.',
  },
};

export default function StudentSettingsPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { settings, isLoading, error, update, reload } = useStudentSettings();
  const [dialog, setDialog] = useState(null);

  const save = (patch) =>
    update(patch).catch((err) => {
      toast.error(getErrorMessage(err) || 'Couldn’t save that setting - please try again.');
    });

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const header = (
    <>
      <h1 className="ss-title">Settings</h1>
      <p className="ss-subtitle">Set things up once, then forget about them.</p>
    </>
  );

  if (isLoading) {
    return (
      <div className="ss-page" aria-busy="true">
        {header}
        {[0, 1, 2].map((i) => (
          <div key={i} className="ss-skeleton" />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="ss-page">
        {header}
        <Alert variant="error">
          {error?.message ?? 'Couldn’t load your settings.'}{' '}
          <Button variant="secondary" size="sm" onClick={reload}>
            Try again
          </Button>
        </Alert>
      </div>
    );
  }

  const { about, reminders } = settings;
  const schools = about.schools ?? [];

  return (
    <div className="ss-page">
      {header}

      <Group icon={LuSmile} label="About you">
        <OpenRow
          label="Name"
          hint="The name we call you on your dashboard"
          value={settings.preferredName || about.fullName}
          onClick={() => setDialog('name')}
        />
        <OpenRow label="Grade" hint="Used to pick the right reading level" value={about.grade || 'Not set'} onClick={() => setDialog('grade')} />
        <OpenRow
          label="School"
          hint="Where your assignments come from"
          value={schools.length ? schools.join(', ') : 'Not set'}
          onClick={() => setDialog('school')}
        />
        <li className="ss-row">
          <RowText label="Learning profile" hint="How you like to learn and work" />
          <Link to="/student/onboarding" className="ss-link">
            Edit answers <LuChevronRight size={14} aria-hidden="true" />
          </Link>
        </li>
      </Group>

      <Group icon={LuBell} label="Check-in and reminders">
        <SwitchRow
          id="reminder-checkin"
          label="Daily check-in reminder"
          hint="A nudge each morning before school"
          checked={reminders.dailyCheckIn}
          onChange={(v) => save({ reminders: { dailyCheckIn: v } })}
        />
        <SwitchRow
          id="reminder-deadlines"
          label="Deadline reminders"
          hint="A heads-up the day before something is due"
          checked={reminders.deadlines}
          onChange={(v) => save({ reminders: { deadlines: v } })}
        />
        <SwitchRow
          id="reminder-weekly"
          label="Weekly plan nudge"
          hint="A reminder on Sunday to plan your week"
          checked={reminders.weeklyPlan}
          onChange={(v) => save({ reminders: { weeklyPlan: v } })}
        />
      </Group>

      <Group icon={LuTimer} label="Focus sessions">
        <SelectRow
          id="focus-length"
          label="Default focus length"
          hint="How long a session runs when you press start"
          value={String(settings.defaultFocusMinutes)}
          options={FOCUS_LENGTHS.map((m) => ({ value: String(m), label: `${m} minutes` }))}
          onChange={(v) => save({ defaultFocusMinutes: Number(v) })}
        />
        <SwitchRow
          id="background-sound"
          label="Background sound"
          hint="Start quiet audio when a session begins"
          checked={settings.backgroundSound}
          onChange={(v) => save({ backgroundSound: v })}
        />
      </Group>

      <Group icon={LuPalette} label="Look and feel">
        <SelectRow
          id="appearance"
          label="Appearance"
          hint="Light, dark, or match your device"
          value={settings.appearance}
          options={APPEARANCES}
          onChange={(v) => save({ appearance: v })}
        />
        <SwitchRow id="larger-text" label="Larger text" hint="Bump every size up a step" checked={settings.largerText} onChange={(v) => save({ largerText: v })} />
        <SwitchRow id="reduce-motion" label="Reduce motion" hint="Turn off the moving bits" checked={settings.reduceMotion} onChange={(v) => save({ reduceMotion: v })} />
        <li className="ss-row">
          <RowText label="Colours, avatar and stickers" hint="Everything on the Make it yours page" />
          <Link to="/student/make-it-yours" className="ss-link">
            Make it yours <LuChevronRight size={14} aria-hidden="true" />
          </Link>
        </li>
      </Group>

      <Group icon={LuCircleHelp} label="Help and account">
        <li className="ss-row">
          <RowText label="Help and how-to" hint="Short guides for every part of the app" />
          <Link to="/student/help" className="ss-link">
            Open guides <LuChevronRight size={14} aria-hidden="true" />
          </Link>
        </li>
        <li className="ss-row">
          <RowText label="Sign out" hint="You can sign back in any time" danger />
          <button type="button" className="ss-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </li>
      </Group>

      <NameDialog
        isOpen={dialog === 'name'}
        onClose={() => setDialog(null)}
        current={settings.preferredName}
        fullName={about.fullName}
        onSave={async (preferredName) => {
          await update({ preferredName });
          toast.success('Name saved');
          setDialog(null);
        }}
      />

      {(dialog === 'grade' || dialog === 'school') && (
        <Modal isOpen onClose={() => setDialog(null)} title={INFO[dialog].title} size="sm">
          <p style={{ marginTop: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
            {dialog === 'grade' ? about.grade || 'Not set yet' : schools.length ? schools.join(', ') : 'Not set yet'}
          </p>
          <p className="ui-hint" style={{ marginBottom: 'var(--spacing-lg)' }}>
            {INFO[dialog].body}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="sm" onClick={() => setDialog(null)}>
              Got it
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
