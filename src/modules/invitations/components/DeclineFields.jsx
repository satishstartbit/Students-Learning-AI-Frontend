import { Textarea } from '../../../components/common';

/**
 * The two optional notes a teacher can leave when declining (PDF Q7):
 * private feedback that only Growing Focus reads, and a separate message the
 * teacher chooses to share with the family. The family never sees the first.
 * `value` = { reason, sharedMessage }.
 */
export default function DeclineFields({ value, onChange, familyName = 'the family' }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  return (
    <>
      <Textarea
        name="sharedMessage"
        label={`Message to ${familyName} (optional)`}
        hint="They will see this. For example: “I think this reached the wrong teacher.”"
        rows={3}
        maxLength={500}
        value={value.sharedMessage}
        onChange={set('sharedMessage')}
      />
      <Textarea
        name="reason"
        label="Private feedback for Growing Focus (optional)"
        hint="Only our team reads this - it is never shown to the family."
        rows={2}
        maxLength={500}
        value={value.reason}
        onChange={set('reason')}
      />
    </>
  );
}
