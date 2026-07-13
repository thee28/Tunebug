import { defineConfig } from "@playwright/test";
import { config as dotenv } from "dotenv";
import path from "path";

// E2E always runs against the disposable test DB (.env.test), never .env.local.
dotenv({ path: path.resolve(__dirname, ".env.test") });

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  // Tests share one DB; run serially so state stays deterministic.
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    permissions: ["microphone"],
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL!,
      DIRECT_URL: process.env.DIRECT_URL!,
      AUTH_SECRET: process.env.AUTH_SECRET!,
      AUTH_TRUST_HOST: "true",
      // Must beat any AUTH_URL in .env.local, or auth redirects leave :3100.
      AUTH_URL: "http://localhost:3100",
      NEXTAUTH_URL: "http://localhost:3100",
    },
  },
});
