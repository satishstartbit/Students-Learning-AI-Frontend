import '../aiAssistant.css';
import { ProgressBar, StatCard } from '../../../components/common';

/**
 * Small at-a-glance strip of the current session's practice activity.
 */
export function SessionProgressSummary({
  practiceQuestionCount = 0,
  practiceCorrectCount = 0,
  hintCount = 0,
}) {
  return (
    <div className="ai-session-progress">
      <StatCard label="Practice Questions" value={practiceQuestionCount} icon="📝" />
      <StatCard label="Correct Answers" value={practiceCorrectCount} icon="✅" />
      <StatCard label="Hints Used" value={hintCount} icon="💡" />
      <div>
        <ProgressBar
          label="Accuracy"
          showValue
          value={practiceCorrectCount}
          max={Math.max(practiceQuestionCount, 1)}
          variant="success"
        />
      </div>
    </div>
  );
}

export default SessionProgressSummary;
