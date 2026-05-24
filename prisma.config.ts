import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI doesn't auto-read .env.local — load it explicitly
config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL bypasses pgBouncer — required for migrations
    url: process.env.DIRECT_URL,
  },
});
