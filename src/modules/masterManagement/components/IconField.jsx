import { lazy, Suspense, useEffect, useState } from 'react';
import { LuSmile } from 'react-icons/lu';
import { Button, Input, Label, Loader, Modal, Tabs, ImageUpload } from '../../../components/common';
import usePhotoField from '../../../hooks/usePhotoField';

// Loaded on first open, same as PicturePicker's question-picture emoji tab -
// the emoji data set is a few hundred KB, kept out of the main bundle.
const EmojiPickerPanel = lazy(() => import('../../assignments/media/EmojiPickerPanel'));

/**
 * The base "Icon" field every master-item form shares (Subjects, Emotional
 * States, ...): an emoji/short text icon, or an uploaded image - mutually
 * exclusive, so switching tabs switches which one wins on save.
 *
 * `text` stays a plain useForm field owned by the caller (MasterFormPage);
 * this component only owns the upload-picker's own local state (mode,
 * selected file, "remove the existing upload" flag) and reports it up via
 * `onStateChange`, the same "keep it beside the form, not inside it" split
 * ThemeFormPage/StickyNoteStyleFormPage use for their colour config.
 *
 * Give this a `key` (e.g. the record's id) when the caller may swap which
 * record it's editing without a full remount, so mode/upload state resets.
 */
export function IconField({
  label = 'Icon',
  hint = 'Type an emoji, or upload an image - not both.',
  textValue = '',
  onTextChange,
  iconUrl = null,
  onStateChange,
  error,
}) {
  const [mode, setMode] = useState(iconUrl ? 'upload' : 'text');
  const [removed, setRemoved] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const photo = usePhotoField(removed ? null : iconUrl);

  const report = (next) => onStateChange?.({ mode, file: photo.file, removed, ...next });

  // The parent (MasterFormPage) starts out assuming "untouched, text mode" -
  // sync it to this field's real initial mode (e.g. "upload" when the record
  // already has an uploaded icon) so an untouched save doesn't misreport
  // itself as a switch to text mode and wipe the existing upload.
  useEffect(() => {
    report({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    report({ mode: nextMode });
  };

  const handleSelect = (eventOrFiles) => {
    const file = Array.isArray(eventOrFiles) ? eventOrFiles[0] : eventOrFiles?.target?.files?.[0];
    if (!file) return;
    photo.onSelect(file);
    setRemoved(false);
    report({ file, removed: false });
  };

  const handleRemove = () => {
    photo.onRemove();
    setRemoved(true);
    report({ file: null, removed: true });
  };

  return (
    <div className="ui-field">
      <Label>{label}</Label>
      <Tabs
        activeKey={mode}
        onChange={handleModeChange}
        items={[
          {
            key: 'text',
            label: 'Type an icon',
            content: (
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    aria-label={label}
                    placeholder="e.g. 😊"
                    value={textValue}
                    onChange={(e) => onTextChange?.(e.target.value)}
                    error={mode === 'text' ? error : undefined}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  startIcon={<LuSmile aria-hidden="true" />}
                  onClick={() => setPickerOpen(true)}
                >
                  Pick emoji
                </Button>
              </div>
            ),
          },
          {
            key: 'upload',
            label: 'Upload image',
            content: (
              <ImageUpload
                name="icon-image"
                dropzoneLabel="Add an icon image"
                hint="JPG, PNG or WEBP"
                previews={photo.previewUrl ? [photo.previewUrl] : []}
                files={photo.file ? [photo.file] : []}
                error={photo.error}
                onSelect={handleSelect}
                onRemove={handleRemove}
              />
            ),
          },
        ]}
      />
      {hint && <span className="ui-hint">{hint}</span>}

      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} title="Pick an emoji" size="md">
        <Suspense fallback={<Loader message="Opening picker…" />}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <EmojiPickerPanel
              onSelect={({ emoji }) => {
                onTextChange?.(emoji);
                setPickerOpen(false);
              }}
            />
          </div>
        </Suspense>
      </Modal>
    </div>
  );
}

export default IconField;
