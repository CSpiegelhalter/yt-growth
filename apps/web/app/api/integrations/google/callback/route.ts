import { type NextRequest, NextResponse } from "next/server";

import { googleOAuthAdapter } from "@/lib/adapters/google";
import { createApiRoute } from "@/lib/api/route";
import { syncUserChannels } from "@/lib/sync-youtube";
import { checkChannelLimit } from "@/lib/with-entitlements";
import { prisma } from "@/prisma";

export const runtime = "nodejs";

function parseOAuthState(state: string): [string, string | null] {
  if (state.includes(":")) {
    return [state.split(":")[0], state.split(":")[1]];
  }
  return [state, null];
}

async function validateAndConsumeState(stateRandom: string) {
  const row = await prisma.oAuthState.findUnique({ where: { state: stateRandom } });
  if (!row || row.expiresAt < new Date()) {return null;}
  await prisma.oAuthState.delete({ where: { state: stateRandom } });
  return row;
}

function buildChannelLimitMessage(plan: string, limit: number): string {
  return plan === "FREE"
    ? `Free plan allows ${limit} channel. Upgrade to Pro for more.`
    : `You have reached the maximum of ${limit} channels.`;
}

async function verifyAnalyticsForReconnect(
  accessToken: string,
  email: string | undefined,
  channelId: string,
): Promise<string | null> {
  const analyticsTest = await googleOAuthAdapter.verifyAnalyticsAccess(accessToken, channelId);
  if (analyticsTest.ok) {
    console.log(`[OAuth] Account ${email} has Analytics access to ${channelId}`);
    return null;
  }

  console.log(`[OAuth] Account ${email} does NOT have Analytics access to ${channelId}`);
  return encodeURIComponent(
    `The Google account "${email || "selected"}" doesn't have Analytics access to this YouTube channel. ` +
    `Please select the Google account that OWNS this channel (the one you use to log into YouTube Studio).`
  );
}

async function upsertGoogleAccountAndSync(
  userId: number,
  providerAccountId: string,
  tok: { accessToken: string; refreshToken?: string; expiresIn: number; scope?: string },
  reconnectChannelId: string | null,
) {
  const tokenExpiresAt = new Date(Date.now() + tok.expiresIn * 1000);
  const scopes = tok.scope ?? "";

  const googleAccount = await prisma.googleAccount.upsert({
    where: {
      provider_providerAccountId: { provider: "google", providerAccountId },
    },
    update: {
      userId,
      tokenExpiresAt,
      scopes,
      accessTokenEnc: tok.accessToken,
      ...(tok.refreshToken ? { refreshTokenEnc: tok.refreshToken } : {}),
      updatedAt: new Date(),
    },
    create: {
      userId,
      provider: "google",
      providerAccountId,
      refreshTokenEnc: tok.refreshToken ?? null,
      accessTokenEnc: tok.accessToken,
      scopes,
      tokenExpiresAt,
    },
  });

  if (reconnectChannelId) {
    await prisma.channel.updateMany({
      where: { userId, youtubeChannelId: reconnectChannelId },
      data: { googleAccountId: googleAccount.id },
    });
  }

  await syncUserChannels(userId, googleAccount.id);
}

export const GET = createApiRoute(
  { route: "/api/integrations/google/callback" },
  async (req: NextRequest, _ctx, api) => {
    const url = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || url.origin;
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const redirect = (path: string) => {
      const res = NextResponse.redirect(new URL(path, baseUrl));
      res.headers.set("x-request-id", api.requestId);
      return res;
    };

    try {
      if (!code || !state) {
        return redirect(`/integrations/error?m=missing&rid=${api.requestId}`);
      }

      const [stateRandom, reconnectChannelId] = parseOAuthState(state);

      const row = await validateAndConsumeState(stateRandom);
      if (!row) {
        return redirect(`/integrations/error?m=state&rid=${api.requestId}`);
      }

      if (!reconnectChannelId) {
        const channelCheck = await checkChannelLimit(row.userId);
        if (!channelCheck.allowed) {
          const limitMsg = buildChannelLimitMessage(channelCheck.plan, channelCheck.limit);
          return redirect(
            `/dashboard?error=channel_limit&message=${encodeURIComponent(limitMsg)}&rid=${api.requestId}`
          );
        }
      }

      const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? process.env.GOOGLE_OAUTH_REDIRECT!;
      const tok = await googleOAuthAdapter.exchangeCode(code, redirectUri);
      const me = await googleOAuthAdapter.getUserInfo(tok.accessToken);

      if (reconnectChannelId) {
        const errorMsg = await verifyAnalyticsForReconnect(tok.accessToken, me.email, reconnectChannelId);
        if (errorMsg) {
          return redirect(
            `/dashboard?error=wrong_account&message=${errorMsg}&channelId=${reconnectChannelId}&rid=${api.requestId}`
          );
        }
      }

      await upsertGoogleAccountAndSync(row.userId, me.providerAccountId, tok, reconnectChannelId);

      const redirectPath = reconnectChannelId
        ? `/dashboard?reconnected=1&channelId=${reconnectChannelId}&rid=${api.requestId}`
        : `/dashboard?newChannel=1&rid=${api.requestId}`;
      return redirect(redirectPath);
    } catch (error) {
      console.error("[OAuth Callback] Error:", error);
      return redirect(`/integrations/error?m=oauth&rid=${api.requestId}`);
    }
  }
);
