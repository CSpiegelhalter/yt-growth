import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { cookies, headers } from "next/headers";
import { prisma } from "@/prisma";
import { compare } from "@/lib/crypto";
import { issueEmailToken, verifyEmailToken } from "@/lib/jwt";
import { log } from "@/lib/logger";
import Google from "next-auth/providers/google";


export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30d
  pages: { signIn: "/auth/login", error: "/auth/login" },

  providers: [
    // 1) Email+Password login
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const ip = headers().get("x-forwarded-for") ?? "unknown";

        if (!creds?.email || !creds?.password) throw new Error("Missing credentials");

        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user || !user.passwordHash) throw new Error("Invalid credentials");

        const ok = await compare(creds.password, user.passwordHash);
        if (!ok) throw new Error("Invalid credentials");

        log("login ok", user.id, user.email);
        return { id: String(user.id), email: user.email, name: user.name ?? undefined };
      },
    }),

    // 2) Email verification “token” login (single-use link)
    Credentials({
      id: "token",
      name: "Email Token",
      credentials: { token: { label: "Token", type: "text" } },
      authorize: async (creds) => {
        const ip = headers().get("x-forwarded-for") ?? "unknown";

        if (!creds?.token) throw new Error("Token missing");
        const { id, email } = verifyEmailToken(creds.token);
     
        log("email verified", id, email);
        return { id: String(id), email: email, name: name ?? undefined };
      },
    }),
    Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            // Request offline access + force consent on first connect so we get refresh_token
            access_type: "offline",
            prompt: "consent",
            // YouTube scopes (add monetary if you need revenue metrics)
            scope: [
              "openid",
              "email",
              "profile",
              "https://www.googleapis.com/auth/youtube.readonly",
              "https://www.googleapis.com/auth/yt-analytics.readonly",
              // "https://www.googleapis.com/auth/yt-analytics-monetary.readonly", // optional
            ].join(" "),
          },
        },
      }),
  
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id; // persist uid
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) (session.user as any).id = token.uid;
      return session;
    },
    async signIn({ user, account, profile }) {
        // For Google OAuth, persist (or update) tokens for later worker use.
        if (account?.provider === "google" && user?.email) {
          const providerAccountId = account.providerAccountId ?? profile?.sub ?? "";
          // Note: refresh_token is only returned on first consent or if revoked/expired.
          const refreshToken = account.refresh_token ?? null;
          const scopes = (account.scope as string | undefined) ?? "";
          const tokenExpiresAt = account.expires_at
            ? new Date(account.expires_at * 1000)
            : null;
  
          // Ensure we know the app user id:
          const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          if (dbUser) {
            // Upsert into your GoogleAccount table
            await prisma.googleAccount.upsert({
              where: {
                // unique on (provider, providerAccountId)
                provider_providerAccountId: { provider: "google", providerAccountId },
              },
              update: {
                userId: dbUser.id,
                tokenExpiresAt,
                scopes,
                // store refreshToken only if present to avoid overwriting a good one with null
                ...(refreshToken ? { refreshTokenEnc: refreshToken } : {}),
                updatedAt: new Date(),
              },
              create: {
                userId: dbUser.id,
                provider: "google",
                providerAccountId,
                refreshTokenEnc: refreshToken,
                scopes,
                tokenExpiresAt,
              },
            });
          }
        }
        return true;
      },  
  },
};
