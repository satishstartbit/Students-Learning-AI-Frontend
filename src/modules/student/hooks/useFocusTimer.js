import { useCallback, useEffect, useRef, useState } from 'react';
import focusService from '../services/focus.service';
import { getErrorMessage } from '../../../utils/errorHandler';

/**
 * The focus timer's state machine: idle -> running -> paused -> (running) ->
 * ended. The clock itself ticks locally (setInterval) for a smooth display;
 * the server is only told about the edges (start/pause/resume/end), and it
 * is the server's event trail, not the client's tick count, that decides the
 * session's real elapsed minutes - see services/focus.service.js on the
 * backend. `elapsedSeconds` here is therefore a display estimate only.
 */
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

  // Pick up an already-running session (a refresh mid-session should not lose it).
  useEffect(() => {
    let cancelled = false;
    focusService
      .getActiveSession()
      .then((res) => {
        if (cancelled) return;
        const active = res?.data ?? null;
        setSession(active);
        if (active?.status === 'in_progress') {
          setElapsedSeconds((active.actualMinutes ?? 0) * 60);
          startTicking();
        } else if (active?.status === 'paused') {
          setElapsedSeconds((active.actualMinutes ?? 0) * 60);
        }
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [startTicking]);

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

  const start = useCallback(
    (options) =>
      run(() => focusService.startSession(options)).then((next) => {
        setSession(next);
        setElapsedSeconds(0);
        startTicking();
        return next;
      }),
    [run, startTicking]
  );

  const pause = useCallback(
    () =>
      run(() => focusService.pauseSession(session.id)).then((next) => {
        setSession(next);
        stopTicking();
        return next;
      }),
    [run, session]
  );

  const resume = useCallback(
    () =>
      run(() => focusService.resumeSession(session.id)).then((next) => {
        setSession(next);
        startTicking();
        return next;
      }),
    [run, session, startTicking]
  );

  const complete = useCallback(
    () =>
      run(() => focusService.completeSession(session.id)).then((next) => {
        setSession(next);
        stopTicking();
        return next;
      }),
    [run, session]
  );

  const abandon = useCallback(
    () =>
      run(() => focusService.abandonSession(session.id)).then((next) => {
        setSession(next);
        stopTicking();
        return next;
      }),
    [run, session]
  );

  const reset = useCallback(() => {
    setSession(null);
    setElapsedSeconds(0);
  }, []);

  return { session, elapsedSeconds, isLoading, isBusy, error, start, pause, resume, complete, abandon, reset };
}

export default useFocusTimer;
