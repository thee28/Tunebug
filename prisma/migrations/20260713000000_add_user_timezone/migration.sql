-- Streak day boundaries are computed in the user's own timezone.
ALTER TABLE "User" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';
