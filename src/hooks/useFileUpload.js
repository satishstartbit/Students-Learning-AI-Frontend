import { useCallback, useEffect, useRef, useState } from 'react';
import {
  validateFiles,
  createPreviewUrl,
  revokePreviewUrl,
  toFormData,
  IMAGE_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE,
} from '../utils/file';

/**
 * Selection, validation, preview and progress for assignment photo /
 * screenshot uploads.
 *
 * The upload request itself is injected (`uploadFn`) so this hook stays free
 * of API knowledge - pass a module service function.
 */
export function useFileUpload({
  multiple = false,
  maxFiles = 10,
  allowedMimeTypes = IMAGE_MIME_TYPES,
  maxBytes = DEFAULT_MAX_FILE_SIZE,
  uploadFn,
  fieldName = 'file',
} = {}) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const previewsRef = useRef([]);

  // Track the live previews so the unmount cleanup can revoke them.
  useEffect(() => {
    previewsRef.current = previews;
  });

  // Object URLs must be released or the tab leaks memory.
  useEffect(() => () => previewsRef.current.forEach(revokePreviewUrl), []);

  const select = useCallback(
    (input) => {
      const incoming = Array.from(input?.target?.files ?? input ?? []);
      if (!incoming.length) return;

      const { accepted, errors: rejected } = validateFiles(incoming, {
        allowedMimeTypes,
        maxBytes,
      });

      setErrors(rejected);

      const next = multiple ? [...files, ...accepted].slice(0, maxFiles) : accepted.slice(0, 1);

      previews.forEach(revokePreviewUrl);
      setPreviews(next.map(createPreviewUrl));
      setFiles(next);
    },
    [allowedMimeTypes, files, maxBytes, maxFiles, multiple, previews]
  );

  const removeAt = useCallback((index) => {
    setPreviews((prev) => {
      revokePreviewUrl(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => {
    previews.forEach(revokePreviewUrl);
    setPreviews([]);
    setFiles([]);
    setErrors([]);
    setProgress(0);
  }, [previews]);

  const upload = useCallback(
    async (extra = {}) => {
      if (!uploadFn) throw new Error('useFileUpload requires an uploadFn');
      if (!files.length) return undefined;

      setIsUploading(true);
      setProgress(0);

      try {
        const formData = toFormData(multiple ? files : files[0], { fieldName, extra });
        return await uploadFn(formData, { onProgress: setProgress });
      } finally {
        setIsUploading(false);
      }
    },
    [fieldName, files, multiple, uploadFn]
  );

  return {
    files,
    previews,
    errors,
    progress,
    isUploading,
    hasFiles: files.length > 0,
    select,
    removeAt,
    clear,
    upload,
  };
}

export default useFileUpload;
