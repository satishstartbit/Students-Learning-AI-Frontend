/**
 * K-4 wording for the 6 legacy moods (Grade 6+ uses `mood.name` directly -
 * see checkIn/moods.js#LEGACY_MOOD_CODES). Any other mood - a new one an
 * admin has added - falls back to a phrase built from its own `name`.
 */
const KID_COPY = {
  calm: { kidLabel: 'Calm', kidFeeling: 'Feeling calm' },
  tense: { kidLabel: 'Worried', kidFeeling: 'Feeling worried' },
  tired: { kidLabel: 'Sleepy', kidFeeling: 'Feeling sleepy' },
  distracted: { kidLabel: 'Wiggly', kidFeeling: 'Feeling wiggly' },
  overwhelmed: { kidLabel: 'Too much', kidFeeling: 'It all feels like too much' },
  ready_to_focus: { kidLabel: 'Ready!', kidFeeling: 'Ready to go!' },
};

export function kidCopyFor(mood) {
  if (!mood) return { kidLabel: '', kidFeeling: '' };
  return (
    KID_COPY[mood.code] ?? {
      kidLabel: mood.name,
      kidFeeling: `Feeling ${String(mood.name ?? '').toLowerCase()}`,
    }
  );
}

export default kidCopyFor;
