import { createContext, useContext } from 'react';

/**
 * The student's check-in for today, shared by the gate, the Check In page,
 * the My Day / Home cards and the Focus page - loaded once per session by
 * <TodayCheckInProvider> (layouts/StudentLayout.jsx), not once per screen.
 *
 *   checkedIn  has the student checked in today (their own timezone's day)?
 *   checkIn    { id, date, mood, energy, availableMinutes, ... } or null
 *   save       (values) => Promise<{ checkIn, created, pointsAwarded }>
 *   refresh    re-fetch from the server
 */
export const TodayCheckInContext = createContext(null);

export function useTodayCheckIn() {
  const value = useContext(TodayCheckInContext);
  if (!value) throw new Error('useTodayCheckIn() must be used inside <TodayCheckInProvider>');
  return value;
}

export default useTodayCheckIn;
