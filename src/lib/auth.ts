import "server-only";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/schemas";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

const DUMMY_HASH = "$2b$12$SrxgN4f1uLvVx3M8zOE8Le.MLsMsU4AFBa7aQ3GQG676J/bJs2yXe";

class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

class UnavailableSignin extends CredentialsSignin {
  code = "unavailable";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  logger: {
    error(error) {
      if (error.name === "JWTSessionError") return;
      console.error("[auth][error]", error.name);
    },
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();
        try {
          rateLimit(`login:${email}`, 10, 15 * 60 * 1000);
        } catch (error) {
          if (error instanceof AppError && error.code === "RATE_LIMITED") {
            throw new RateLimitedSignin();
          }
          throw new UnavailableSignin();
        }

        try {
          await connectDB();
          const user = await User.findOne({ email });
          const hash = user?.passwordHash ?? DUMMY_HASH;
          const matches = await bcrypt.compare(parsed.data.password, hash);
          if (!user || !matches || !user.isActive) return null;
          return { id: String(user._id), email: user.email, name: user.name };
        } catch (error) {
          console.error("Sign-in lookup failed", error instanceof Error ? error.name : "error");
          throw new UnavailableSignin();
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
