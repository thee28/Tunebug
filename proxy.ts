import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export function proxy(request: NextRequest) {
  // NextAuth's middleware overload expects its own NextAuthRequest shape.
  return auth(request as never);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
