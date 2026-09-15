import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Alert, Loader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import regulationToolkitService from '../services/regulationToolkit.service';

/**
 * "Tools to help you feel calmer and readier to focus" - a category picker
 * (Breathing/Grounding/Movement/Sound/Mindfulness) plus a detail card for
 * whichever tool is selected, with an opening suggestion pulled from the
 * student's own check-in.
 *
 * The recommendation reads mood/availableMinutes from `checkIn` (today's
 * check-in, already known client-side via useDailyCheckIn) rather than a
 * persisted server-side check-in row - there is no check-in backend yet,
 * see services/regulationToolkit.service.js on the backend for why the
 * recommendation endpoint takes them as query params instead.
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

function toolsForTile(categories, tile) {
  const wanted = tile.sourceCategories ?? [tile.key];
  return categories.filter((c) => wanted.includes(c.category)).flatMap((c) => c.tools);
}

export function RegulationToolkitCard({ checkIn }) {
  const { data: categories, isLoading, error } = useApi(regulationToolkitService.listCategories, { immediate: true });
  const recommendation = useApi(regulationToolkitService.getRecommendation);

  const [activeTile, setActiveTile] = useState('Breathing');
  const [toolIndex, setToolIndex] = useState(0);

  // Ask for a suggestion once the check-in mood is known, and land on it.
  useEffect(() => {
    if (!checkIn?.mood) return;
    recommendation
      .run({ mood: checkIn.mood, availableMinutes: checkIn.availableMinutes })
      .then((res) => {
        const tool = res?.data?.tool;
        if (!tool) return;
        const tile = CATEGORY_TILES.find((t) => (t.sourceCategories ?? [t.key]).includes(tool.category));
        if (tile) setActiveTile(tile.key);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn?.mood]);

  const tileTools = useMemo(() => {
    const tile = CATEGORY_TILES.find((t) => t.key === activeTile);
    return tile && categories ? toolsForTile(categories, tile) : [];
  }, [categories, activeTile]);

  const selectedTool = tileTools[toolIndex] ?? tileTools[0] ?? null;
  const suggestedTool = recommendation.data?.tool;

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

      {suggestedTool && (
        <Alert variant="info" className="ui-field">
          You checked in feeling {checkIn.mood}
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
              return (
                <button
                  key={tile.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveTile(tile.key);
                    setToolIndex(0);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: 'var(--spacing-md) var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${active ? 'var(--accent-base, var(--color-primary))' : 'var(--color-border)'}`,
                    background: active ? 'var(--accent-soft, var(--color-primary-soft))' : 'var(--color-surface)',
                    cursor: 'pointer',
                    minHeight: 48,
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: 22 }}>
                    {tile.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      color: active ? 'var(--accent-base, var(--color-primary))' : 'var(--color-text-primary)',
                    }}
                  >
                    {tile.label}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedTool ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--spacing-lg)',
                padding: 'var(--spacing-lg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface)',
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
                      variant="link"
                      onClick={() => setToolIndex((i) => (i + 1) % tileTools.length)}
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
                  background: 'var(--color-surface-alt)',
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
        </>
      )}
    </Card>
  );
}

export default RegulationToolkitCard;
