// Leveling curve.
//
// Cost to advance from level N to N+1 is 25 * (N + 1) XP:
//   1 -> 2 : 50
//   2 -> 3 : 75
//   3 -> 4 : 100
//   ...
// Gentle linear growth — early levels come fast to keep new users motivated,
// later levels cost a bit more without ever spiking.

const STEP = 25;

/** Highest reachable level. XP beyond this stops advancing the level. */
export const MAX_LEVEL = 50;

/** XP cost to advance from `level` to `level + 1`. */
export function xpForLevelUp(level: number): number {
  return STEP * (level + 1);
}

/** Total cumulative XP required to reach the start of `level` (level 1 = 0). */
export function totalXpForLevel(level: number): number {
  // sum_{k=1}^{level-1} STEP * (k + 1) = STEP * (level*(level+1)/2 - 1)
  if (level <= 1) return 0;
  return STEP * ((level * (level + 1)) / 2 - 1);
}

export interface LevelInfo {
  /** Current level (1 .. MAX_LEVEL). */
  level: number;
  /** XP accumulated within the current level. */
  xpInLevel: number;
  /** XP needed to advance from the current level to the next (0 at max level). */
  xpForNext: number;
  /** Progress toward the next level, 0-100 (rounded; 100 at max level). */
  progress: number;
  /** True once the user has hit MAX_LEVEL. */
  isMax: boolean;
}

/** Resolve a total XP value into level + progress info. */
export function levelInfo(totalXP: number): LevelInfo {
  const xp = Math.max(0, totalXP);
  let level = 1;
  // Advance while the user has enough XP to reach the next level, capped at MAX_LEVEL.
  while (level < MAX_LEVEL && xp >= totalXpForLevel(level + 1)) {
    level += 1;
  }
  if (level >= MAX_LEVEL) {
    return {
      level: MAX_LEVEL,
      xpInLevel: xp - totalXpForLevel(MAX_LEVEL),
      xpForNext: 0,
      progress: 100,
      isMax: true,
    };
  }
  const xpInLevel = xp - totalXpForLevel(level);
  const xpForNext = xpForLevelUp(level);
  const progress = Math.round((xpInLevel / xpForNext) * 100);
  return { level, xpInLevel, xpForNext, progress, isMax: false };
}
