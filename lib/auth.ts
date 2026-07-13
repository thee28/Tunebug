import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

// A valid cost-12 bcrypt hash that no password matches. When the email has no
// account, we still run a comparison against this so the response time doesn't
// reveal whether the account exists (timing-based account enumeration).
const DUMMY_PASSWORD_HASH =
  "$2b$12$u62WUq9XbWCCEQl.6E0HR.Ch5YMB5qoVIfY4mhIVV.Yk8rMgiM56C";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // Always run a bcrypt comparison — against a dummy hash when the user
        // or its password is missing — so timing is constant whether or not the
        // account exists. Prevents account enumeration via response timing.
        const valid = await bcrypt.compare(
          credentials.password as string,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH
        );

        if (!user?.passwordHash || !valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
  },
});
