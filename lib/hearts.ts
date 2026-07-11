// Shared hearts constants — safe to import from client components.
export const HEARTS_MAX = 5;
export const HEART_REFILL_MS = 3 * 60 * 60 * 1000; // 1 heart every 3 hours

export interface HeartsState {
  hearts: number;
  // ISO timestamp of when the next heart arrives; null when full.
  nextRefillAt: string | null;
  max: number;
}
