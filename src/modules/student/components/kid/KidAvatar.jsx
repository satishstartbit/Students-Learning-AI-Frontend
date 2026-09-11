import { useState } from 'react';
import { cn } from '../../../../lib/utils';
import { BearFace } from './Bear';

const SIZES = {
  sm: 'size-11',
  md: 'size-14',
  lg: 'size-20',
};

/**
 * The student's photo, or the bear when there isn't one (or it fails to
 * load - profile photo URLs are short-lived signed links). Decorative: the
 * student's name is always shown beside it.
 */
export function KidAvatar({ photoUrl, size = 'md', className }) {
  const [failedUrl, setFailedUrl] = useState(null);
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
      {showPhoto ? (
        <img src={photoUrl} alt="" className="size-full object-cover" onError={() => setFailedUrl(photoUrl)} />
      ) : (
        <BearFace className="size-full" />
      )}
    </span>
  );
}

export default KidAvatar;
