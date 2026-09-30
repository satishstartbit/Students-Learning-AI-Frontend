import { createContext, useContext } from 'react';

/**
 * The colour of each subject for the signed-in person's screens:
 *
 *   students          their own choices on top of the admin defaults
 *                     (planner SchoolworkSettingsProvider, in StudentLayout)
 *   parents, teachers the admin defaults from the Subjects master
 *                     (SubjectColorsProvider, in their layouts)
 *
 * `colorOf(subjectName)` returns '#RRGGBB' or null - null means "no colour
 * known", and the caller keeps its neutral look.
 */
export const SubjectColorContext = createContext(null);

const NONE = Object.freeze({ colorOf: () => null, ready: false });

export function useSubjectColors() {
  return useContext(SubjectColorContext) ?? NONE;
}

export default useSubjectColors;
