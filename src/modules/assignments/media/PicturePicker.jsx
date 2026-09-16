import { lazy, Suspense, useState } from 'react';
import { LuFilm, LuImagePlus, LuSmile, LuSticker, LuTrash2 } from 'react-icons/lu';
import { Button, Input, Loader, Modal, UploadButton } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { IMAGE_ACCEPT } from '../../../utils/file';
import assignmentService from '../services/assignment.service';
import { gifPickerConfigured, gifProviderName } from './gifProviders';
import QuestionPicture from './QuestionPicture';

// Loaded on first open, so the emoji data and GIF picker stay out of the main bundle.
const EmojiPickerPanel = lazy(() => import('./EmojiPickerPanel'));
const GifPickerPanel = lazy(() => import('./GifPickerPanel'));

const PICKER_TITLES = { emoji: 'Pick an emoji', gif: 'Pick a GIF', sticker: 'Pick a sticker' };

/**
 * Chooses a question's picture: upload a photo, or pick an emoji (Emoji Mart),
 * a GIF or a sticker (gif-picker-react).
 *
 * value / onChange: null, or { source: 'upload'|'emoji'|'gif'|'sticker',
 * fileId?, emoji?, url?, alt } - `url` on an upload is only for the preview.
 */
export default function PicturePicker({ value, onChange, disabled = false, error }) {
  const [picker, setPicker] = useState(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file) => {
    setUploading(true);
    try {
      const { data } = await assignmentService.uploadTaskMedia(file, 'image');
      onChange({ source: 'upload', fileId: data.id, url: data.url, alt: value?.alt ?? '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const choose = (next) => {
    onChange(next);
    setPicker(null);
  };

  const gifHint = gifPickerConfigured ? undefined : 'GIFs and stickers need a GIF API key (VITE_GIF_API_KEY).';

  return (
    <div className="ui-field">
      <span className="ui-label">Picture (optional)</span>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {value ? (
          <QuestionPicture image={value} size="md" />
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: 160,
              height: 160,
              maxWidth: '100%',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--color-border-default)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--color-text-tertiary)',
            }}
          >
            <LuImagePlus size={36} />
          </div>
        )}

        <div style={{ display: 'grid', gap: 'var(--spacing-xs)', flex: '1 1 14rem' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
            <UploadButton accept={IMAGE_ACCEPT} onFile={upload} loading={uploading} disabled={disabled} size="sm" startIcon={<LuImagePlus />}>
              Upload image
            </UploadButton>
            <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => setPicker('emoji')} startIcon={<LuSmile />}>
              Emoji
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={disabled || !gifPickerConfigured} onClick={() => setPicker('gif')} startIcon={<LuFilm />} title={gifHint}>
              GIF
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={disabled || !gifPickerConfigured} onClick={() => setPicker('sticker')} startIcon={<LuSticker />} title={gifHint}>
              Sticker
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => onChange(null)} startIcon={<LuTrash2 />}>
                Remove
              </Button>
            )}
          </div>
          {gifHint && <span className="ui-hint">{gifHint}</span>}
          {value && (
            <Input
              label="Picture description"
              hint="Read aloud to students using a screen reader."
              value={value.alt ?? ''}
              maxLength={255}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              reserveHelper={false}
            />
          )}
          {error && (
            <span className="ui-hint" role="alert" style={{ color: 'var(--color-danger-fg)' }}>
              {error}
            </span>
          )}
        </div>
      </div>

      <Modal isOpen={Boolean(picker)} onClose={() => setPicker(null)} title={picker ? PICKER_TITLES[picker] : ''} size="md">
        <Suspense fallback={<Loader message="Opening picker…" />}>
          {picker === 'emoji' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <EmojiPickerPanel onSelect={({ emoji, name }) => choose({ source: 'emoji', emoji, alt: name })} />
            </div>
          )}
          {(picker === 'gif' || picker === 'sticker') && (
            <>
              <GifPickerPanel kind={picker} onSelect={({ url, description }) => choose({ source: picker, url, alt: description })} />
              <p className="ui-hint" style={{ marginBottom: 0 }}>
                Powered by {gifProviderName}. Only content rated for all ages is shown.
              </p>
            </>
          )}
        </Suspense>
      </Modal>
    </div>
  );
}
