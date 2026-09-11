import { useState } from 'react';
import { Alert, Button, Input, Select } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import * as aiAssistantService from '../services/aiAssistant.service';

/**
 * Subject + optional topic picker that starts a new learning session.
 * The student submits the subject's `name`, not its id.
 */
export function SubjectTopicPicker({ onStart, starting = false }) {
  const {
    data: subjects,
    error: loadError,
    isLoading: loadingSubjects,
    run: loadSubjects,
  } = useApi(aiAssistantService.listSubjects, { immediate: true, initialData: [] });

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');

  const options = (subjects ?? []).map((s) => ({ value: s.name, label: s.name }));

  return (
    <div>
      {loadError && (
        <Alert
          variant="error"
          title="Couldn't load subjects"
          className="ui-field"
        >
          {loadError.message}{' '}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => loadSubjects().catch(() => {})}
            style={{ marginLeft: 8 }}
          >
            Try again
          </Button>
        </Alert>
      )}

      <Select
        label="What would you like to learn today?"
        placeholder="Choose a subject"
        options={options}
        loading={loadingSubjects}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
      />

      <Input
        label="Anything specific? (optional)"
        placeholder="e.g. fractions, the water cycle…"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />

      <Button
        onClick={() => onStart({ subject, topic: topic.trim() || undefined })}
        disabled={!subject || starting}
        loading={starting}
        fullWidth
      >
        Start Learning
      </Button>
    </div>
  );
}

export default SubjectTopicPicker;
