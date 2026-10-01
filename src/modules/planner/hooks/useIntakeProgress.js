import { useEffect, useState } from 'react';
import intakeService from '../services/intake.service';

const READING = ['received', 'extracting'];
const POLL_MS = 1500;
const GIVE_UP_MS = 90_000;

/**
 * Follows one piece of added work while it is being read. Returns the latest
 * intake and `stillReading`; after 90 s it stops asking and says so (the
 * work keeps going on the server - the person can close and come back).
 */
export function useIntakeProgress(initial) {
  const [intake, setIntake] = useState(initial);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState(null);
  const id = intake?.id;
  const reading = READING.includes(intake?.status);

  useEffect(() => {
    if (!id || !reading) return undefined;
    const started = Date.now();
    let cancelled = false;
    let timer;
    const tick = async () => {
      try {
        const { data } = await intakeService.getIntake(id);
        if (cancelled) return;
        setIntake(data);
        if (!READING.includes(data?.status)) return;
      } catch (err) {
        if (cancelled) return;
        setError(err);
        return;
      }
      if (Date.now() - started > GIVE_UP_MS) {
        setTimedOut(true);
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, reading]);

  return { intake, setIntake, stillReading: reading && !timedOut && !error, timedOut, error };
}

export default useIntakeProgress;
