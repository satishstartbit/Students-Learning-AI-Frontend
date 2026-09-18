import { useState } from 'react';
import { cn } from '../../../../lib/utils';
import { useStudentSettings } from '../../hooks/useStudentSettings';
import { AvatarPicture } from '../personalize/AvatarPicture';
import { BearFace } from './Bear';

const SIZES = {
  sm: 'size-11',
  md: 'size-14',
  lg: 'size-20',
};

const PIXELS = { sm: 44, md: 56, lg: 80 };

/**
 * The buddy the student picked on "Make it yours", else their photo, else
 * the bear (also when a photo fails to load - profile photo URLs are
 * short-lived signed links). Decorative: the student's name is always shown
 * beside it.
 */
export function KidAvatar({ photoUrl, size = 'md', className }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const { settings } = useStudentSettings();
  const chosen = settings?.avatar?.imageUrl ?? null;
  const showPhoto = photoUrl && failedUrl !== photoUrl;

  return (
    <span
      aria-hidden="true"
      className={cn(
        'block shrink-0 overflow-hidden rounded-full border-[3px] border-white shadow-paper',
        SIZES[size],
        className
      )}
    >
      <AvatarPicture imageUrl={chosen} size={PIXELS[size] ?? 56} className="size-full">
        {showPhoto ? (
          <img src={photoUrl} alt="" className="size-full object-cover" onError={() => setFailedUrl(photoUrl)} />
        ) : (
          <BearFace className="size-full" />
        )}
      </AvatarPicture>
    </span>
  );
}

export default KidAvatar;
