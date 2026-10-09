import { useEffect, useState } from 'react';
import { LuBellRing, LuLock } from 'react-icons/lu';
import { Alert, Badge, Button, Loader, Modal } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { usePush } from '../hooks/usePush';
import notificationService from '../services/notification.service';

const CHANNELS = [
  { key: 'inApp', label: 'In app' },
  { key: 'email', label: 'Email' },
  { key: 'push', label: 'Browser' },
];

/** A labelled on/off switch (the app's switch look, `sub-switch`-style, from notificationsPage.css). */
function Switch({ id, label, checked, disabled, onChange }) {
  return (
    <label className="sn-set__switch" htmlFor={id}>
      <button id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} className="sn-switch" onClick={() => onChange(!checked)} />
      <span>{label}</span>
    </label>
  );
}

/**
 * "Notification settings" (Phase 1: "opt in or out of specific notification
 * types", "in-app, email and browser push"). One row per type this person can
 * get (backend notificationPreferences.service catalog for their role), a
 * switch per channel; safety alerts and payment problems are always on. The
 * Browser switch at the top turns push on for THIS device.
 */
export default function NotificationSettingsModal({ isOpen, onClose }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const push = usePush();

  useEffect(() => {
    if (!isOpen) return undefined;
    let alive = true;
    notificationService
      .getPreferences()
      .then((res) => alive && setItems(res.data ?? []))
      .catch((err) => alive && setError(getErrorMessage(err)));
    return () => {
      alive = false;
    };
  }, [isOpen]);

  const change = async (type, channel, value) => {
    const before = items;
    setItems((list) => list.map((i) => (i.type === type ? { ...i, [channel]: value } : i)));
    try {
      const res = await notificationService.updatePreferences([{ type, [channel]: value }]);
      setItems(res.data ?? before);
    } catch (err) {
      setItems(before);
      toast.error(getErrorMessage(err));
    }
  };

  const showPush = !['unsupported', 'off-server'].includes(push.status);
  // A row with nothing to switch here (push-only while push is unavailable) is left out.
  const rows = (items ?? []).filter((i) => i.locked || i.channels.some((c) => c !== 'push' || showPush));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification settings" description="Choose what you hear about, and how." size="md" className="sn-set">
      {showPush && (
        <section className="sn-set__device" aria-label="Browser notifications on this device">
          <span className="sn-set__device-icon" aria-hidden="true">
            <LuBellRing />
          </span>
          <div className="sn-set__device-text">
            <p className="sn-set__label">Browser notifications on this device</p>
            <p className="sn-set__hint">
              {push.status === 'blocked'
                ? 'Blocked in your browser. Allow notifications for this site in your browser settings to turn them on.'
                : push.status === 'on'
                  ? 'On - choose below which ones pop up.'
                  : 'Get a pop-up even when this tab is closed.'}
            </p>
          </div>
          {push.status === 'on' ? (
            <Button type="button" variant="secondary" size="sm" loading={push.busy} onClick={push.disable}>
              Turn off
            </Button>
          ) : (
            <Button type="button" size="sm" loading={push.busy} disabled={push.status !== 'off'} onClick={push.enable}>
              Turn on
            </Button>
          )}
        </section>
      )}
      {push.error && (
        <Alert variant="error" className="ui-field">
          {push.error}
        </Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}
      {!items && !error && <Loader message="Loading your settings…" />}
      {items && !rows.length && <p className="sn-set__hint">There are no notification choices for your account here.</p>}
      {rows.length > 0 && (
        <ul className="sn-set__list">
          {rows.map((item) => (
            <li key={item.type} className="sn-set__row">
              <div className="sn-set__text">
                <p className="sn-set__label">
                  {item.label}
                  {item.locked && (
                    <Badge variant="neutral" className="sn-set__always">
                      <LuLock size={11} aria-hidden="true" /> Always on
                    </Badge>
                  )}
                </p>
                <p className="sn-set__hint">{item.description}</p>
              </div>
              {!item.locked && (
                <div className="sn-set__switches">
                  {CHANNELS.filter((c) => item.channels.includes(c.key) && (c.key !== 'push' || showPush)).map((c) => (
                    <Switch
                      key={c.key}
                      id={`pref-${item.type}-${c.key}`}
                      label={c.label}
                      checked={Boolean(item[c.key])}
                      onChange={(value) => change(item.type, c.key, value)}
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
