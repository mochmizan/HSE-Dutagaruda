/** Locked category accents (§02). Single source of truth for every page. */
export const CATEGORY_ACCENT = {
  hydrant: '#eb5757',
  apar: '#f2994a',
  p3k: '#27ae60',
  patrol: '#2f80ed',
} as const;

export type CategoryKey = keyof typeof CATEGORY_ACCENT;
