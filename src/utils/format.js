/**
 * Display formatting helpers. Presentation only - no business rules.
 */
import { getActiveLocale, DEFAULT_CURRENCY } from './locale';

/**
 * Not Canada-only: `currency` defaults to the app's configured default (CAD)
 * rather than being hardcoded, so a future non-Canadian plan is a config
 * change, not a code change. Locale defaults to the active user's own.
 */
export function formatCurrency(amount, currency = DEFAULT_CURRENCY, options = {}) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat(getActiveLocale(), {
    style: 'currency',
    currency,
    ...options,
  }).format(value);
}

export function formatNumber(value, options = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat(getActiveLocale(), options).format(n);
}

/** 0.42 -> "42%"; pass isRatio=false for an already-scaled 42. */
export function formatPercentage(value, { isRatio = true, decimals = 0 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat(getActiveLocale(), {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(isRatio ? n : n / 100);
}

export function formatPoints(points) {
  const n = Number(points);
  if (!Number.isFinite(n)) return '';
  return `${formatNumber(n)} ${Math.abs(n) === 1 ? 'point' : 'points'}`;
}

/** snake_case / kebab-case -> "Title Case" */
export function titleCase(value) {
  if (!value) return '';
  return String(value)
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Turns a status value into a readable label: "in_progress" -> "In Progress" */
export const formatStatus = (status) => titleCase(status);

export function formatName(user, { fallback = 'Unknown' } = {}) {
  if (!user) return fallback;
  const parts = [user.firstName ?? user.first_name, user.lastName ?? user.last_name]
    .filter(Boolean)
    .map((p) => String(p).trim());
  return parts.length ? parts.join(' ') : (user.email ?? fallback);
}

/** "Ada Lovelace" -> "AL" */
export function getInitials(nameOrUser, { max = 2 } = {}) {
  const name = typeof nameOrUser === 'string' ? nameOrUser : formatName(nameOrUser, { fallback: '' });
  if (!name) return '';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/** Shortens a full name for display: "Ada Lovelace" -> "Ada L." */
export function formatShortName(user) {
  const first = user?.firstName ?? user?.first_name;
  const last = user?.lastName ?? user?.last_name;
  if (!first) return formatName(user);
  return last ? `${first} ${String(last)[0].toUpperCase()}.` : String(first);
}

export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return '';
  if (n === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  const value = n / 1024 ** i;
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function truncate(value, maxLength = 100, suffix = '…') {
  const s = String(value ?? '');
  return s.length <= maxLength ? s : s.slice(0, maxLength).trimEnd() + suffix;
}

export default {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatPoints,
  formatStatus,
  formatName,
  formatShortName,
  getInitials,
  formatFileSize,
  titleCase,
  truncate,
};
