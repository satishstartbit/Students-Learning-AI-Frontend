import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Alert, Loader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useTodayCheckIn } from '../../checkIn/hooks/useTodayCheckIn';
import { findMood } from '../../checkIn/moods';
import regulationToolkitService from '../services/regulationToolkit.service';

/**
 * "Tools to help you feel calmer and readier to focus" - a category picker
 * plus a detail card for whichever tool is selected.
 *
 * The category tabs are derived entirely from GET /regulation-toolkit (Master
 * Management > Regulation Activities) rather than a fixed list - a category
 * an admin adds shows up as its own tab automatically, using that category's
 * first tool's own `icon` (also admin-set, and otherwise unused until now) as
 * the tab icon, with a generic fallback when none of a category's tools has
 * one set.
 *
 * Reacts to today's check-in: the backend maps the student's stored mood to
 * tool categories (services/regulationToolkit.service.js#MOOD_CATEGORIES),
 * those tiles are marked "Suggested" and the top suggestion opens first.
 * Every tile stays selectable, and the student can skip straight to work.
 */
const DEFAULT_TILE_ICON = '✨';

export function RegulationToolkitCard() {
  const { checkIn, moods } = useTodayCheckIn();
  const { data: categories, isLoading, error } = useApi(regulationToolkitService.listCategories, { immediate: true });
  const recommendation = useApi(regulationToolkitService.getRecommendation);
  const { run: runRecommendation } = recommendation;

  // null = "follow the suggestion"; set once the student picks for themselves.
  const [pickedTile, setPickedTile] = useState(null);
  const [toolIndex, setToolIndex] = useState(null);

  useEffect(() => {
    if (checkIn) runRecommendation().catch(() => {});
  }, [checkIn, runRecommendation]);

  const tiles = useMemo(
    () =>
      (categories ?? []).map((c) => ({
        key: c.category,
        label: c.category,
        icon: c.tools.find((t) => t.icon)?.icon ?? DEFAULT_TILE_ICON,
      })),
    [categories]
  );

  const suggestedCategories = recommendation.data?.categories ?? [];
  const suggestedTool = recommendation.data?.tool ?? null;
  const suggestedTile = suggestedTool ? tiles.find((t) => t.key === suggestedTool.category) : null;

  const activeTile = pickedTile ?? suggestedTile?.key ?? tiles[0]?.key ?? null;

  const tileTools = useMemo(
    () => categories?.find((c) => c.category === activeTile)?.tools ?? [],
    [categories, activeTile]
  );

  const defaultIndex = Math.max(
    0,
    tileTools.findIndex((t) => t.id === suggestedTool?.id)
  );
  const selectedTool = tileTools[toolIndex ?? defaultIndex] ?? tileTools[0] ?? null;

  const mood = findMood(moods, checkIn?.mood);

  return (
    <Card
      title="Regulation Toolkit"
      subtitle="Tools to help you feel calmer and readier to focus."
      className="ui-field"
    >
      {error && (
        <Alert variant="error" className="ui-field">
          Couldn&apos;t load the toolkit right now.
        </Alert>
      )}

      {suggestedTool && mood && (
        <Alert variant="info" className="ui-field">
          You checked in feeling {mood.name.toLowerCase()}
          {checkIn.availableMinutes ? ` with ${checkIn.availableMinutes} minutes free` : ''} —{' '}
          <strong>{suggestedTool.name}</strong> is a good place to start.
        </Alert>
      )}

      {isLoading ? (
        <Loader message="Loading tools…" />
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Tool category"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            {tiles.map((tile) => {
              const active = tile.key === activeTile;
              const suggested = suggestedCategories.includes(tile.key);
              return (
                <button
                  key={tile.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-describedby={suggested ? 'toolkit-suggested-hint' : undefined}
                  onClick={() => {
                    setPickedTile(tile.key);
                    setToolIndex(0);
                  }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: 'var(--spacing-md) var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${active ? 'var(--accent-base)' : 'var(--color-border-default)'}`,
                    background: active ? 'var(--accent-soft)' : 'var(--color-bg-surface)',
                    cursor: 'pointer',
                    minHeight: 48,
                  }}
                >
                  {suggested && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -9,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '1px 8px',
                        borderRadius: 999,
                        background: 'var(--accent-base)',
                        color: 'var(--accent-on)',
                      }}
                    >
                      Suggested
                    </span>
                  )}
                  <span aria-hidden="true" style={{ fontSize: 22 }}>
                    {tile.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      color: active ? 'var(--accent-base)' : 'var(--color-text-primary)',
                    }}
                  >
                    {tile.label}
                  </span>
                </button>
              );
            })}
          </div>
          {suggestedCategories.length > 0 && (
            <p id="toolkit-suggested-hint" className="ui-hint" style={{ marginTop: 'calc(var(--spacing-md) * -1)' }}>
              Suggested from today&apos;s check-in - pick any tool you like.
            </p>
          )}

          {selectedTool ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--spacing-lg)',
                padding: 'var(--spacing-lg)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-bg-surface)',
              }}
            >
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <h3 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
                  {selectedTool.icon && <span aria-hidden="true">{selectedTool.icon}</span>}
                  {selectedTool.name}
                </h3>
                <p style={{ margin: '0 0 var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
                  {selectedTool.description}
                </p>
                <p className="ui-hint" style={{ marginBottom: 'var(--spacing-md)' }}>
                  🕐 {selectedTool.durationMinutes} {selectedTool.durationMinutes === 1 ? 'minute' : 'minutes'}
                </p>

                <Button size="sm" endIcon={<span aria-hidden="true">→</span>}>
                  Start exercise
                </Button>

                {tileTools.length > 1 && (
                  <div style={{ marginTop: 'var(--spacing-md)' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToolIndex(((toolIndex ?? defaultIndex) + 1) % tileTools.length)}
                    >
                      Try a different {activeTile.toLowerCase()} exercise ›
                    </Button>
                  </div>
                )}
              </div>

              <div
                aria-hidden="true"
                style={{
                  flex: '0 0 160px',
                  minHeight: 120,
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-border-strong)',
                  background: 'var(--color-bg-surface-sunken)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-tertiary)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Illustration
              </div>
            </div>
          ) : (
            <p className="ui-hint">No tools in this category yet.</p>
          )}

          <p style={{ margin: 'var(--spacing-md) 0 0' }}>
            <Link to="/student/assignments">Skip - go straight to my work →</Link>
          </p>
        </>
      )}
    </Card>
  );
}

export default RegulationToolkitCard;
