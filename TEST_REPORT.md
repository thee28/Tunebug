# Tunebug Pre-Deployment Test Report

Date: 2026-07-13 (updated after the fix pass)
Suite: `npm run verify` → typecheck + lint + 199 unit/component + 46 DB + 12 E2E = **257 tests, all green**.

---

## Verdict: **GO**

Every previously flagged should-fix item is now fixed and covered by tests or a
Lighthouse re-run. Remaining known limitations are listed at the bottom — none
blocks deploy.

---

## Fixed in the audit + fix pass

### Blockers (found by the test suite, fixed immediately)
1. **Locked lessons completable via direct API call** — `POST /api/progress`
   now enforces `isLessonUnlocked()` server-side → 403. Mutation-verified.
2. **Debug tool shipped to production** — `DebugExercisePicker` is dev-gated;
   verified absent from the production build in a browser.

### Should-fixes (all fixed in the follow-up pass)
3. **Streak timezone bug** — `User.timezone` column added (IANA id, default
   UTC), captured during onboarding from the browser, validated server-side
   (`isValidTimezone`), and `updateStreak` now computes day boundaries in the
   user's zone (`dayMarkerInTZ`). Tests: 11:58 PM → 12:02 AM local increments
   even inside one UTC day; crossing UTC midnight mid-local-afternoon does NOT
   double-count; garbage timezones fall back to UTC.
4. **Cents meter re-rendered React ~60×/s** — per-frame visuals (needle
   position/color, cents readout, hint text, hold-progress ring) are now
   painted directly from the RAF loop via refs; React state changes only on
   transitions (note name, in-tune flag, whole seconds, phase). All 16
   component tests pass unchanged behavior.
5. **Landing LCP 22.4 s** — the full 3.9 MB Material Symbols font is now
   subset via `icon_names` to the 58 glyphs the app uses (~8 KB).
   Lighthouse: home perf 0.74 → **0.90**, LCP 22.4 s → **3.5 s** (simulated
   slow 4G). Dashboard visually verified — every icon renders.
   *Maintenance note: new icons must be appended (alphabetically) to the
   `icon_names` list in [app/layout.tsx](app/layout.tsx).*
6. **Mic failure UX** — dedicated messages per failure: permission denied,
   no device found (`NotFoundError`), and mid-exercise disconnect
   (`track.onended` → "microphone disconnected" + Try Again, resources
   released). A silent-but-live track still times out gracefully.
7. **Accessibility** — Lighthouse a11y now **1.0 on home and login** (was
   0.95/0.91): low-contrast grays raised to ≥4.5:1, "Forgot?" tap target
   enlarged to ≥24px. The tuner meter has `role="meter"` +
   `aria-valuenow` (updated per frame) + label. `AudioContext.resume()`
   belt-and-braces added for Safari.
8. **`GET /api/stages`** now requires a session (it had no callers client-side).
9. **CI** now runs typecheck + unit/component + DB + E2E against a Postgres
   service container, then builds ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

---

## Remaining known limitations (accepted, not blockers)

- **In-memory rate limiter** resets on serverless cold starts. bcrypt cost 12
  plus per-IP limits still slow brute force substantially; move to a KV-backed
  limiter when convenient.
- **No-mic users** can Skip pitch exercises but each skip costs a heart, so
  singing lessons effectively require a mic. Product decision, documented.
- **Not covered by tests:** Google OAuth (external), VexFlow rendering
  (visual), `user/settings|password|profile|export|banner-color` routes,
  quests/leaderboards/daily-stage UI flows, 16 of 17 exercise components
  (only PitchMatch has component tests; others are exercised only incidentally
  in E2E), real-device Safari/iOS audio, concurrency load.
- Existing users created before the timezone column keep UTC day-boundaries
  until they re-onboard (app is pre-launch, so this set is empty in prod).

---

## What is covered

| Layer | Tests | What's protected |
|---|---|---|
| Unit (node) | 184 | Pitch/cents math vs hand-computed values, semitone-boundary rounding, octave folding, detector-error folding, leveling curve boundaries, date/TZ helpers, curriculum/gamification suites |
| Pitch detector | 8 | Real `pitchy` against synthetic sine/harmonics/noise/silence/truncated buffers |
| Component (jsdom) | 16 | PitchMatch lifecycle with fake `AudioContext`/`getUserMedia`: pass, octave pass, out-of-tune fail, silence, noise, dropout grace, permission denied / no device / prompt ignored / mid-exercise disconnect, unmount cleanup, skip-during-prompt cleanup, 30-cycle leak soak |
| DB (real Postgres) | 46 | Streak day-boundaries incl. user-timezone cases, XP first-pass-only + concurrent double-submit, hearts refill boundaries, mastery EMA/cold-start, route auth (401s), IDOR attempts, locked-lesson enforcement, validation rejection, registration hardening |
| E2E (Playwright, mocked mic) | 12 | Signup → onboarding → path; sign out/in; full singing lesson pass with persistence across reload; out-of-tune fail → heart lost → weak concept recorded; refresh mid-lesson; streak day-boundary + gap reset; free play; protected-route redirects |

Infra: disposable Postgres (`docker-compose.test.yml`, port 54329; CI uses a
service container via `TEST_DB_SKIP_DOCKER=1`) + `.env.test` (dummy localhost
values — must be committed). Tests refuse to run against any DB whose URL
doesn't contain `tunebug_test`. No microphone hardware needed anywhere.

## Phase 7 — proof the tests have teeth

Six mutations were injected into source, the failure observed, then reverted:

| # | Injected bug | Result |
|---|---|---|
| 1 | `foldedCents`: 1200 → 1000 cents/octave | 5 tests failed ✓ |
| 2 | Pass threshold `>=` → `>` | threshold-boundary test failed ✓ |
| 3 | Streak guard `diff <= 0` → `diff < 0` | initially NOT caught — weak test found, strengthened (multi-day same-day case), then caught ✓ |
| 4 | Auth gate disabled on progress POST | 401 test failed ✓ |
| 5 | `isLessonUnlocked` → always `true` | both lock tests failed ✓ |
| 6 | Leveling `STEP*(level+1)` → `STEP*level` | threshold test failed ✓ |

## Design decisions confirmed (not bugs)

- **Octave-agnostic pitch scoring** (220 Hz satisfies an A4 target) — singers
  use their own register; display still distinguishes octaves.
- **Sharps-only note naming** end to end — no enharmonic split-key data bug is
  possible.
- **Free play requires login** — confirmed intended.

## Secrets scan

Production bundle greped for DB URLs, `.env.local` values, service-role
patterns, `NEXT_PUBLIC_` vars: nothing found. Dashboard queries batched — no
N+1.

## How to run

```bash
npm run verify        # typecheck + lint + unit/component + DB + E2E (needs Docker)
npm test              # unit + component only (no DB/Docker needed)
npm run test:db       # spins up test Postgres, migrates, seeds, runs DB suite
npm run test:e2e      # same DB prep, then Playwright (mic fully mocked)
npm run test:coverage # V8 coverage for unit + component
```
