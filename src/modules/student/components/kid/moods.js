/**
 * The five check-in feelings, happiest first. `feeling` is what the card
 * says back once one is picked ("Feeling good!").
 */
export const MOODS = [
  { value: 'great', label: 'Great', feeling: 'Feeling great!' },
  { value: 'good', label: 'Good', feeling: 'Feeling good!' },
  { value: 'okay', label: 'Okay', feeling: 'Feeling okay' },
  { value: 'worried', label: 'Worried', feeling: 'Feeling worried' },
  { value: 'sad', label: 'Sad', feeling: 'Feeling sad' },
];

/** Energy is 1-5, shown as dots. */
export const ENERGY_LEVELS = [1, 2, 3, 4, 5];

export const findMood = (value) => MOODS.find((m) => m.value === value) ?? null;
