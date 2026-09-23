import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loader,
  Modal,
  PageHeader,
  StatusBadge,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { getErrorMessage } from '../../../utils/errorHandler';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import PracticeQuestionCard from '../components/PracticeQuestionCard';
import SessionProgressSummary from '../components/SessionProgressSummary';
import ThinkingIndicator from '../components/ThinkingIndicator';
import * as aiAssistantService from '../services/aiAssistant.service';

/**
 * The main chat surface for one learning session.
 *
 * Every mutation (send message / explain / practice question / answer / hint)
 * updates the transcript and progress counters from its own response rather
 * than refetching the whole session, since the API is request/response only
 * (no streaming) - see the module's service file for the shape of each call.
 */
export default function LearningSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  /*
   * The transcript lives on the session object rather than in its own state,
   * so every mutation below is a plain event-handler update - nothing has to
   * sync the two from an effect.
   */
  const {
    data: session,
    error: loadError,
    isLoading,
    run: load,
    setData: setSession,
  } = useApi(aiAssistantService.getSession, { immediate: true, args: [sessionId] });

  const messages = session?.messages ?? [];

  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState(null);

  const [explainOpen, setExplainOpen] = useState(false);
  const [explainTopicValue, setExplainTopicValue] = useState('');
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState(null);

  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState(null);

  const [ending, setEnding] = useState(false);

  const isActive = session?.status === 'active';

  const appendMessages = (...msgs) =>
    setSession((prev) =>
      prev ? { ...prev, messages: [...(prev.messages ?? []), ...msgs.filter(Boolean)] } : prev
    );

  const handleSend = async (content) => {
    setSending(true);
    setChatError(null);
    try {
      const { data } = await aiAssistantService.postMessage(sessionId, content);
      appendMessages(data.studentMessage, data.assistantMessage);
    } catch (err) {
      setChatError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleExplain = async () => {
    const topic = explainTopicValue.trim();
    if (!topic) return;

    setExplaining(true);
    setExplainError(null);
    try {
      const { data } = await aiAssistantService.explainTopic(sessionId, topic);
      appendMessages(data.studentMessage, data.assistantMessage);
      setExplainOpen(false);
      setExplainTopicValue('');
    } catch (err) {
      setExplainError(getErrorMessage(err));
    } finally {
      setExplaining(false);
    }
  };

  const handlePractice = async () => {
    setPracticeLoading(true);
    setPracticeError(null);
    try {
      const { data } = await aiAssistantService.requestPracticeQuestion(sessionId);
      appendMessages(data);
      setSession((prev) => (prev ? { ...prev, practiceQuestionCount: (prev.practiceQuestionCount ?? 0) + 1 } : prev));
    } catch (err) {
      setPracticeError(getErrorMessage(err));
    } finally {
      setPracticeLoading(false);
    }
  };

  const handleAnswered = (result) => {
    appendMessages(result.feedbackMessage);
    if (result.correct) {
      setSession((prev) =>
        prev ? { ...prev, practiceCorrectCount: (prev.practiceCorrectCount ?? 0) + 1 } : prev
      );
    }
  };

  const handleHint = () => {
    setSession((prev) => (prev ? { ...prev, hintCount: (prev.hintCount ?? 0) + 1 } : prev));
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      const { data } = await aiAssistantService.endSession(sessionId);
      // The end-session response is a summary without the transcript.
      setSession((prev) => ({ ...data, messages: prev?.messages ?? [] }));
      navigate('/student/assistant');
    } catch (err) {
      setChatError(getErrorMessage(err));
    } finally {
      setEnding(false);
    }
  };

  if (isLoading) return <Loader message="Loading your session…" />;

  if (loadError) {
    const notAvailable = loadError.status === 403 || loadError.status === 404;
    return (
      <>
        <ErrorState
          title={notAvailable ? "This session isn't available" : 'Something went wrong'}
          description={
            notAvailable
              ? "We couldn't find that learning session, or it isn't yours to view."
              : loadError.message
          }
          onRetry={notAvailable ? undefined : () => load(sessionId).catch(() => {})}
        />
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
          <Link to="/student/assistant/history">Back to History</Link>
        </div>
      </>
    );
  }

  if (!session) return null;

  const subtitle = [session.topic, session.grade].filter(Boolean).join(' · ') || 'General';

  return (
    <div className="td-page">
      <PageHeader
        title={session.subject}
        description={subtitle}
        breadcrumbs={[{ label: 'AI Assistant', to: '/student/assistant' }, { label: session.subject }]}
        actions={
          isActive ? (
            <Button variant="secondary" onClick={handleEnd} loading={ending}>
              Exit Session
            </Button>
          ) : (
            <Button as={Link} to="/student/assistant/history" variant="secondary">
              Back to History
            </Button>
          )
        }
      />

      <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <StatusBadge status={session.status} />
      </div>

      <SessionProgressSummary
        practiceQuestionCount={session.practiceQuestionCount}
        practiceCorrectCount={session.practiceCorrectCount}
        hintCount={session.hintCount}
      />

      <Card className="ui-field" style={{ marginTop: 'var(--spacing-lg)' }}>
        {messages.length === 0 ? (
          <EmptyState
            icon="✨"
            title={isActive ? 'Ready when you are!' : 'No messages in this session'}
            description={
              isActive
                ? 'Ask me anything or try a practice question!'
                : 'This session has ended, but you can still look back at what was covered.'
            }
          />
        ) : (
          <div className="ai-chat">
            {messages.map((message) =>
              message.type === 'practice_question' ? (
                <PracticeQuestionCard
                  key={message.id}
                  sessionId={sessionId}
                  message={message}
                  disabled={!isActive}
                  onAnswered={handleAnswered}
                  onHint={handleHint}
                />
              ) : (
                <ChatBubble key={message.id} message={message} />
              )
            )}
            {sending && <ThinkingIndicator />}
          </div>
        )}

        {chatError && (
          <Alert variant="error" className="ui-field">
            {chatError}
          </Alert>
        )}

        {isActive && (
          <>
            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                flexWrap: 'wrap',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              <Button variant="secondary" size="sm" onClick={() => setExplainOpen(true)} disabled={sending}>
                Explain a topic
              </Button>
              <Button variant="secondary" size="sm" onClick={handlePractice} loading={practiceLoading} disabled={sending}>
                Practice Question
              </Button>
            </div>

            {practiceError && (
              <Alert variant="error" className="ui-field">
                {practiceError}
              </Alert>
            )}

            <ChatInput onSend={handleSend} disabled={sending} />
          </>
        )}
      </Card>

      <Modal
        isOpen={explainOpen}
        onClose={() => {
          setExplainOpen(false);
          setExplainError(null);
        }}
        title="What should I explain?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExplainOpen(false)} disabled={explaining}>
              Cancel
            </Button>
            <Button onClick={handleExplain} loading={explaining} disabled={!explainTopicValue.trim()}>
              Explain
            </Button>
          </>
        }
      >
        {explainError && (
          <Alert variant="error" className="ui-field">
            {explainError}
          </Alert>
        )}
        <Input
          label="Topic"
          placeholder="e.g. photosynthesis"
          value={explainTopicValue}
          onChange={(e) => setExplainTopicValue(e.target.value)}
        />
      </Modal>
    </div>
  );
}
