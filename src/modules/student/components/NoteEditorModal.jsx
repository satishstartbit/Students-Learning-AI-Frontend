import { useState } from 'react';
import { Modal, Input, Textarea, Button, StickyNoteColorPicker } from '../../../components/common';

/**
 * Add/edit dialog for one "My Notes" sticky note (StudentHomePage.jsx).
 * Create when `note` is null, edit in place otherwise.
 */
export function NoteEditorModal({ isOpen, note, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tone, setTone] = useState('yellow');
  const [saving, setSaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Reset the form to whichever note (or blank, for "add") each time the
  // dialog opens - adjusted during render, not in an effect, so it lands
  // before this paint instead of one render late.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setTitle(note?.title ?? '');
      setContent(note?.text ?? '');
      setTone(note?.tone ?? 'yellow');
    }
  }

  const handleSave = async (event) => {
    event.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), content: content.trim(), tone });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={note ? 'Edit note' : 'Add a note'} size="sm">
      <form onSubmit={handleSave}>
        <Input label="Title" hint="Optional" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea
          label="Note"
          required
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <StickyNoteColorPicker value={tone} onChange={setTone} />

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
          <div>
            {note && onDelete && (
              <Button type="button" variant="danger" size="sm" onClick={() => onDelete(note)}>
                Delete
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving} disabled={!content.trim()}>
              {note ? 'Save' : 'Add note'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default NoteEditorModal;
