import { useCallback, useEffect, useRef, useState } from 'react';
import focusService from '../services/focus.service';
import { getErrorMessage } from '../../../utils/errorHandler';

/**
 * The focus timer's state machine: idle -> running -> paused -> (running) ->
 * ended. The clock ticks locally (setInterval) for a smooth display; the
 * server is told about the edges (start/pause/resume/extend/end) and its
 * event trail decides the real elapsed time. Every server response carries
 * `elapsedSeconds` computed from that trail, so the local clock re-syncs on
 * each edge and a refreshed page resumes exactly where it was.
 *
 * Shared by the Grade 6+ Focus page and K-5 KidFocusPage.
 */
/** "5:09" - remaining/elapsed seconds as a clock face, shared by every Focus UI. */
export function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Server copy first (exact); older responses without it fall back to whole minutes. */
const serverElapsed = (session) => session?.elapsedSeconds ?? (session?.actualMinutes ?? 0) * 60;

export function useFocusTimer() {
  const [session, setSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);

  const tickRef = useRef(null);

  const stopTicking = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const startTicking = useCallback(() => {
    stopTicking();
    tickRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }, []);

  useEffect(() => stopTicking, []);

  /** Adopts a session from the server and matches the local clock to it. */
  const adopt = useCallback(
    (next) => {
      setSession(next);
      setElapsedSeconds(serverElapsed(next));
      if (next?.status === 'in_progress') startTicking();
      else stopTicking();
      return next;
    },
    [startTicking]
  );

  // Pick up an already-running session (a refresh mid-session should not lose it).
  useEffect(() => {
    let cancelled = false;
    focusService
      .getActiveSession()
      .then((res) => {
        if (!cancelled) adopt(res?.data ?? null);
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [adopt]);

  const run = useCallback(async (action) => {
    setIsBusy(true);
    setError(null);
    try {
      const res = await action();
      return res?.data ?? null;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const start = useCallback((options) => run(() => focusService.startSession(options)).then(adopt), [run, adopt]);

  const pause = useCallback(() => run(() => focusService.pauseSession(session.id)).then(adopt), [run, session, adopt]);

  const resume = useCallback(() => run(() => focusService.resumeSession(session.id)).then(adopt), [run, session, adopt]);

  const extend = useCallback((minutes = 5) => run(() => focusService.extendSession(session.id, minutes)).then(adopt), [run, session, adopt]);

  const setStep = useCallback((stepId) => run(() => focusService.setSessionStep(session.id, stepId)).then(adopt), [run, session, adopt]);

  const complete = useCallback(
    (options) => run(() => focusService.completeSession(session.id, options)).then(adopt),
    [run, session, adopt]
  );

  const abandon = useCallback(() => run(() => focusService.abandonSession(session.id)).then(adopt), [run, session, adopt]);

  const reset = useCallback(() => {
    stopTicking();
    setSession(null);
    setElapsedSeconds(0);
  }, []);

  return { session, elapsedSeconds, isLoading, isBusy, error, start, pause, resume, extend, setStep, complete, abandon, reset };
}

export default useFocusTimer;
