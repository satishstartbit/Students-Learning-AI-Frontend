import { useCallback, useEffect, useState } from 'react';
import { getLegalContent } from '../../services/content.service';

/**
 * The admin's Privacy Policy, Terms of Use and consent wording
 * (GET /content/legal, public), fetched once per session.
 * Returns { content, error, retry }: content is null until loaded.
 */
let cached = null;
let pending = null;

function load() {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = getLegalContent()
      .then((res) => {
        cached = res.data ?? null;
        return cached;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function useLegalContent() {
  const [content, setContent] = useState(cached);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    load()
      .then((value) => alive && setContent(value))
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { content, error, retry };
}

/** "{{child}}"-style placeholders in the admin's wording. */
export function fillPlaceholders(text, values) {
  return String(text ?? '').replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) => (values[name] != null ? values[name] : match));
}
