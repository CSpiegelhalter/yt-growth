import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/prisma";
import { compare } from "@/lib/shared/crypto";
import { verifyEmailToken } from "./jwt";
import { logger } from "@/lib/shared/logger";
import Google from "next-auth/providers/google";

// Determine if we're in development (localhost)
const isDev = process.env.NODE_ENV === "development";
const useSecureCookies = !isDev;

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
          throw new Error("Missing credentials");

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
        });
        if (!user || !user.passwordHash) throw new Error("Invalid credentials");

        const ok = await compare(creds.password, user.passwordHash);
        if (!ok) throw new Error("Invalid credentials");

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
        if (!creds?.token) throw new Error("Token missing");
        const { id, email } = verifyEmailToken(creds.token);

        logger.info("auth.email_token.verified", { userId: id });
        return { id: String(id), email: email, name: undefined };
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
      if (session.user && token.uid) (session.user as any).id = token.uid;
      return session;
    },
    async signIn({ user, account, profile }) {
      // For Google OAuth, persist (or update) tokens for later worker use.
      if (account?.provider === "google" && user?.email) {
        const providerAccountId =
          account.providerAccountId ?? profile?.sub ?? "";
        // Note: refresh_token is only returned on first consent or if revoked/expired.
        const refreshToken = account.refresh_token ?? null;
        const scopes = (account.scope as string | undefined) ?? "";
        const tokenExpiresAt = account.expires_at
          ? new Date(account.expires_at * 1000)
          : null;

        // Find or create the user
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser) {
          // Create new user for Google OAuth sign-in
          try {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name ?? profile?.name ?? null,
              },
            });
            logger.info("auth.google.new_user", { userId: dbUser.id });
          } catch (error: any) {
            // Handle race condition - user was created by another concurrent request
            if (error?.code === "P2002") {
              dbUser = await prisma.user.findUnique({
                where: { email: user.email },
              });
              if (!dbUser) {
                throw new Error("Failed to create or find user");
              }
              logger.info("auth.google.user_found_after_race", {
                userId: dbUser.id,
              });
            } else {
              throw error;
            }
          }
        }

        // Upsert into GoogleAccount table
        await prisma.googleAccount.upsert({
          where: {
            // unique on (provider, providerAccountId)
            provider_providerAccountId: {
              provider: "google",
              providerAccountId,
            },
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
      return true;
    },
  },
};
