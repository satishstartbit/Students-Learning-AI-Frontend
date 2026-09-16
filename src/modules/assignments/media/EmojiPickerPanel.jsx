import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

/**
 * Emoji Mart picker. Its own module so the emoji data (a few hundred KB) is
 * only downloaded when a teacher opens the emoji picker - see PicturePicker's
 * lazy import. Calls onSelect({ emoji, name }).
 */
export default function EmojiPickerPanel({ onSelect }) {
  return (
    <Picker
      data={data}
      onEmojiSelect={(emoji) => onSelect({ emoji: emoji.native, name: emoji.name })}
      theme="light"
      previewPosition="none"
      skinTonePosition="search"
      maxFrequentRows={2}
      autoFocus
    />
  );
}
