import { useEffect, useState } from 'react';
import { getSafetyContent } from '../../services/content.service';

/**
 * The admin's safety help lines and onboarding notices (GET /content/safety),
 * fetched once per session and shared by every screen that shows them.
 * Returns null until loaded (and stays null if it can't be loaded - screens
 * then simply leave the card out).
 */
let cached = null;
let pending = null;

function load() {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = getSafetyContent()
      .then((res) => {
        cached = res.data ?? null;
        return cached;
      })
      .catch(() => null)
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function useSafetyContent() {
  const [content, setContent] = useState(cached);
  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    load().then((value) => {
      if (alive && value) setContent(value);
    });
    return () => {
      alive = false;
    };
  }, []);
  return content;
}

/** Tests only. */
export function resetSafetyContentCache() {
  cached = null;
  pending = null;
}
