import '../aiAssistant.css';
import Spinner from '../../../components/common/Spinner';

/** Small loading state shown while waiting for the assistant's reply. */
export function ThinkingIndicator() {
  return (
    <div className="ai-thinking" role="status" aria-live="polite">
      <Spinner size="sm" label="Thinking" />
      <span>🤔 Thinking…</span>
    </div>
  );
}

export default ThinkingIndicator;
