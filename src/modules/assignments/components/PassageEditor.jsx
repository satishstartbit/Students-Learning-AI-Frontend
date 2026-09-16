import { Textarea } from '../../../components/common';

/** The reading passage/excerpt a passage_mcq question is asked about, shown to the student above the prompt. */
export default function PassageEditor({ value, onChange, disabled, error }) {
  return (
    <Textarea
      label="Passage"
      hint="The reading passage or excerpt students see before answering."
      required
      rows={5}
      maxLength={5000}
      value={value}
      disabled={disabled}
      error={error}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
