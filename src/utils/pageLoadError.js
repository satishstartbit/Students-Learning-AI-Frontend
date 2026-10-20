/**
 * A page's code that failed to download (a lazily loaded route chunk), as
 * opposed to a page that crashed while drawing. Happens on a dropped
 * connection, or after a new release replaced the files the open tab expects.
 *
 * React.lazy keeps the failed download, so re-rendering - or going to the
 * same address inside the app - fails again the same way: only a real page
 * load fetches it again (pages/status/ServerErrorPage.jsx, QA 2026-10-16).
 *
 * Messages: Chrome/Edge, Firefox, Safari, Vite's preload helper, webpack-style.
 */
const PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Unable to preload CSS/i,
  /Loading (CSS )?chunk [\w-]+ failed/i,
];

export function isPageLoadError(error) {
  if (!error) return false;
  if (error.name === 'ChunkLoadError') return true;
  const message = String(error.message ?? error);
  return PATTERNS.some((p) => p.test(message));
}

export default isPageLoadError;
