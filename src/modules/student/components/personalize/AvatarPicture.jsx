import { useState } from 'react';
import { AvatarArt } from './AvatarArt';
import { resolveAvatarImage } from './avatarCatalog';

/**
 * One avatar's picture, whichever kind it is: built-in drawn art
 * ("avatar:<slug>"), or an image a Super Admin uploaded/linked. Uploaded
 * pictures arrive as short-lived signed URLs, so a failed load falls back to
 * `children` (the caller's own placeholder) rather than a broken image.
 *
 * Decorative - every caller shows the avatar's name, or the student's own,
 * beside it.
 */
export function AvatarPicture({ imageUrl, size = 48, className, children = null }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const picture = resolveAvatarImage(imageUrl);

  if (picture.kind === 'art') return <AvatarArt slug={picture.slug} size={size} className={className} />;

  if (picture.kind === 'image' && failedUrl !== picture.src) {
    return (
      <img
        src={picture.src}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%' }}
        onError={() => setFailedUrl(picture.src)}
      />
    );
  }

  return children;
}

export default AvatarPicture;
