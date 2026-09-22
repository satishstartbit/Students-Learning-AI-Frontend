import { Link } from 'react-router-dom';
import { LuCheck, LuTriangleAlert } from 'react-icons/lu';
import { Button } from '../../../../components/common';

/**
 * One checklist line. state: 'done' | 'todo' | 'warn'. `edited` marks a
 * group the teacher has changed since the last save (Edit mode).
 */
function CheckItem({ label, state, edited }) {
  return (
    <li className={`af-check af-check--${state}`}>
      <span className="af-check__icon" aria-hidden="true">
        {state === 'done' && <LuCheck size={12} strokeWidth={3} />}
        {state === 'warn' && <LuTriangleAlert size={14} />}
      </span>
      <span>
        {label}
        <span className="ui-sr-only">{state === 'done' ? ' - done' : state === 'warn' ? ' - needed' : ' - not done yet'}</span>
      </span>
      {edited && <span className="af-chip af-chip--accent af-check__edited">Edited</span>}
    </li>
  );
}

/**
 * The right-hand panel.
 *
 * Draft (new, or editing a draft): "Ready to publish?" - a checklist of what
 * the assignment has, Publish (needs at least one student), Save as draft
 * and Cancel, plus the autosave status underneath.
 *
 * Published: "Changes" - the same checklist with each changed group marked
 * "Edited", Save changes, Unpublish (only while nobody has started) and
 * Cancel. Published work never autosaves - students would see half-typed
 * edits - so it's always an explicit Save changes.
 */
export default function PublishPanel({
  mode,
  items,
  canPublish,
  busy,
  disabled,
  cancelTo,
  onPublish,
  onSaveDraft,
  onSaveChanges,
  onUnpublish,
  canUnpublish,
  hasChanges,
  saveState,
}) {
  const published = mode === 'published';

  return (
    <aside className="af-panel-wrap" aria-label={published ? 'Changes' : 'Ready to publish?'}>
      <div className="af-panel">
        <h2 className="af-panel__title">{published ? 'Changes' : 'Ready to publish?'}</h2>

        <ul className="af-checklist">
          {items.map((item) => (
            <CheckItem key={item.key} label={item.label} state={item.state} edited={published && item.edited} />
          ))}
        </ul>

        {published ? (
          <>
            <div className="af-panel__actions">
              <Button onClick={onSaveChanges} loading={busy === 'save'} disabled={disabled || Boolean(busy) || !hasChanges}>
                Save changes
              </Button>
              {canUnpublish && (
                <Button variant="secondary" onClick={onUnpublish} loading={busy === 'unpublish'} disabled={disabled || Boolean(busy)}>
                  Unpublish
                </Button>
              )}
              <Button variant="ghost" as={Link} to={cancelTo}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="af-panel__note">
              {canPublish
                ? 'Everything students need is here. Publish when you’re ready.'
                : 'Pick at least one student to publish. You can save a draft any time.'}
            </p>
            <div className="af-panel__actions">
              <Button onClick={onPublish} loading={busy === 'publish'} disabled={disabled || Boolean(busy) || !canPublish}>
                Publish
              </Button>
              <Button variant="secondary" onClick={onSaveDraft} loading={busy === 'draft'} disabled={disabled || Boolean(busy)}>
                Save as draft
              </Button>
              <Button variant="ghost" as={Link} to={cancelTo}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>

      <p className={`af-panel__foot ${saveState?.tone === 'error' ? 'af-save-state--error' : ''}`.trim()} role="status" aria-live="polite">
        {published
          ? canUnpublish
            ? 'Students see changes the next time they open it.'
            : 'Students see changes the next time they open it. It can’t be unpublished now that a student has started.'
          : (saveState?.text ?? 'Drafts save automatically as you type.')}
      </p>
    </aside>
  );
}
