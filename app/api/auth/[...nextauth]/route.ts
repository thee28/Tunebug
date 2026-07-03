import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/api/rateLimit";

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  // Brute-force guard on password login only; other NextAuth POSTs pass through.
  if (request.nextUrl.pathname.endsWith("/callback/credentials")) {
    if (!rateLimit(`login:${clientIp(request)}`, 10, 15 * 60_000)) {
      return tooManyRequests();
    }
  }
  return handlers.POST(request);
}
