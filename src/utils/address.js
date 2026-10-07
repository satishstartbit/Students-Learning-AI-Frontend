import { formatCanadianPostalCode } from './postalCode.js';

/**
 * Canada Post address format (Canadian Addressing Guidelines):
 *
 *   JOHN DOE                  recipient
 *   ABC COMPANY               additional delivery info (department, floor, suite)
 *   309-11211 85 ST NW        street line: unit-civic number, street, type, direction
 *   EDMONTON AB  T5G 0G9      municipality, province, TWO spaces, postal code
 *   CANADA                    only for international mail
 *
 * All upper case, no commas, periods or "#". The backend stores Canadian
 * addresses in this shape (validators/common.js#addressFields); forms apply
 * the same rules when a field loses focus so people see what will be saved.
 * Keep the normalization in sync with the backend's utils/address.js - the
 * two apps don't share code.
 */

/** Spellings that mean "this address is in Canada". */
export const CANADA_SPELLINGS = ['CA', 'CAN', 'CANADA'];
const CANADA_LINE = 'CANADA';

/** No country yet counts as Canada: the platform's addresses default to Canadian. */
export const isCanadianCountry = (country) =>
  !country || CANADA_SPELLINGS.includes(String(country).trim().toUpperCase());

/** Canada Post English street types, applied only where the type ends the street. */
const STREET_TYPES = {
  AVENUE: 'AVE',
  BOULEVARD: 'BLVD',
  CIRCLE: 'CIR',
  CIRCUIT: 'CIRCT',
  CONCESSION: 'CONC',
  COURT: 'CRT',
  CRESCENT: 'CRES',
  DRIVE: 'DR',
  ESPLANADE: 'ESPL',
  EXPRESSWAY: 'EXPY',
  FREEWAY: 'FWY',
  GARDENS: 'GDNS',
  HEIGHTS: 'HTS',
  HIGHWAY: 'HWY',
  PARKWAY: 'PKY',
  PLACE: 'PL',
  POINT: 'PT',
  PROMENADE: 'PROM',
  ROAD: 'RD',
  ROUTE: 'RTE',
  SQUARE: 'SQ',
  STREET: 'ST',
  TERRACE: 'TERR',
};

const DIRECTIONS = {
  NORTH: 'N',
  SOUTH: 'S',
  EAST: 'E',
  WEST: 'W',
  NORTHEAST: 'NE',
  NORTHWEST: 'NW',
  SOUTHEAST: 'SE',
  SOUTHWEST: 'SW',
};
const DIRECTION_CODES = new Set(Object.values(DIRECTIONS));

const UNIT_WORD = '(?:#|UNIT|APT|APARTMENT|SUITE|STE|APP)';
// "#309 11211 85 ST" / "APT 309, 11211 85 ST" / "309 - 11211 85 ST" -> "309-11211 85 ST"
const LEADING_UNIT = new RegExp(`^(?:${UNIT_WORD}\\s*([A-Z0-9]+)[\\s,-]+|([A-Z0-9]+)\\s*-\\s*)(\\d+[A-Z]?)\\b\\s*(.*)$`);
// "11211 85 ST NW, APT 309" / "11211 85 ST NW #309" -> "309-11211 85 ST NW"
const TRAILING_UNIT = new RegExp(`^(\\d+[A-Z]?)\\s+(.+?)[\\s,-]+${UNIT_WORD}\\s*([A-Z0-9]+)$`);

/** Upper case, "P.O." -> "PO", other periods -> space. */
const upperWithoutDots = (value) =>
  value
    .toUpperCase()
    .replace(/\b([A-Z])\.(?=[A-Z]\b)/g, '$1')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Upper case, no commas/periods/"#", single spaces. For names, line 2 and the municipality. */
export function normalizeAddressText(value) {
  if (typeof value !== 'string') return value;
  return upperWithoutDots(value)
    .replace(/[,#]/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "... MAIN STREET NORTH WEST" -> "... MAIN ST NW": direction and street type only at the end. */
function abbreviateEnding(words) {
  const out = [...words];
  const n = out.length;
  const pair = `${out[n - 2] ?? ''}${out[n - 1] ?? ''}`;
  const isPair = DIRECTIONS[pair]?.length === 2 || (out[n - 2]?.length === 1 && DIRECTION_CODES.has(pair) && pair.length === 2);
  if (n >= 4 && isPair) out.splice(n - 2, 2, DIRECTIONS[pair] ?? pair);

  const last = out.length - 1;
  const direction = DIRECTIONS[out[last].replace('-', '')];
  if (out.length >= 3 && direction) out[last] = direction;

  const hasDirection = out.length >= 3 && DIRECTION_CODES.has(out[last]);
  const typeIndex = hasDirection ? last - 1 : last;
  if (typeIndex >= 1 && STREET_TYPES[out[typeIndex]]) out[typeIndex] = STREET_TYPES[out[typeIndex]];
  return out;
}

/** One street line in Canada Post form: "Apt. 309, 11211 85 Street North-West" -> "309-11211 85 ST NW". */
export function normalizeStreetLine(value) {
  if (typeof value !== 'string') return value;
  let line = upperWithoutDots(value);
  if (!line) return '';

  const leading = line.match(LEADING_UNIT);
  const trailing = leading ? null : line.match(TRAILING_UNIT);
  if (leading) line = `${leading[1] ?? leading[2]}-${leading[3]} ${leading[4]}`;
  else if (trailing) line = `${trailing[3]}-${trailing[1]} ${trailing[2]}`;

  return abbreviateEnding(normalizeAddressText(line).split(' ')).join(' ');
}

/**
 * The address block as Canada Post prints it, one string per line:
 * recipient, line 2, street, "CITY PR  A1A 1A1" (two spaces before the
 * postal code), then the country. The country line is printed for a
 * non-Canadian address, and for a Canadian one only with `international`.
 * Returns [] when there is no address to print. Render the lines with
 * `white-space: pre` so the two spaces survive.
 */
export function formatMailingAddress(address, { recipient, international = false } = {}) {
  if (!address) return [];
  const canadian = isCanadianCountry(address.country);
  const text = (value) => normalizeAddressText(String(value ?? ''));

  const streetLines = String(address.address ?? '')
    .split(/\r?\n/)
    .map(canadian ? normalizeStreetLine : normalizeAddressText)
    .filter(Boolean);
  const place = [text(address.city), text(address.state)].filter(Boolean).join(' ');
  const postal = canadian ? formatCanadianPostalCode(String(address.postalCode ?? '')) : text(address.postalCode);
  const lastLine = [place, postal].filter(Boolean).join('  ');

  const body = [text(address.addressLine2), ...streetLines, lastLine].filter(Boolean);
  if (!body.length) return [];

  const countryLine = canadian ? (international ? CANADA_LINE : '') : text(address.country);
  return [text(recipient), ...body, countryLine].filter(Boolean);
}

export default { CANADA_SPELLINGS, isCanadianCountry, normalizeAddressText, normalizeStreetLine, formatMailingAddress };
