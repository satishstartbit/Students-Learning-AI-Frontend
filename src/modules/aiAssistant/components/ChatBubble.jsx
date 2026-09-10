import '../aiAssistant.css';
import { formatTime } from '../../../utils/date';

/**
 * One `ClientMessage` in the transcript.
 *
 * Plain text only - line breaks are preserved via `white-space: pre-wrap` in
 * aiAssistant.css. This app renders no markdown for assistant replies.
 */
export function ChatBubble({ message }) {
  if (!message) return null;

  const isStudent = message.role === 'student';
  const isSafety = message.type === 'safety_block';

  const modifier = isSafety ? 'safety' : isStudent ? 'student' : 'assistant';

  return (
    <div className={`ai-bubble ai-bubble--${modifier}`}>
      {isSafety && <span className="ai-bubble__label">A gentle note from your assistant</span>}
      {message.content}
      {message.createdAt && <span className="ai-bubble__time">{formatTime(message.createdAt)}</span>}
    </div>
  );
}

export default ChatBubble;
