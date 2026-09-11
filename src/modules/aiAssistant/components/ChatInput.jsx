import { useState } from 'react';
import '../aiAssistant.css';
import { Button, Textarea } from '../../../components/common';

/**
 * Free-text message composer.
 * Enter sends, Shift+Enter inserts a newline - the same convention as every
 * common chat surface.
 */
export function ChatInput({ onSend, disabled = false, placeholder = 'Ask me anything…' }) {
  const [value, setValue] = useState('');

  const send = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="ai-chat-input">
      <Textarea
        aria-label="Message"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        reserveHelper={false}
        fieldClassName="ai-chat-input__field"
      />
      <Button onClick={send} disabled={disabled || !value.trim()} loading={disabled}>
        Send
      </Button>
    </div>
  );
}

export default ChatInput;
