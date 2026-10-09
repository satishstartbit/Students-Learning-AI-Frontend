import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Modal } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useTodayCheckIn } from '../hooks/useTodayCheckIn';

/**
 * Client answers "4. Daily check-in", for students whose check-in isn't
 * required: going to their work without checking in shows, once a day,
 * "Your check-in helps us understand what you need today…" with "Check in
 * now" and "Continue to my work". Continuing records the skip (they're
 * invited back later on Home); it never blocks the work. The words are the
 * admin's ("Daily check-in" setting).
 */
export function SkipCheckInPrompt() {
  const { checkedIn, skipped, skipPrompt, isLoading, error, skip } = useTodayCheckIn();
  const location = useLocation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || error || checkedIn || skipped || dismissed || !skipPrompt) return null;

  const checkInNow = () => {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    navigate(`/student/check-in?next=${next}`);
  };
  const continueToWork = async () => {
    setBusy(true);
    try {
      await skip();
    } catch (err) {
      // Never stand between them and their work: close it anyway.
      toast.error(getErrorMessage(err));
      setDismissed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={continueToWork}
      size="sm"
      title={skipPrompt.title}
      closeOnOverlayClick={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={continueToWork} loading={busy}>
            {skipPrompt.continueLabel}
          </Button>
          <Button type="button" onClick={checkInNow} disabled={busy}>
            {skipPrompt.checkInLabel}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, lineHeight: 1.55 }}>{skipPrompt.message}</p>
    </Modal>
  );
}

export default SkipCheckInPrompt;
