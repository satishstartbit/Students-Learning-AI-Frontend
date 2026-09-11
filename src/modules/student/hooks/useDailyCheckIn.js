import { useCallback, useState } from 'react';
import { session } from '../../../utils/storage';
import { getDateKey } from '../../../utils/date';

/**
 * Today's mood + energy check-in.
 *
 * UI-only for now: the /check-ins API is still an empty stub on the backend
 * (services/checkIn.service.js), so the answer lives in sessionStorage - per
 * student, per calendar day in their own timezone - and disappears when the
 * browser closes, so nothing lingers on a shared classroom device. When the
 * API lands, replace the two `session` calls with it; the component contract
 * ({ mood, energy, update }) doesn't need to change.
 */
export function useDailyCheckIn(userId) {
  // Fixed for the life of the page; a new day means a new visit.
  const [key] = useState(() => `kid.checkin.${userId ?? 'guest'}.${getDateKey()}`);
  const [checkIn, setCheckIn] = useState(() => session.get(key, null));

  const update = useCallback(
    (patch) => {
      const next = { ...checkIn, ...patch };
      setCheckIn(next);
      session.set(key, next);
    },
    [checkIn, key]
  );

  return {
    mood: checkIn?.mood ?? null,
    energy: checkIn?.energy ?? null,
    // How many minutes the student says they have free today - read by the
    // Grade 6+ Regulation Toolkit's recommendation (see
    // RegulationToolkitCard). Not asked of K-5 students.
    availableMinutes: checkIn?.availableMinutes ?? null,
    update,
  };
}

export default useDailyCheckIn;
