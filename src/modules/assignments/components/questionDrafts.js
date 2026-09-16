/**
 * Question drafts for the task builder, and the conversion to/from the API.
 *
 * A draft: { key, prompt, image, answerType: 'mcq'|'free_text'|'matching'|'passage_mcq',
 *            points, required, passage, options: [{ id, text, image }],
 *            correctOptionId, expectedAnswer, pairs: [{ id, left, right }] }
 * `key` is only for React; option/pair-side ids are sent to the server and
 * must stay stable so student answers keep pointing at the right one.
 */

export const MAX_QUESTIONS = 50;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;
export const MIN_PAIRS = 3;
export const MAX_PAIRS = 8;

const randomId = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 10)}`;

export const newOption = () => ({ id: randomId('o'), text: '', image: null });
export const newPairSide = () => ({ id: randomId('s'), text: '', image: null });
export const newPair = () => ({ id: randomId('p'), left: newPairSide(), right: newPairSide() });

const baseDraft = () => ({
  key: randomId('q'),
  prompt: '',
  image: null,
  points: 1,
  required: true,
  passage: '',
  options: [],
  correctOptionId: '',
  expectedAnswer: '',
  pairs: [],
});

/** Multiple choice by default - it can be marked automatically, and suits young students. */
export function newQuestion() {
  return { ...baseDraft(), answerType: 'mcq', options: [newOption(), newOption()] };
}

function optionFromApi(o) {
  return { id: o.id, text: o.text ?? '', image: o.image ?? null };
}

function pairFromApi(p) {
  return {
    id: p.id,
    left: { id: p.left.id, text: p.left.text ?? '', image: p.left.image ?? null },
    right: { id: p.right.id, text: p.right.text ?? '', image: p.right.image ?? null },
  };
}

export function questionFromApi(q) {
  return {
    key: q.id ?? randomId('q'),
    prompt: q.prompt ?? '',
    image: q.image ? { ...q.image, alt: q.image.alt ?? '' } : null,
    answerType: q.answerType,
    points: q.points ?? 1,
    required: q.required !== false,
    passage: q.passage ?? '',
    options:
      (q.answerType === 'mcq' || q.answerType === 'passage_mcq') && q.options?.length
        ? q.options.map(optionFromApi)
        : [newOption(), newOption()],
    correctOptionId: q.correctOptionId ?? '',
    expectedAnswer: q.expectedAnswer ?? '',
    pairs: q.answerType === 'matching' && q.pairs?.length ? q.pairs.map(pairFromApi) : [newPair(), newPair(), newPair()],
  };
}

function imageToPayload(image) {
  if (!image) return null;
  const alt = image.alt?.trim() || null;
  if (image.source === 'upload') return { source: 'upload', fileId: image.fileId, alt };
  if (image.source === 'emoji') return { source: 'emoji', emoji: image.emoji, alt };
  return { source: image.source, url: image.url, alt };
}

const optionToPayload = (o) => ({ id: o.id, text: o.text.trim(), image: imageToPayload(o.image) });
const sideToPayload = (s) => ({ id: s.id, text: s.text.trim(), image: imageToPayload(s.image) });
const pairToPayload = (p) => ({ id: p.id, left: sideToPayload(p.left), right: sideToPayload(p.right) });

export function questionToPayload(q) {
  const base = {
    prompt: q.prompt.trim(),
    image: imageToPayload(q.image),
    answerType: q.answerType,
    points: Math.max(1, Math.round(Number(q.points) || 1)),
    required: q.required !== false,
  };
  if (q.answerType === 'mcq' || q.answerType === 'passage_mcq') {
    const withOptions = { ...base, options: q.options.map(optionToPayload), correctOptionId: q.correctOptionId };
    return q.answerType === 'passage_mcq' ? { ...withOptions, passage: q.passage.trim() } : withOptions;
  }
  if (q.answerType === 'matching') return { ...base, pairs: q.pairs.map(pairToPayload) };
  return { ...base, expectedAnswer: q.expectedAnswer.trim() || null };
}

/** An option/pair-side is complete once it has text or a picture. */
const hasContent = (side) => Boolean(side.text.trim() || side.image);

/** { [key]: { prompt?, options?, correct?, pairs?, passage? } } - empty object when every draft is complete. */
export function validateQuestions(questions) {
  const errors = {};
  questions.forEach((q) => {
    const e = {};
    if (!q.prompt.trim()) e.prompt = 'Write the question, e.g. "What is this?"';

    if (q.answerType === 'mcq' || q.answerType === 'passage_mcq') {
      if (q.options.some((o) => !hasContent(o))) e.options = 'Give every option text or a picture, or remove the empty one';
      if (!q.options.some((o) => o.id === q.correctOptionId)) e.correct = 'Mark the correct answer';
      if (q.answerType === 'passage_mcq' && !q.passage.trim()) e.passage = 'Write the passage text';
    } else if (q.answerType === 'matching') {
      if (q.pairs.length < MIN_PAIRS) e.pairs = `Use at least ${MIN_PAIRS} matching pairs`;
      else if (q.pairs.some((p) => !hasContent(p.left) || !hasContent(p.right))) {
        e.pairs = 'Give every pair a left and right item - text or a picture';
      }
    }

    if (Object.keys(e).length) errors[q.key] = e;
  });
  return errors;
}
