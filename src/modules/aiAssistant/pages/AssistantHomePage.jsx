import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatRelative } from '../../../utils/date';
import SubjectTopicPicker from '../components/SubjectTopicPicker';
import * as aiAssistantService from '../services/aiAssistant.service';

/**
 * Landing page for the AI Learning Assistant.
 *
 * Offers to continue an existing active session, or start a fresh one -
 * never both a stale session and a picker at once, to keep the choice simple
 * for young students.
 */
export default function AssistantHomePage() {
  const navigate = useNavigate();

  const {
    data: activeSession,
    error,
    isLoading,
    run: loadActiveSession,
  } = useApi(aiAssistantService.getActiveSession, { immediate: true });

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  const handleStart = async ({ subject, topic }) => {
    setStarting(true);
    setStartError(null);
    try {
      const { data } = await aiAssistantService.startSession({ subject, topic });
      navigate(`/student/assistant/${data.id}`);
    } catch (err) {
      setStartError(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="td-page">
      <PageHeader
        title="AI Learning Assistant"
        description="Ask questions, get things explained, and practice with a friendly helper."
        actions={
          <Button as={Link} to="/student/assistant/history" variant="secondary">
            Learning History
          </Button>
        }
      />

      {isLoading && <Loader message="Checking for a session in progress…" />}

      {!isLoading && error && (
        <ErrorState error={error} onRetry={() => loadActiveSession().catch(() => {})} />
      )}

      {!isLoading && !error && (
        <>
          {activeSession && (
            <Card
              title="Pick up where you left off"
              subtitle={`${activeSession.subject}${activeSession.topic ? ` · ${activeSession.topic}` : ''}`}
              className="ui-field"
            >
              <p className="ui-hint">
                Last activity {formatRelative(activeSession.lastActivityAt)}
              </p>
              <Button onClick={() => navigate(`/student/assistant/${activeSession.id}`)}>
                Continue Session
              </Button>
            </Card>
          )}

          <Card
            title={activeSession ? 'Or start something new' : 'What should we work on?'}
          >
            {startError && (
              <Alert variant="error" className="ui-field">
                {startError}
              </Alert>
            )}
            <SubjectTopicPicker onStart={handleStart} starting={starting} />
          </Card>
        </>
      )}
    </div>
  );
}
