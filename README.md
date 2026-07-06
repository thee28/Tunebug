# Tunebug

A gamified music-theory and ear-training web app — think Duolingo for music.
Learn notes, intervals, rhythm, and pitch through short lessons, daily
challenges, streaks, XP, quests, and weekly leaderboards.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **PostgreSQL** via Prisma 7
- **NextAuth v5** — email/password (bcrypt) and Google OAuth
- **Tone.js** for audio playback, **pitchy** for microphone pitch detection,
  **VexFlow** for staff notation
- Tailwind CSS 4 + Framer Motion
- Vitest for unit tests

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values (a local or
   hosted PostgreSQL database, an `AUTH_SECRET`, and optionally Google OAuth
   credentials).

3. Set up the database:

   ```bash
   npm run db:migrate   # apply migrations
   npm run db:seed      # load the curriculum (stages, units, lessons)
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Run the Vitest suite |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:seed` | Seed the curriculum |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Architecture notes

- `app/` — routes. Server components fetch data and pass serialisable props to
  client components. API routes live under `app/api/`.
- `lib/curriculum/` — lesson/exercise generation: seeded RNG, concept slot
  generator, spaced-repetition mastery model, free-practice session builder.
- `lib/db/` — Prisma query helpers (progress, streaks, quests, achievements,
  leaderboard, daily stages).
- `components/exercises/` — the 20 exercise types plus the lesson/stage
  runners. The pitch-match exercise uses the microphone (requires a secure
  context: localhost or HTTPS).
- `lib/api/rateLimit.ts` — in-memory fixed-window rate limiter. Fine for a
  single-node deployment; swap for a shared store (e.g. Upstash Redis) before
  scaling horizontally.

## Deployment

Any Node-compatible host works (Vercel is the path of least resistance).
Checklist:

1. Provision PostgreSQL and set `DATABASE_URL` / `DIRECT_URL`.
2. Set `AUTH_SECRET` (generate a fresh one per environment) and `AUTH_URL` to
   the public URL.
3. Set Google OAuth credentials and add the deployment's callback URL
   (`https://<domain>/api/auth/callback/google`) in the Google console, or
   omit them to run with email/password only.
4. Run migrations against the production database:
   `npx prisma migrate deploy`
5. Seed the curriculum once: `npm run db:seed`.

The app serves everything over standard HTTP(S) — no websockets, no
background workers.
