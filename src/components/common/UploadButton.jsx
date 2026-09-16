import { useRef } from 'react';
import Button from './Button';

/**
 * A button that opens the file chooser and hands back one file - for
 * "upload this now" actions (a question picture, an audio track) where the
 * full FileUpload drop zone would be too much. The input resets after each
 * pick so choosing the same file again still fires.
 */
export function UploadButton({ accept, onFile, children, loading = false, disabled = false, variant = 'secondary', size = 'md', ...rest }) {
  const inputRef = useRef(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onFile?.(file);
        }}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        loading={loading}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        {...rest}
      >
        {children}
      </Button>
    </>
  );
}

export default UploadButton;
