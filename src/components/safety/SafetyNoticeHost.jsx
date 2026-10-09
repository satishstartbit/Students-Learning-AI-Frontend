import { useEffect, useState } from 'react';
import { LuHeartHandshake } from 'react-icons/lu';
import { Button, Modal } from '../common';
import HelpLines from './HelpLines';
import { SAFETY_NOTICE_EVENT } from './safetyEvents';
import './safety.css';

/**
 * Shows the safety notice when something a student saved raised a concern
 * (Phase 1 §4). Mounted once for the whole student area (StudentLayout), so
 * notes, the check-in, steps and answers need no code of their own: the API
 * client announces any `safetyNotice` a save returns.
 *
 * The words and help lines are the admin's ("Safety messages"). What was
 * saved is kept - this only makes sure the student knows where help is.
 * `kid` = the K-4 look: bigger, friendlier type.
 */
export function SafetyNoticeHost({ kid = false }) {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const onNotice = (event) => setNotice(event.detail ?? null);
    window.addEventListener(SAFETY_NOTICE_EVENT, onNotice);
    return () => window.removeEventListener(SAFETY_NOTICE_EVENT, onNotice);
  }, []);

  if (!notice) return null;
  const paragraphs = String(notice.message ?? '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Modal
      isOpen
      onClose={() => setNotice(null)}
      size="sm"
      title={notice.title || 'You matter'}
      closeOnOverlayClick={false}
      className={`sf-notice${kid ? ' sf-notice--kid' : ''}`}
      footer={
        <Button type="button" onClick={() => setNotice(null)}>
          OK
        </Button>
      }
    >
      <div className="sf-notice__body">
        <span className="sf-notice__icon" aria-hidden="true">
          <LuHeartHandshake />
        </span>
        <div className="sf-notice__text">
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
      <HelpLines lines={notice.resources} size={kid ? 'lg' : 'md'} />
    </Modal>
  );
}

export default SafetyNoticeHost;
