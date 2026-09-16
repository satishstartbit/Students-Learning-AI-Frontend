/**
 * Question drafts for the task builder, and the conversion to/from the API.
 *
 * A draft: { key, prompt, image, answerType: 'mcq'|'free_text',
 *            options: [{ id, text }], correctOptionId, expectedAnswer }
 * `key` is only for React; option ids are sent to the server and must stay
 * stable so student answers keep pointing at the right option.
 */

export const MAX_QUESTIONS = 50;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;

const randomId = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 10)}`;

export const newOption = () => ({ id: randomId('o'), text: '' });

/** Multiple choice by default - it can be marked automatically, and suits young students. */
export function newQuestion() {
  return { key: randomId('q'), prompt: '', image: null, answerType: 'mcq', options: [newOption(), newOption()], correctOptionId: '', expectedAnswer: '' };
}

export function questionFromApi(q) {
  return {
    key: q.id ?? randomId('q'),
    prompt: q.prompt ?? '',
    image: q.image ? { ...q.image, alt: q.image.alt ?? '' } : null,
    answerType: q.answerType,
    options: q.answerType === 'mcq' && q.options?.length ? q.options.map((o) => ({ id: o.id, text: o.text })) : [newOption(), newOption()],
    correctOptionId: q.correctOptionId ?? '',
    expectedAnswer: q.expectedAnswer ?? '',
  };
}

function imageToPayload(image) {
  if (!image) return null;
  const alt = image.alt?.trim() || null;
  if (image.source === 'upload') return { source: 'upload', fileId: image.fileId, alt };
  if (image.source === 'emoji') return { source: 'emoji', emoji: image.emoji, alt };
  return { source: image.source, url: image.url, alt };
}

export function questionToPayload(q) {
  const base = { prompt: q.prompt.trim(), image: imageToPayload(q.image), answerType: q.answerType };
  if (q.answerType === 'mcq') {
    return { ...base, options: q.options.map((o) => ({ id: o.id, text: o.text.trim() })), correctOptionId: q.correctOptionId };
  }
  return { ...base, expectedAnswer: q.expectedAnswer.trim() || null };
}

/** { [key]: { prompt?, options?, correct? } } - empty object when every draft is complete. */
export function validateQuestions(questions) {
  const errors = {};
  questions.forEach((q) => {
    const e = {};
    if (!q.prompt.trim()) e.prompt = 'Write the question, e.g. "What is this?"';
    if (q.answerType === 'mcq') {
      if (q.options.some((o) => !o.text.trim())) e.options = 'Fill in every answer option, or remove the empty one';
      if (!q.options.some((o) => o.id === q.correctOptionId)) e.correct = 'Mark the correct answer';
    }
    if (Object.keys(e).length) errors[q.key] = e;
  });
  return errors;
}
