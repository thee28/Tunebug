"use client";

import { useEffect, useState } from "react";
import type { MasterySnapshot } from "@/lib/curriculum/slotGenerator";

type MasteryPayload = Record<string, {
  masteryScore: number;
  currentStreak: number;
  timesSeen: number;
  nextReviewAt: string;
}>;

// Fetches the signed-in user's full mastery snapshot once. Returns undefined
// while loading; an empty map is a valid loaded state for a new user.
// Callers should pass the returned map straight into generateLessonSteps.
export function useMastery(): Map<string, MasterySnapshot> | undefined {
  const [map, setMap] = useState<Map<string, MasterySnapshot> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mastery")
      .then((r) => (r.ok ? r.json() : ({} as MasteryPayload)))
      .then((data: MasteryPayload) => {
        if (cancelled) return;
        const m = new Map<string, MasterySnapshot>();
        for (const [k, v] of Object.entries(data)) {
          m.set(k, {
            masteryScore: v.masteryScore,
            currentStreak: v.currentStreak,
            timesSeen: v.timesSeen,
            nextReviewAt: new Date(v.nextReviewAt),
          });
        }
        setMap(m);
      })
      .catch(() => {
        if (!cancelled) setMap(new Map());
      });
    return () => { cancelled = true; };
  }, []);

  return map;
}
