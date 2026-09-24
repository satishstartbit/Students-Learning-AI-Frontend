import { useMemo } from 'react';
import { useApi } from '../../../hooks/useApi';
import lookupService from '../../../services/lookup.service';
import { describeMood } from '../moods';

/**
 * The Emotional States master, for the screens that show a check-in but are
 * not the student's own: Parent and Teacher Progress.
 *
 * Those pages only get a mood *code* from the progress API, and used to draw
 * it with the static fallback emoji in modules/checkIn/moods.js - so a mood
 * an admin gave its own icon showed one thing to the student and a different
 * thing to their parent. This reads the same live list the student's picker
 * reads (/lookups/emotional_states), so both see what Master Management
 * actually publishes.
 *
 * `moodFor(code)` always answers: the master row when there is one, the
 * built-in emoji and name when there isn't (a code from a mood that has
 * since been deleted still has to render).
 */
export function useMoodLookup() {
  const api = useApi(lookupService.listLookup, { immediate: true, args: ['emotional_states'] });

  const byCode = useMemo(() => {
    const map = new Map();
    (api.data ?? []).forEach((item) => {
      if (!item.code) return;
      map.set(item.code, {
        code: item.code,
        name: item.name,
        icon: item.icon ?? null,
        iconUrl: item.iconUrl ?? null,
        backgroundColor: item.extra?.background_color ?? null,
      });
    });
    return map;
  }, [api.data]);

  const moodFor = useMemo(
    () => (code) => {
      if (!code) return null;
      const row = byCode.get(code);
      if (row) return row;

      const fallback = describeMood(code);
      return { code, name: fallback.name, icon: fallback.emoji, iconUrl: null, backgroundColor: null };
    },
    [byCode]
  );

  return { moodFor, isLoading: api.isLoading && !api.data };
}

export default useMoodLookup;
