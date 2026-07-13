import { Client } from "pg";
import { config as dotenv } from "dotenv";
import path from "path";

dotenv({ path: path.resolve(__dirname, "../../.env.test") });

const TEST_DB_MARKER = "tunebug_test";

// Wipe all user-generated state before the E2E run. Curriculum tables
// (Stage/Unit/Lesson) stay — they're seeded once by scripts/test-db.sh.
export default async function globalSetup() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes(TEST_DB_MARKER)) {
    throw new Error(
      `Refusing to truncate: DATABASE_URL does not look like the test DB (${url})`
    );
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(
      `TRUNCATE "User", "Account", "Session", "VerificationToken",
               "LessonProgress", "DailyStreak", "Achievement",
               "ConceptMastery", "DailyStage", "QuestClaim" CASCADE`
    );
  } finally {
    await client.end();
  }
}
