import { createContext, useCallback, useContext, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { local } from '../../../utils/storage';

/**
 * K-5 display preferences, remembered per student on this device.
 *
 *   calm  switch off moving animations and confetti (Settings -> Calm mode).
 *         The OS "reduce motion" setting is always respected on top of it.
 *
 * Provided by layouts/KidLayout.jsx.
 */
export const KidPreferencesContext = createContext({ calm: false, setCalm: () => {} });

export function useKidPreferences() {
  return useContext(KidPreferencesContext);
}

/**
 * False when calm mode is on or the OS asks for reduced motion - for effects
 * <MotionConfig> can't switch off itself (confetti, the hand-drawn underline).
 */
export function useMotionAllowed() {
  const { calm } = useKidPreferences();
  const prefersReducedMotion = useReducedMotion();
  return !calm && !prefersReducedMotion;
}

/** State + persistence for calm mode. Keyed by user so shared devices don't mix students up. */
export function useCalmPreference(userId) {
  const key = `kid.calm.${userId ?? 'guest'}`;
  const [calm, setCalmState] = useState(() => local.get(key, false) === true);

  const setCalm = useCallback(
    (next) => {
      setCalmState(next);
      local.set(key, Boolean(next));
    },
    [key]
  );

  return [calm, setCalm];
}

export default useKidPreferences;
