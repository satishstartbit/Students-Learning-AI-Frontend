/**
 * The Grade 6+ Brain Booster exercises (built-in content, like the K-5
 * Breathe / Wiggle / Listen activities): each a short list of timed,
 * gentle steps. Run by ExerciseBreak.jsx#ExerciseSession on the exercise's
 * own page (pages/BoosterPage.jsx); listed on Focus via boosters.js.
 */
export const EXERCISES = [
  {
    id: 'breathe',
    icon: '🌿',
    label: 'Easy breathing',
    description: 'A quiet moment to settle in.',
    steps: Array.from({ length: 5 }, () => [
      { title: 'Breathe in gently', detail: 'Relax your shoulders. Take a comfortable breath in.', seconds: 4, icon: '🌱' },
      { title: 'Breathe out slowly', detail: 'Let the breath go easily, at a pace that feels good.', seconds: 6, icon: '🍃' },
    ]).flat(),
  },
  {
    id: 'stretch',
    icon: '🙆',
    label: 'Stretch break',
    description: 'Make a little room to move.',
    steps: [
      { title: 'Reach for the sky', detail: 'Sit or stand comfortably. Gently reach your arms upward.', seconds: 15, icon: '🙌' },
      { title: 'Roll your shoulders', detail: 'Lower your arms and make small, gentle shoulder circles.', seconds: 15, icon: '🔄' },
      { title: 'Wiggle your fingers', detail: 'Let your hands relax, then give your fingers a little wiggle.', seconds: 15, icon: '👐' },
      { title: 'Relax and reset', detail: 'Rest your hands, soften your shoulders, and take an easy breath.', seconds: 15, icon: '🌿' },
    ],
  },
  {
    id: 'cross',
    icon: '🤲',
    label: 'Cross-body taps',
    description: 'A gentle left-and-right rhythm.',
    steps: [
      { title: 'Find a comfy seat', detail: 'Rest your feet and place both hands on your knees.', seconds: 10, icon: '🪑' },
      { title: 'Right hand, left knee', detail: 'Gently tap your left knee with your right hand, then bring it back.', seconds: 15, icon: '🤚' },
      { title: 'Left hand, right knee', detail: 'Gently tap your right knee with your left hand, then bring it back.', seconds: 15, icon: '✋' },
      { title: 'Try taking turns', detail: 'Alternate hands slowly. Finish with your hands resting in your lap.', seconds: 20, icon: '🤲' },
    ],
  },
];

export const getExercise = (id) => EXERCISES.find((e) => e.id === id) ?? null;
