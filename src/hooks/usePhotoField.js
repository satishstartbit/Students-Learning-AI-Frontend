import { useEffect, useRef, useState } from 'react';
import { validateImage, createPreviewUrl, revokePreviewUrl } from '../utils/file';

/**
 * Local state for one profile-photo picker: the raw File plus an object-URL
 * preview, validated client-side before it ever reaches the form submit.
 *
 * Shared by the Parent and Super Admin "Add/Edit child" forms so both pick up
 * a profile photo the same way.
 *
 * `previewUrl` is computed, not stored: it is the freshly-picked file's object
 * URL when there is one, otherwise whatever `initialPreviewUrl` the caller
 * currently passes (an existing photo, once its detail record has loaded) -
 * so a prop that arrives after this hook is called still shows up with no
 * separate effect syncing it into state.
 *
 * @param initialPreviewUrl  an existing photo's URL, shown until the user
 *                           picks a replacement (used when editing a child).
 */
export function usePhotoField(initialPreviewUrl = null) {
  const [file, setFile] = useState(null);
  const [localUrl, setLocalUrl] = useState(null);
  const [error, setError] = useState(null);
  const objectUrlRef = useRef(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) revokePreviewUrl(objectUrlRef.current);
    },
    []
  );

  const onSelect = (selected) => {
    const { valid, error: validationError } = validateImage(selected);
    if (!valid) {
      setError(validationError);
      return;
    }

    if (objectUrlRef.current) revokePreviewUrl(objectUrlRef.current);
    const url = createPreviewUrl(selected);
    objectUrlRef.current = url;

    setFile(selected);
    setLocalUrl(url);
    setError(null);
  };

  const onRemove = () => {
    if (objectUrlRef.current) revokePreviewUrl(objectUrlRef.current);
    objectUrlRef.current = null;
    setFile(null);
    setLocalUrl(null);
    setError(null);
  };

  const reset = () => {
    if (objectUrlRef.current) revokePreviewUrl(objectUrlRef.current);
    objectUrlRef.current = null;
    setFile(null);
    setLocalUrl(null);
    setError(null);
  };

  return { file, previewUrl: localUrl ?? initialPreviewUrl, error, onSelect, onRemove, reset };
}

export default usePhotoField;
