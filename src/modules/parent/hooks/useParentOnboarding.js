import { createContext, useContext } from 'react';

/**
 * Whether the signed-in parent has finished onboarding, and a way to
 * re-check after they do. Provided by layouts/ParentLayout.jsx, which also
 * uses it to send a parent to /parent/onboarding until it's complete.
 */
export const ParentOnboardingContext = createContext({ completed: true, refresh: () => Promise.resolve() });

export function useParentOnboarding() {
  return useContext(ParentOnboardingContext);
}

export default useParentOnboarding;
