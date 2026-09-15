import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Alert, Loader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useTodayCheckIn } from '../../checkIn/hooks/useTodayCheckIn';
import { findMood } from '../../checkIn/moods';
import regulationToolkitService from '../services/regulationToolkit.service';

/**
 * "Tools to help you feel calmer and readier to focus" - a category picker
 * (Breathing/Grounding/Movement/Sound/Mindfulness) plus a detail card for
 * whichever tool is selected.
 *
 * Reacts to today's check-in: the backend maps the student's stored mood to
 * tool categories (services/regulationToolkit.service.js#MOOD_CATEGORIES),
 * those tiles are marked "Suggested" and the top suggestion opens first.
 * Every tile stays selectable, and the student can skip straight to work.
 */

// "Calming Sounds" and "Music" (the seeded categories) both read as "Sound"
// in the reference design - shown as one tab, tools from both pooled.
const CATEGORY_TILES = [
  { key: 'Breathing', label: 'Breathing', icon: '🫁' },
  { key: 'Grounding', label: 'Grounding', icon: '🌳' },
  { key: 'Movement', label: 'Movement', icon: '🤸' },
  { key: 'Sound', label: 'Sound', icon: '🎧', sourceCategories: ['Calming Sounds', 'Music'] },
  { key: 'Mindfulness', label: 'Mindfulness', icon: '🧘' },
];

const tileCategories = (tile) => tile.sourceCategories ?? [tile.key];

function toolsForTile(categories, tile) {
  const wanted = tileCategories(tile);
  return categories.filter((c) => wanted.includes(c.category)).flatMap((c) => c.tools);
}

export function RegulationToolkitCard() {
  const { checkIn } = useTodayCheckIn();
  const { data: categories, isLoading, error } = useApi(regulationToolkitService.listCategories, { immediate: true });
  const recommendation = useApi(regulationToolkitService.getRecommendation);
  const { run: runRecommendation } = recommendation;

  // null = "follow the suggestion"; set once the student picks for themselves.
  const [pickedTile, setPickedTile] = useState(null);
  const [toolIndex, setToolIndex] = useState(null);

  useEffect(() => {
    if (checkIn) runRecommendation().catch(() => {});
  }, [checkIn, runRecommendation]);

  const suggestedCategories = recommendation.data?.categories ?? [];
  const suggestedTool = recommendation.data?.tool ?? null;
  const suggestedTile = suggestedTool
    ? CATEGORY_TILES.find((t) => tileCategories(t).includes(suggestedTool.category))
    : null;

  const activeTile = pickedTile ?? suggestedTile?.key ?? 'Breathing';

  const tileTools = useMemo(() => {
    const tile = CATEGORY_TILES.find((t) => t.key === activeTile);
    return tile && categories ? toolsForTile(categories, tile) : [];
  }, [categories, activeTile]);

  const defaultIndex = Math.max(
    0,
    tileTools.findIndex((t) => t.id === suggestedTool?.id)
  );
  const selectedTool = tileTools[toolIndex ?? defaultIndex] ?? tileTools[0] ?? null;

  const mood = findMood(checkIn?.mood);

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
          You checked in feeling {mood.label.toLowerCase()}
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
            {CATEGORY_TILES.map((tile) => {
              const active = tile.key === activeTile;
              const suggested = tileCategories(tile).some((c) => suggestedCategories.includes(c));
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
                <h3 style={{ margin: '0 0 4px', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
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
