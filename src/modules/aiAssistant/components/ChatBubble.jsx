import '../aiAssistant.css';
import { formatTime } from '../../../utils/date';
import HelpLines from '../../../components/safety/HelpLines';
import { useSafetyContent } from '../../../components/safety/useSafetyContent';

/** The admin's help lines (Kids Help Phone, 911) under a safety reply. */
function SafetyHelpLines() {
  const content = useSafetyContent();
  return <HelpLines lines={content?.helpLines} className="ai-bubble__help" />;
}

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
      {isSafety && <SafetyHelpLines />}
      {message.createdAt && <span className="ai-bubble__time">{formatTime(message.createdAt)}</span>}
    </div>
  );
}

export default ChatBubble;
