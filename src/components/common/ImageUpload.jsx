import { useId, useRef, useState } from 'react';
import Label from './Label';
import FormError from './FormError';
import IconButton from './IconButton';
import ProgressBar from './ProgressBar';
import { IMAGE_MIME_TYPES } from '../../utils/file';

/**
 * Image picker with thumbnail previews - used for assignment photos and
 * screenshots that feed OCR.
 *
 * Preview URLs are created and revoked by useFileUpload; this component just
 * displays them.
 */
export function ImageUpload({
  name = 'image',
  label,
  hint,
  error,
  previews = [],
  files = [],
  onSelect,
  onRemove,
  multiple = false,
  disabled = false,
  required = false,
  progress = 0,
  isUploading = false,
  className = '',
}) {
  const generatedId = useId();
  const inputId = `${name}-${generatedId}`;
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => !disabled && inputRef.current?.click();

  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className={`ui-field ${className}`.trim()}>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}

      <div
        className={[
          'ui-dropzone',
          isDragging ? 'ui-dropzone--active' : '',
          disabled ? 'ui-dropzone--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) onSelect?.(Array.from(e.dataTransfer.files));
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      >
        <span aria-hidden="true" style={{ fontSize: 24 }}>
          🖼
        </span>
        <span className="ui-dropzone__title">
          Add {multiple ? 'photos' : 'a photo'} of the assignment
        </span>
        <span className="ui-hint">JPG, PNG, WEBP or HEIC</span>

        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={IMAGE_MIME_TYPES.join(',')}
          multiple={multiple}
          disabled={disabled}
          required={required}
          className="ui-sr-only"
          onChange={(e) => onSelect?.(e)}
        />
      </div>

      {isUploading && (
        <ProgressBar value={progress} label="Uploading" className="ui-field" showValue />
      )}

      {previews.length > 0 && (
        <div className="ui-imagegrid">
          {previews.map((src, index) => (
            <div key={src} className="ui-imagegrid__item">
              <img src={src} alt={files[index]?.name ?? `Selected image ${index + 1}`} />
              {onRemove && (
                <IconButton
                  className="ui-imagegrid__remove"
                  size="sm"
                  variant="danger"
                  icon={<span aria-hidden="true">✕</span>}
                  label={`Remove image ${index + 1}`}
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {hint && !error && (
        <span id={hintId} className="ui-hint">
          {hint}
        </span>
      )}
      <FormError id={errorId}>{error}</FormError>
    </div>
  );
}

export default ImageUpload;
