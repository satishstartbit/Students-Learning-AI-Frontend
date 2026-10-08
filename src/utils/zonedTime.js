/**
 * A date and time on a given time zone's wall clock -> the UTC instant, the
 * reverse of what `utils/date.js` shows. Pure (no active-user lookup) so it
 * can be tested on its own; `utils/date.js#zonedDateTimeToIso` passes the
 * signed-in student's zone.
 *
 * Canada has six zones and daylight time, so "2026-11-01 01:30" means a
 * different instant in Toronto, Regina and Vancouver, and on the autumn
 * change day 01:30 happens twice (the first one is used); a time skipped in
 * spring lands an hour later. Never build the instant with `new Date(y, m, d,
 * h, min)` - that is the browser's zone, not the student's.
 */

function wallClockOf(instantMs, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    numberingSystem: 'latn',
  }).formatToParts(new Date(instantMs));
  const p = Object.fromEntries(parts.map((x) => [x.type, Number(x.value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
}

/** The zone's offset from UTC at an instant, in ms (Toronto in summer: -4h). */
const offsetAt = (instantMs, timeZone) => wallClockOf(instantMs, timeZone) - instantMs;

/**
 * "2026-10-09" + "15:30" in "America/Vancouver" -> Date for 22:30 UTC.
 * Returns null for anything that isn't a real day key and HH:MM.
 */
export function zonedWallTimeToDate(dateKey, hhmm, timeZone) {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey ?? ''));
  const time = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? ''));
  if (!day || !time || !timeZone) return null;
  const [year, month, date] = day.slice(1).map(Number);
  const [hour, minute] = time.slice(1).map(Number);
  if (month < 1 || month > 12 || date < 1 || date > 31 || hour > 23 || minute > 59) return null;

  const asIfUtc = Date.UTC(year, month - 1, date, hour, minute);
  // Two passes settle the offset across a daylight-time change.
  let guess = asIfUtc - offsetAt(asIfUtc, timeZone);
  const corrected = asIfUtc - offsetAt(guess, timeZone);
  if (corrected !== guess) {
    // Autumn's repeated hour: keep the earlier of the two instants.
    guess = Math.min(guess, corrected);
  }
  return new Date(guess);
}

export default { zonedWallTimeToDate };
