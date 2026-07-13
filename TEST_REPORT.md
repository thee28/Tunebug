# Tunebug Pre-Deployment Test Report

Date: 2026-07-13
Suite: `npm run verify` → typecheck + lint + 198 unit/component + 43 DB + 12 E2E = **253 tests, all green**.

---

## Verdict: **GO** — with three named caveats to fix soon (none data-destroying)

The core loop is solid: auth is enforced server-side on every route, XP grants are
race-safe, locked content is now enforced at the API (fixed during this audit),
no secrets leak to the client bundle, and the microphone is provably released
after every exercise. The caveats below are real but none corrupts data or
exposes users.

---

## Ship blockers — found AND fixed in this audit

Both fixes are minimal and covered by tests that were verified to fail against
the broken code (see Phase 7).

### 1. Locked lessons completable via direct API call
- **Where:** `POST /api/progress` ([app/api/progress/route.ts](app/api/progress/route.ts))
- **Repro (pre-fix):** authenticate, POST `{ lessonId: <any locked lesson>, score: 100 }` → 200, XP granted, progression unlocked.
- **Fix:** server-side `isLessonUnlocked()` ([lib/db/stages.ts:91](lib/db/stages.ts)) reusing the exact display unlock rules → 403 `Lesson locked`.
- **Tests:** `tests/db/api.routes.test.ts` › "progression integrity" (2 tests, both failed pre-fix).

### 2. Debug tool shipped to production users
- **Where:** [DebugExercisePicker.tsx](components/dashboard/DebugExercisePicker.tsx) rendered unconditionally on the dashboard ("🐛 DEBUG EXERCISES" button).
- **Fix:** dev-only gate (`NODE_ENV === "development"`); dead-code-eliminated from production builds.

---

## Should fix soon

### 1. Streak timezone bug (confirmed as bug by product owner)
Streaks are UTC-calendar-day based; there is no per-user timezone
([lib/db/streak.ts](lib/db/streak.ts)). A user in UTC−8 playing late evenings
can skip a UTC day while missing only one local evening → streak silently
resets. Fix requires a user `timezone` column and day-math against it.
`tests/db/streak.test.ts` pins the current behavior with a comment so the fix
must consciously flip that assertion.

### 2. Cents meter re-renders React every audio frame
[PitchMatchExercise.tsx](components/exercises/PitchMatchExercise.tsx) calls
`setLiveCents` / `setHoldProgress` (and `setLiveNoteName`) inside the
`requestAnimationFrame` loop → a full component re-render ~60×/s while singing.
It *works* (inline styles, tiny tree) but wastes main-thread budget on
low-end devices. **Proposed fix (not applied, per instructions):** keep
`smoothedCents` in a ref, write the needle's `style.left` and the progress
ring's `stroke-dashoffset` directly in the RAF tick, and only `setState` for
phase changes and note-name changes. ~30 lines, no visual change.

### 3. Landing page LCP: 22.4 s (Lighthouse, simulated slow 4G)
Cause: the full **3.9 MB Material Symbols icon font** from fonts.gstatic.com.
Fix: subset the font to the ~30 glyphs actually used (or self-host a subset).
`/login` is fine (perf 0.98, LCP 2.2 s) because less icon usage blocks paint.

### 4. No rate limit… correction: login IS rate-limited; one gap remains
`/api/auth/callback/credentials` (10/15min/IP) and register (5/15min/IP) are
both limited. Remaining gap: the in-memory limiter resets on every serverless
cold start on Vercel — consider an edge/KV-backed limiter eventually.

### 5. Mic hardware failures mid-exercise give no dedicated message
Unplugging the mic / another tab stealing it mid-hold silently degrades to the
generic "Time's up" at timeout (verified by test — no crash, no hang). A
`track.onended` handler showing "Microphone disconnected" would be kinder.
Denied/missing-device permission paths DO show a clear message (tested), though
the copy says "blocked" even when no device exists.

### 6. Accessibility (Lighthouse a11y: home 0.95, login 0.91)
- `color-contrast` failures on home + login (muted text on dark surfaces).
- `target-size` failures on login.
- The tuner meter has no ARIA (`role="meter"` + `aria-valuenow` suggested); the
  live cents readout is visual-only.
- A user who can't/won't use a mic can Skip pitch exercises but each skip costs
  a heart → singing lessons are effectively impassable without a mic. Consider
  a no-mic alternative path.

## Nits / future work

- `GET /api/stages` is unauthenticated. It returns only static curriculum
  (already shipped in the client JS), so no data exposure — but it's a free DB
  query for anonymous callers.
- No `AudioContext.resume()` fallback. Context is created inside the click
  handler (the accepted Safari/iOS pattern, asserted by test), but a
  belt-and-braces `resume()` after creation is cheap.
- CI runs lint + unit + build only. DB and E2E projects need a Postgres service
  container in the workflow (`docker-compose.test.yml` is ready for it).
- E2E drives non-pitch exercise steps via Skip; per-type UI drivers for the
  other 16 exercise components would deepen coverage.
