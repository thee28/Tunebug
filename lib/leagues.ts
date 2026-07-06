// League tiers by lifetime XP. Shared by the leaderboard view and the
// dashboard sidebar. Pure module — safe to import from client components.

export interface League {
  name: string;
  color: string;
  bg: string;
  icon: string;
  minXP: number;
}

export const LEAGUES: League[] = [
  { name: "Bronze",  color: "#cd7f32", bg: "rgba(205,127,50,0.18)",  icon: "military_tech", minXP: 0 },
  { name: "Silver",  color: "#9e9e9e", bg: "rgba(158,158,158,0.12)", icon: "military_tech", minXP: 800 },
  { name: "Gold",    color: "#ffd700", bg: "rgba(255,215,0,0.15)",   icon: "emoji_events",  minXP: 2000 },
  { name: "Diamond", color: "#7df9ff", bg: "rgba(125,249,255,0.12)", icon: "diamond",       minXP: 5000 },
];

export function leagueIndex(xp: number): number {
  let idx = 0;
  for (let i = 0; i < LEAGUES.length; i++) {
    if (xp >= LEAGUES[i].minXP) idx = i;
  }
  return idx;
}

export function leagueForXP(xp: number): League {
  return LEAGUES[leagueIndex(xp)];
}
