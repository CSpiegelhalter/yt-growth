import "server-only";

import type { Account, NextAuthOptions, Profile, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { compare } from "@/lib/shared/crypto";
import { logger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

import { verifyEmailToken } from "./jwt";

// Determine if we're in development (localhost)
const isDev = process.env.NODE_ENV === "development";
const useSecureCookies = !isDev;

async function findOrCreateGoogleUser(
  email: string,
  name: string | null | undefined,
  profileName: string | null | undefined,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) { return existing; }

  try {
    const created = await prisma.user.create({
      data: { email, name: name ?? profileName ?? null },
    });
    logger.info("auth.google.new_user", { userId: created.id });
    return created;
  } catch (error: unknown) {
    const prismaError = error as Error & { code?: string };
    if (prismaError?.code !== "P2002") { throw error; }

    const raceWinner = await prisma.user.findUnique({ where: { email } });
    if (!raceWinner) { throw new Error("Failed to create or find user"); }
    logger.info("auth.google.user_found_after_race", { userId: raceWinner.id });
    return raceWinner;
  }
}

async function upsertGoogleAccount(
  dbUserId: number,
  providerAccountId: string,
  refreshToken: string | null,
  scopes: string,
  tokenExpiresAt: Date | null,
) {
  await prisma.googleAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId,
      },
    },
    update: {
      userId: dbUserId,
      tokenExpiresAt,
      scopes,
      ...(refreshToken ? { refreshTokenEnc: refreshToken } : {}),
      updatedAt: new Date(),
    },
    create: {
      userId: dbUserId,
      provider: "google",
      providerAccountId,
      refreshTokenEnc: refreshToken,
      scopes,
      tokenExpiresAt,
    },
  });
}

async function handleGoogleSignIn(
  user: User,
  account: Account,
  profile: Profile | undefined,
) {
  const providerAccountId = account.providerAccountId ?? profile?.sub ?? "";
  const refreshToken = account.refresh_token ?? null;
  const scopes = (account.scope as string | undefined) ?? "";
  const tokenExpiresAt = account.expires_at
    ? new Date(account.expires_at * 1000)
    : null;

  const dbUser = await findOrCreateGoogleUser(user.email!, user.name, profile?.name);
  await upsertGoogleAccount(dbUser.id, providerAccountId, refreshToken, scopes, tokenExpiresAt);
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30d
  pages: { signIn: "/auth/login", error: "/auth/login" },

  // Cookie configuration for proper OAuth state handling
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${useSecureCookies ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `${
        useSecureCookies ? "__Secure-" : ""
      }next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes
      },
    },
    state: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes
      },
    },
    nonce: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },

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
        if (!creds?.email || !creds?.password)
          {throw new Error("Missing credentials");}

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
        });
        if (!user || !user.passwordHash) {throw new Error("Invalid credentials");}

        const ok = await compare(creds.password, user.passwordHash);
        if (!ok) {throw new Error("Invalid credentials");}

        logger.info("auth.login.ok", { userId: user.id });
        return {
          id: String(user.id),
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),

    // 2) Email verification "token" login (single-use link)
    Credentials({
      id: "token",
      name: "Email Token",
      credentials: { token: { label: "Token", type: "text" } },
      authorize: async (creds) => {
        if (!creds?.token) {throw new Error("Token missing");}
        const { id, email } = verifyEmailToken(creds.token);

        logger.info("auth.email_token.verified", { userId: id });
        return { id: String(id), email, name: undefined };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Don't force consent every time - Google will only prompt if needed
          prompt: "select_account",
          // Only request basic profile info for signup/login
          // YouTube API scopes are requested separately via /api/integrations/google/start
          // when the user clicks to connect their YouTube channel
          scope: ["openid", "email", "profile"].join(" "),
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // For Google OAuth, user.id is the Google sub (a huge number), not our DB id.
      // We need to look up the actual database user ID by email.
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true },
        });
        if (dbUser) {
          token.uid = String(dbUser.id);
        } else if (account?.provider !== "google") {
          // For non-Google providers, use the provided ID if no DB user found yet
          token.uid = user.id;
        }
        // For Google OAuth without existing user, signIn callback will create user
        // and next token refresh will pick up the correct ID
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as typeof session.user & { id?: string }).id = token.uid as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user?.email) {
        await handleGoogleSignIn(user, account, profile);
      }
      return true;
    },
  },
};
