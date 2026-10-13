/**
 * Where a step list shows a project stage as a heading (PDF Q5: research ->
 * build -> review): before the first step of each milestone, but only when
 * the work has more than one stage - a single stage adds nothing to read.
 * Returns a Map stepId -> milestone title. Pure (tested).
 */
export function milestoneHeadings(steps = []) {
  const titles = new Set(steps.map((s) => s.milestone?.title).filter(Boolean));
  const headings = new Map();
  if (titles.size < 2) return headings;
  let current = null;
  for (const step of steps) {
    const title = step.milestone?.title ?? null;
    if (title && title !== current) headings.set(step.id, title);
    current = title;
  }
  return headings;
}

export default milestoneHeadings;
