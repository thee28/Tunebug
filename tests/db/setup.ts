import { config as dotenv } from "dotenv";
import path from "path";

// Force the test database URL BEFORE lib/prisma is imported anywhere.
// override:true because a stray DATABASE_URL in the shell must never win.
dotenv({ path: path.resolve(__dirname, "../../.env.test"), override: true });

if (!process.env.DATABASE_URL?.includes("tunebug_test")) {
  throw new Error(
    "DB tests refused to run: DATABASE_URL is not the tunebug_test database"
  );
}
