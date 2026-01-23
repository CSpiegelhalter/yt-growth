export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { syncUserChannels } from "@/lib/sync-youtube";
import { checkChannelLimit } from "@/lib/with-entitlements";
import { createApiRoute } from "@/lib/api/route";
// Note: clearAccessTokenCache is only used for invalidating stale tokens, not after fresh OAuth

async function exchangeCode(code: string) {
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? process.env.GOOGLE_OAUTH_REDIRECT!;
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error("Token exchange failed");
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    id_token?: string;
  }>;
}

async function getUserInfo(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("userinfo fetch failed");
  return res.json() as Promise<{ sub: string; email?: string; name?: string }>;
}

/**
 * Test if the access token has Analytics access to a specific channel.
 * Returns true if access is granted, false otherwise.
 */
async function testAnalyticsAccess(
  accessToken: string,
  channelId: string
): Promise<{ ok: boolean; email?: string }> {
  // Make a minimal analytics query to test access
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
  url.searchParams.set("ids", `channel==${channelId}`);
  url.searchParams.set("startDate", weekAgo);
  url.searchParams.set("endDate", today);
  url.searchParams.set("metrics", "views");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  console.log(`[OAuth] Analytics access test for ${channelId}: ${res.status}`);

  return { ok: res.status === 200 };
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

      // Parse state - format is either "randomHex" or "randomHex:channelId"
      const [stateRandom, reconnectChannelId] = state.includes(":")
        ? [state.split(":")[0], state.split(":")[1]]
        : [state, null];

      const row = await prisma.oAuthState.findUnique({
        where: { state: stateRandom },
      });
      if (!row || row.expiresAt < new Date()) {
        return redirect(`/integrations/error?m=state&rid=${api.requestId}`);
      }

      // Only check channel limit when adding NEW channels, not reconnecting existing ones
      if (!reconnectChannelId) {
        const channelCheck = await checkChannelLimit(row.userId);
        if (!channelCheck.allowed) {
          await prisma.oAuthState.delete({ where: { state: stateRandom } });
          const limitMsg =
            channelCheck.plan === "FREE"
              ? `Free plan allows ${channelCheck.limit} channel. Upgrade to Pro for more.`
              : `You have reached the maximum of ${channelCheck.limit} channels.`;
          return redirect(
            `/dashboard?error=channel_limit&message=${encodeURIComponent(
              limitMsg
            )}&rid=${api.requestId}`
          );
        }
      }

      // consume state
      await prisma.oAuthState.delete({ where: { state: stateRandom } });

      const tok = await exchangeCode(code);
      const me = await getUserInfo(tok.access_token);
      const providerAccountId = me.sub;
      const tokenExpiresAt = new Date(Date.now() + tok.expires_in * 1000);
      const scopes = tok.scope ?? "";

      // If reconnecting a specific channel, verify the account has Analytics access
      if (reconnectChannelId) {
        const analyticsTest = await testAnalyticsAccess(
          tok.access_token,
          reconnectChannelId
        );
        if (!analyticsTest.ok) {
          console.log(
            `[OAuth] Account ${me.email} does NOT have Analytics access to ${reconnectChannelId}`
          );
          // Don't save this connection - redirect with error
          const errorMsg = encodeURIComponent(
            `The Google account "${
              me.email || "selected"
            }" doesn't have Analytics access to this YouTube channel. ` +
              `Please select the Google account that OWNS this channel (the one you use to log into YouTube Studio).`
          );
          return redirect(
            `/dashboard?error=wrong_account&message=${errorMsg}&channelId=${reconnectChannelId}&rid=${api.requestId}`
          );
        }
        console.log(
          `[OAuth] Account ${me.email} has Analytics access to ${reconnectChannelId} ✓`
        );
      }

      const googleAccount = await prisma.googleAccount.upsert({
        where: {
          provider_providerAccountId: { provider: "google", providerAccountId },
        },
        update: {
          userId: row.userId,
          tokenExpiresAt,
          scopes,
          accessTokenEnc: tok.access_token, // Store the fresh access token!
          ...(tok.refresh_token ? { refreshTokenEnc: tok.refresh_token } : {}),
          updatedAt: new Date(),
        },
        create: {
          userId: row.userId,
          provider: "google",
          providerAccountId,
          refreshTokenEnc: tok.refresh_token ?? null,
          accessTokenEnc: tok.access_token, // Store the fresh access token!
          scopes,
          tokenExpiresAt,
        },
      });

      // Clear the in-memory mutex (NOT the DB token - we just saved a fresh one!)
      // The clearAccessTokenCache function clears the DB token, which we don't want here
      // since we just stored a fresh one. We only need to clear the in-progress refresh mutex.
      // Note: The in-memory cache is worker-local, so this only affects this worker.

      // If reconnecting a specific channel, update its googleAccountId
      if (reconnectChannelId) {
        // Update the channel to use this GoogleAccount
        await prisma.channel.updateMany({
          where: {
            userId: row.userId,
            youtubeChannelId: reconnectChannelId,
          },
          data: { googleAccountId: googleAccount.id },
        });
      }

      await syncUserChannels(row.userId, googleAccount.id);

      // Redirect back to the channel they were reconnecting, or dashboard
      // For NEW channels (not reconnect), add newChannel=1 so the header auto-selects the new channel
      const redirectPath = reconnectChannelId
        ? `/dashboard?reconnected=1&channelId=${reconnectChannelId}&rid=${api.requestId}`
        : `/dashboard?newChannel=1&rid=${api.requestId}`;
      return redirect(redirectPath);
    } catch (err) {
      console.error("[OAuth Callback] Error:", err);
      return redirect(`/integrations/error?m=oauth&rid=${api.requestId}`);
    }
  }
);
