/**
 * Central locale/timezone/currency/country configuration.
 *
 * Defaults come from Vite env vars (never hardcoded in more than one place)
 * and target Canada, but nothing here assumes every user is in Toronto -
 * Canada spans six timezones. `setActiveTimezone`/`setActiveLocale` let the
 * signed-in user's own preference (users.timezone / users.locale from the
 * API) override the default for every date/currency formatted afterwards,
 * without every call site needing to pass it explicitly.
 */
export const DEFAULT_LOCALE = import.meta.env.VITE_DEFAULT_LOCALE || 'en-CA';
export const DEFAULT_TIMEZONE = import.meta.env.VITE_DEFAULT_TIMEZONE || 'America/Toronto';
export const DEFAULT_CURRENCY = import.meta.env.VITE_DEFAULT_CURRENCY || 'CAD';
export const DEFAULT_COUNTRY = import.meta.env.VITE_DEFAULT_COUNTRY || 'CA';

/** The zones named in the Canadian localization spec - offered first in any timezone picker. */
export const CANADIAN_TIMEZONES = [
  { value: 'America/St_Johns', label: 'Newfoundland Time', region: 'Newfoundland' },
  { value: 'America/Halifax', label: 'Atlantic Time', region: 'Atlantic' },
  { value: 'America/Toronto', label: 'Eastern Time', region: 'Eastern' },
  { value: 'America/Winnipeg', label: 'Central Time', region: 'Central' },
  { value: 'America/Edmonton', label: 'Mountain Time', region: 'Mountain' },
  { value: 'America/Vancouver', label: 'Pacific Time', region: 'Pacific' },
];

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

/** True for any IANA timezone name the browser's Intl implementation recognises. */
export function isValidTimezone(timezone) {
  if (typeof timezone !== 'string' || !timezone) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

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
