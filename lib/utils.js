import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names conditionally, resolving Tailwind conflicts.
 * @param {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
