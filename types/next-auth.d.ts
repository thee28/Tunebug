import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      xp?: number;
    } & DefaultSession["user"];
  }
}
