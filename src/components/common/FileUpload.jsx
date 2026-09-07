import { useId, useRef, useState } from 'react';
import Label from './Label';
import FormError from './FormError';
import IconButton from './IconButton';
import { formatFileSize } from '../../utils/format';
import { DOCUMENT_MIME_TYPES, IMAGE_MIME_TYPES } from '../../utils/file';

/**
 * Drag-and-drop file picker with a keyboard-accessible fallback.
 *
 * Selection state and validation live in useFileUpload - this component only
 * renders and reports. It performs no uploading itself.
 */
export function FileUpload({
  name = 'file',
  label,
  hint,
  error,
  files = [],
  onSelect,
  onRemove,
  accept = [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES].join(','),
  multiple = false,
  disabled = false,
  required = false,
  maxSizeLabel,
  className = '',
}) {
  const generatedId = useId();
  const inputId = `${name}-${generatedId}`;
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => !disabled && inputRef.current?.click();

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    onSelect?.(Array.from(event.dataTransfer.files));
  };

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
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      >
        <span aria-hidden="true" style={{ fontSize: 24 }}>
          📎
        </span>
        <span className="ui-dropzone__title">
          Drop {multiple ? 'files' : 'a file'} here, or click to browse
        </span>
        {maxSizeLabel && <span className="ui-hint">Up to {maxSizeLabel}</span>}

        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          required={required}
          className="ui-sr-only"
          onChange={(e) => onSelect?.(e)}
        />
      </div>

      {files.length > 0 && (
        <ul className="ui-filelist">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="ui-filelist__item">
              <span aria-hidden="true">📄</span>
              <span className="ui-filelist__name">{file.name}</span>
              <span className="ui-filelist__size">{formatFileSize(file.size)}</span>
              {onRemove && (
                <IconButton
                  size="sm"
                  variant="danger"
                  icon={<span aria-hidden="true">✕</span>}
                  label={`Remove ${file.name}`}
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                />
              )}
            </li>
          ))}
        </ul>
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

export default FileUpload;
