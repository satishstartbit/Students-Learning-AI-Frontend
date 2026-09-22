import { useState } from 'react';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../utils/errorHandler';
import authService from '../auth/services/auth.service';

/**
 * The header card's Upload photo / Remove, which save immediately (separate
 * from the page's Save changes): PATCH /auth/me with just the photo file, or
 * with removePhoto. The server deletes the previous file either way.
 * `onChanged` re-reads the profile afterwards.
 */
export function useProfilePhoto({ onChanged } = {}) {
  const [busy, setBusy] = useState(null);

  const run = async (kind, request, success) => {
    setBusy(kind);
    try {
      await request();
      toast.success(success);
      await onChanged?.();
      window.dispatchEvent(new Event('profile:updated'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  // `profile: {}` keeps the multipart body non-empty for the API's "at least one field" rule.
  const upload = (file, validationError) => {
    if (!file) {
      toast.error(validationError || 'Choose a JPG, PNG, WEBP or HEIC image.');
      return;
    }
    run('upload', () => authService.updateMe({ profile: {}, photoFile: file }), 'Profile photo updated');
  };

  const remove = () => run('remove', () => authService.updateMe({ removePhoto: true }), 'Profile photo removed');

  return { busy, upload, remove };
}

export default useProfilePhoto;
