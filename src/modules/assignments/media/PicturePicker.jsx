import { lazy, Suspense, useRef, useState } from 'react';
import { LuFileImage, LuImagePlus, LuSmile, LuSparkles, LuTrash2, LuUpload } from 'react-icons/lu';
import { Button, Dropdown, Input, Loader, Modal } from '../../../components/common';
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
 *
 * Full size (a question's own picture): a small dashed square - or the
 * picture - beside "Picture (optional)" and the Upload / Emoji / GIF /
 * Sticker buttons.
 *
 * `compact` (a picture repeated in one question - an mcq option, a matching
 * pair side) renders inline pieces for the caller's flex row: the picture
 * (if any) and one icon button whose menu holds the four sources, plus a
 * full-width description field (.af-option__alt) that wraps onto its own
 * line. The picker dialog itself is the same either way.
 */
export default function PicturePicker({ value, onChange, disabled = false, error, compact = false }) {
  const [picker, setPicker] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const pickerDialog = (
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
  );

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={IMAGE_ACCEPT}
      hidden
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) upload(file);
      }}
    />
  );

  if (compact) {
    return (
      <>
        {fileInput}
        {value && <QuestionPicture image={value} size="chip" />}
        <Dropdown
          align="end"
          trigger={
            <button
              type="button"
              className="af-icon-btn"
              disabled={disabled || uploading}
              aria-label={value ? 'Change or remove picture' : 'Add a picture'}
              title={value ? 'Change picture' : 'Add a picture'}
            >
              <LuImagePlus size={18} aria-hidden="true" />
            </button>
          }
          items={[
            { key: 'upload', label: 'Upload image', icon: <LuUpload aria-hidden="true" />, onClick: () => fileInputRef.current?.click() },
            { key: 'emoji', label: 'Emoji', icon: <LuSmile aria-hidden="true" />, onClick: () => setPicker('emoji') },
            { key: 'gif', label: 'GIF', icon: <LuFileImage aria-hidden="true" />, onClick: () => setPicker('gif'), disabled: !gifPickerConfigured },
            { key: 'sticker', label: 'Sticker', icon: <LuSparkles aria-hidden="true" />, onClick: () => setPicker('sticker'), disabled: !gifPickerConfigured },
            ...(value ? [{ divider: true }, { key: 'remove', label: 'Remove picture', icon: <LuTrash2 aria-hidden="true" />, onClick: () => onChange(null), danger: true }] : []),
          ]}
        />
        {value && (
          <div className="af-option__alt">
            <Input
              aria-label="Picture description"
              placeholder="Picture description (read aloud by screen readers)"
              value={value.alt ?? ''}
              maxLength={255}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              reserveHelper={false}
              fieldClassName="ui-field--compact"
            />
          </div>
        )}
        {error && (
          <span className="af-error af-option__alt" role="alert">
            {error}
          </span>
        )}
        {pickerDialog}
      </>
    );
  }

  return (
    <div className="af-picture">
      {fileInput}
      {value ? (
        <QuestionPicture image={value} size="thumb" />
      ) : (
        <div className="af-picture__empty" aria-hidden="true">
          <LuImagePlus size={20} />
        </div>
      )}

      <div style={{ flex: '1 1 14rem', minWidth: 0 }}>
        <span className="af-picture__label">Picture (optional)</span>
        <div className="af-picture__buttons">
          <Button type="button" size="sm" variant="secondary" loading={uploading} disabled={disabled} onClick={() => fileInputRef.current?.click()} startIcon={<LuUpload />}>
            Upload
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => setPicker('emoji')} startIcon={<LuSmile />}>
            Emoji
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={disabled || !gifPickerConfigured} onClick={() => setPicker('gif')} startIcon={<LuFileImage />} title={gifHint}>
            GIF
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={disabled || !gifPickerConfigured} onClick={() => setPicker('sticker')} startIcon={<LuSparkles />} title={gifHint}>
            Sticker
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => onChange(null)} startIcon={<LuTrash2 />}>
              Remove
            </Button>
          )}
        </div>
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
          <span className="af-error" role="alert">
            {error}
          </span>
        )}
      </div>

      {pickerDialog}
    </div>
  );
}
