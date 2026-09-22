/**
 * A question's picture, whatever its source: an emoji drawn large, or an
 * image (uploaded photo, GIF or sticker). `size` sets the box: 'chip'/'thumb'
 * for the assignment builder's rows, 'sm' for
 * lists, 'md' for the builder, 'lg' for a student answering.
 */
const BOX = { chip: 36, xs: 56, thumb: 60, sm: 72, md: 160, lg: 220 };

export default function QuestionPicture({ image, size = 'md', className = '' }) {
  if (!image) return null;
  const box = BOX[size] ?? BOX.md;
  const frame = {
    width: box,
    height: box,
    maxWidth: '100%',
    display: 'grid',
    placeItems: 'center',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--color-bg-surface-sunken)',
    overflow: 'hidden',
    flexShrink: 0,
  };

  if (image.source === 'emoji') {
    return (
      <div className={className} style={frame} role="img" aria-label={image.alt || 'Picture'}>
        <span aria-hidden="true" style={{ fontSize: Math.round(box * 0.62), lineHeight: 1 }}>
          {image.emoji}
        </span>
      </div>
    );
  }

  return (
    <div className={className} style={frame}>
      {image.url ? (
        <img src={image.url} alt={image.alt || 'Picture for this question'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <span className="ui-hint" style={{ padding: 8, textAlign: 'center' }}>Picture unavailable</span>
      )}
    </div>
  );
}
