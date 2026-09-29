import { CANADIAN_TIMEZONES, isValidTimezone, toCanadianTimezone } from './canadianTimezone.js';

export { CANADIAN_TIMEZONES, isValidTimezone };

/**
 * Central locale/timezone/currency/country configuration.
 *
 * Defaults come from Vite env vars (never hardcoded in more than one place)
 * and target Canada, but nothing here assumes every user is in Toronto -
 * Canada spans six timezones. `setActiveTimezone`/`setActiveLocale` let the
 * signed-in user's own preference (users.timezone / users.locale from the
 * API) override the default for every date/currency formatted afterwards,
 * without every call site needing to pass it explicitly.
 *
 * Nobody is asked for a time zone: it comes from the device, matched to a
 * Canadian zone (`detectBrowserTimezone`), at sign-up and on every visit
 * (hooks/useDeviceTimezone.js).
 */
export const DEFAULT_LOCALE = import.meta.env.VITE_DEFAULT_LOCALE || 'en-CA';
export const DEFAULT_TIMEZONE = import.meta.env.VITE_DEFAULT_TIMEZONE || 'America/Toronto';
export const DEFAULT_CURRENCY = import.meta.env.VITE_DEFAULT_CURRENCY || 'CAD';
export const DEFAULT_COUNTRY = import.meta.env.VITE_DEFAULT_COUNTRY || 'CA';

/**
 * This device's Canadian time zone: its own zone when it is one of Canada's,
 * the Canadian zone with the same clock when it isn't (a Windows PC in
 * Vancouver may report America/Los_Angeles), else the app default (a device
 * set outside North America). Used at sign-up and to keep the signed-in
 * user's zone current - there is no time zone picker anywhere.
 */
export function detectBrowserTimezone() {
  let zone;
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    zone = undefined;
  }
  return toCanadianTimezone(zone, DEFAULT_TIMEZONE);
}

/** Canadian provinces and territories - use instead of a free-text or US-states "State" field. */
export const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

/**
 * The active timezone/locale used by utils/date.js and utils/format.js when a
 * call site does not pass one explicitly. Set once the signed-in user is
 * known (see layouts/AuthenticatedLayout.jsx) so every existing call site -
 * there is no per-call timezone argument to thread through nine files -
 * automatically renders in that user's own timezone instead of the default.
 *
 * Module-level state, not React state: these are plain formatting functions,
 * not components, and re-rendering on a timezone change is handled by the
 * component that calls setActiveTimezone re-rendering itself (it already
 * does, since it reads the user from an auth hook).
 */
let activeTimezone = DEFAULT_TIMEZONE;
let activeLocale = DEFAULT_LOCALE;

export function setActiveTimezone(timezone) {
  activeTimezone = isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
}

export function setActiveLocale(locale) {
  activeLocale = locale || DEFAULT_LOCALE;
}

export const getActiveTimezone = () => activeTimezone;
export const getActiveLocale = () => activeLocale;

export default {
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  DEFAULT_CURRENCY,
  DEFAULT_COUNTRY,
  CANADIAN_TIMEZONES,
  CANADIAN_PROVINCES,
  setActiveTimezone,
  setActiveLocale,
  getActiveTimezone,
  getActiveLocale,
  isValidTimezone,
};
