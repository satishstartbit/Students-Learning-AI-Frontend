import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * The class helper every shadcn component uses.
 *
 * clsx resolves conditional class objects and arrays; twMerge then removes
 * conflicting Tailwind utilities so a caller's `className` reliably wins over
 * a component's defaults (`p-2` passed in beats a built-in `p-4`).
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
