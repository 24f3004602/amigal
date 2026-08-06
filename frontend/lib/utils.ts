import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Accepts the conditional forms used across the components (`cond && 'cls'`,
// arrays, objects) and lets tailwind-merge settle conflicting utilities.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const intersection = new Set(a.filter((x) => b.includes(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

export const BAD_WORDS = new Set([
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'cock',
  'nigger', 'nigga', 'faggot', 'retard', 'kill yourself', 'kys',
  'rape', 'rapist', 'pedo', 'cp', 'nude', 'naked', 'sex', 'porn', 'xxx',
  'cum', 'jizz', 'whore', 'slut',
]);

export function containsBadWords(text: string): boolean {
  const lower = text.toLowerCase();
  for (const word of BAD_WORDS) {
    if (lower.includes(word)) return true;
  }
  return false;
}

export function censorText(text: string): string {
  let result = text;
  for (const word of BAD_WORDS) {
    const regex = new RegExp(word, 'gi');
    result = result.replace(regex, '*'.repeat(word.length));
  }
  return result;
}
