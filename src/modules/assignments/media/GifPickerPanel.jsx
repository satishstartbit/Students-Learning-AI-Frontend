import { GifPicker } from 'gif-picker-react';
import { getGifProviders } from './gifProviders';

/**
 * gif-picker-react for GIFs or stickers (`kind`), lazy-loaded by PicturePicker.
 * Calls onSelect({ url, description }).
 */
export default function GifPickerPanel({ kind, onSelect }) {
  const providers = getGifProviders();
  if (!providers) return null;

  return (
    <GifPicker
      key={kind}
      provider={kind === 'sticker' ? providers.sticker : providers.gif}
      onGifClick={(gif) => onSelect({ url: gif.imageUrl, description: gif.description ?? '' })}
      width="100%"
      height={420}
    />
  );
}