- 10-minute real-browser memory soak not run; a 30-lifecycle resource-leak soak
  (contexts/tracks/RAF) runs in the component suite instead.

---

## What is covered

| Layer | Tests | What's protected |
|---|---|---|
| Unit (node) | 183 | Pitch/cents math vs hand-computed values, semitone-boundary rounding, octave folding, detector-error folding, leveling curve boundaries, date helpers, existing curriculum/gamification suites |
| Pitch detector | 8 | Real `pitchy` against synthetic sine/harmonics/noise/silence/truncated buffers |
| Component (jsdom) | 15 | PitchMatch full lifecycle with fake `AudioContext`/`getUserMedia`: pass, octave pass, out-of-tune fail, silence, noise, dropout grace, permission denied/missing/ignored, unmount cleanup, skip-during-prompt cleanup, 30-cycle leak soak |
| DB (real Postgres) | 43 | Streak day-boundaries/skip/clock-skew, XP first-pass-only + concurrent double-submit, hearts refill boundaries, mastery EMA/intervals/cold-start, route auth (401s), IDOR attempts, locked-lesson enforcement, validation rejection, registration hardening |
| E2E (Playwright, mocked mic at browser level) | 12 | Signup → onboarding → path; sign out/in state; full singing lesson pass with persistence across reload; out-of-tune fail → heart lost → weak concept recorded; refresh mid-lesson; streak across day boundary + gap reset; free play; protected-route redirects |

Coverage (unit+component+DB, statements): **lib/curriculum 92.8%, lib/music 88.9%,
lib/api 88.2%, progress route 73.5%, lib/db 61.8%; 43.8% overall.**

**Honest gaps:** Google OAuth (external), VexFlow rendering (visual),
`user/settings|password|profile|export|banner-color` routes (untested),
quests-claim full flow, leaderboards, daily-stage UI, section jump tests,
16 of 17 exercise components (only PitchMatch has component tests), real-device
Safari/iOS audio, concurrency load.

Infra: disposable Postgres (`docker-compose.test.yml`, port 54329) + `.env.test`;
`scripts/test-db.sh` migrates from empty + seeds deterministically (this also
proves migrations apply cleanly from scratch). E2E refuses to run against any
DB whose URL doesn't contain `tunebug_test`. No microphone hardware needed
anywhere: jsdom fakes for component tests, an init-script `AudioContext`/
`getUserMedia` fake with controllable sine generator for Playwright.

---

## Phase 7 — proof the tests have teeth

Each mutation was applied to **source**, the suite run, the failure observed,
then reverted (final tree verified clean against the pre-mutation state):

| # | Injected bug | Result |
|---|---|---|
| 1 | `foldedCents`: 1200 → 1000 cents/octave | **5 tests failed** (unit + component) ✓ |
| 2 | Pass threshold `>=` → `>` in progress route | threshold-boundary test failed ✓ |
| 3 | Streak guard `diff <= 0` → `diff < 0` (same-day reset) | **NOT caught initially** — the same-day test only covered day 1 where reset(1)==expected(1). Added a multi-day same-day test; mutation now caught ✓ |
| 4 | Auth gate disabled on progress POST | unauthenticated-401 test failed ✓ |
| 5 | `isLessonUnlocked` → always `true` | both lock tests failed ✓ (these also caught the *real* pre-existing bug before the fix) |
| 6 | Leveling `STEP*(level+1)` → `STEP*level` | threshold test failed ✓ |

Mutation 3 is the honest one: it exposed a weak assertion, which is exactly
what this phase is for.

---

## Design decisions confirmed (not bugs)

- **Octave-agnostic scoring** is intentional: 220 Hz and 880 Hz both satisfy an
  A4 target so singers use their own register (`foldedCents`, documented in
  code). Display still distinguishes A3/A5. Detector octave errors are thereby
  also neutralized, and a median-of-5 window swallows single-frame fifth/octave
  blips.
- **Enharmonics:** the app is sharps-only end to end (`NOTE_NAMES` has no
  flats; `noteStringToMidi` rejects `Db4`). No C#/Db split-key data bug is
  possible; asserted in mastery tests.
- **Free play requires login** — confirmed intended; asserted by E2E.
- The working tree's pre-existing security hardening (timing-safe login,
  expanded protected paths, CSP `upgrade-insecure-requests`, trusted-proxy
  X-Forwarded-For parsing) was treated as baseline and is exercised by the
  suite. It should be committed together with this work.

## Secrets scan

Production bundle (`.next/static`) grepped for DB URLs, `AUTH_*` values from
`.env.local`, service-role patterns, and `NEXT_PUBLIC_` variables: **nothing
found; zero `NEXT_PUBLIC_` vars exist in the codebase.** Dashboard data
fetching is batched (`Promise.all`, includes) — no N+1 detected.

## How to run

```bash
npm run verify        # typecheck + lint + unit/component + DB + E2E (needs Docker)
npm test              # unit + component only (no DB/Docker needed)
npm run test:db       # spins up test Postgres, migrates, seeds, runs DB suite
npm run test:e2e      # same DB prep, then Playwright (mic fully mocked)
npm run test:coverage # V8 coverage for unit + component
```
