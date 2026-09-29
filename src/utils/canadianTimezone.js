// Pure (no import.meta.env), so node:test can load it: canadianTimezone.test.js.

/**
 * Canada's time zones: the six standard zones plus the two places that never
 * change their clocks - most of Saskatchewan (Central Standard all year) and
 * Yukon (UTC-7 all year since 2020). Keep in step with the backend's
 * utils/timezone.js. Re-exported from utils/locale.js.
 */
export const CANADIAN_TIMEZONES = [
  { value: 'America/St_Johns', label: 'Newfoundland Time', region: 'Newfoundland' },
  { value: 'America/Halifax', label: 'Atlantic Time', region: 'Atlantic' },
  { value: 'America/Toronto', label: 'Eastern Time', region: 'Eastern' },
  { value: 'America/Winnipeg', label: 'Central Time', region: 'Central' },
  { value: 'America/Regina', label: 'Saskatchewan (Central, no daylight time)', region: 'Saskatchewan' },
  { value: 'America/Edmonton', label: 'Mountain Time', region: 'Mountain' },
  { value: 'America/Whitehorse', label: 'Yukon (no daylight time)', region: 'Yukon' },
  { value: 'America/Vancouver', label: 'Pacific Time', region: 'Pacific' },
];

/** True for any IANA timezone name the runtime's Intl recognises (Region/City or UTC). */
export function isValidTimezone(timezone) {
  if (typeof timezone !== 'string' || !timezone) return false;
  // Region/City names only (plus UTC) - "EST"/"PST" are fixed offsets with no
  // daylight time. Same rule as backend utils/timezone.js.
  if (timezone !== 'UTC' && !/^[A-Za-z]+(?:[_-][A-Za-z]+)*(?:\/[A-Za-z0-9_+-]+)+$/.test(timezone)) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** Minutes east of UTC that `timeZone` is at `date` (e.g. -300 for Toronto in winter). */
function offsetMinutes(timeZone, date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  const wallClockAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((wallClockAsUtc - date.getTime()) / 60_000);
}

/** A zone's clock in mid-January and mid-July of `year`: winter and summer, DST included. */
function clockSignature(timeZone, year) {
  return `${offsetMinutes(timeZone, new Date(Date.UTC(year, 0, 15, 12)))}/${offsetMinutes(timeZone, new Date(Date.UTC(year, 6, 15, 12)))}`;
}

/**
 * The Canadian time zone for a device's zone, so nobody is ever asked to pick
 * one.
 *
 * - A zone on the list stays as it is.
 * - Any other zone maps to the Canadian zone that keeps the same clock in both
 *   winter and summer: America/Moncton -> Halifax, America/Iqaluit -> Toronto,
 *   America/Los_Angeles -> Vancouver, America/Phoenix -> Whitehorse. That also
 *   covers Windows machines that report a US zone for a Canadian city.
 * - A zone with no Canadian twin (a device set outside North America), a
 *   missing zone or a bad one gives `fallback` - the app default,
 *   America/Toronto unless configured otherwise.
 */
export function toCanadianTimezone(zone, fallback = 'America/Toronto', now = new Date()) {
  if (!isValidTimezone(zone)) return fallback;
  if (CANADIAN_TIMEZONES.some((tz) => tz.value === zone)) return zone;
  try {
    const year = now.getUTCFullYear();
    const signature = clockSignature(zone, year);
    const twin = CANADIAN_TIMEZONES.find((tz) => clockSignature(tz.value, year) === signature);
    return twin ? twin.value : fallback;
  } catch {
    return fallback;
  }
}
