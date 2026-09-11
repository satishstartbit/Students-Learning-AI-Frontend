import { createContext, useContext } from 'react';

/**
 * What the student area knows about the signed-in student beyond the
 * session: their profile (grade, photo) and which grade band's experience
 * they get. Provided once by layouts/StudentLayout.jsx, so pages read it
 * instead of each fetching the profile again.
 *
 *   isJunior  Kindergarten-Grade 5 - the K-5 "My Learning Space" UI
 *   grade     the raw profile grade ("Grade 2"), or null
 *   profile   the student profile from GET /auth/me, or null
 */
export const StudentExperienceContext = createContext({
  isJunior: false,
  grade: null,
  profile: null,
});

export function useStudentExperience() {
  return useContext(StudentExperienceContext);
}

export default useStudentExperience;
