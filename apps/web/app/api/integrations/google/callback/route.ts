export const runtime = "nodejs";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { syncUserChannels } from "@/lib/sync-youtube";
import { checkChannelLimit } from "@/lib/with-entitlements";
import { createApiRoute } from "@/lib/api/route";
import { googleOAuthAdapter } from "@/lib/adapters/google";

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

      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ?? process.env.GOOGLE_OAUTH_REDIRECT!;
      const tok = await googleOAuthAdapter.exchangeCode(code, redirectUri);
      const me = await googleOAuthAdapter.getUserInfo(tok.accessToken);
      const providerAccountId = me.providerAccountId;
      const tokenExpiresAt = new Date(Date.now() + tok.expiresIn * 1000);
      const scopes = tok.scope ?? "";

      // If reconnecting a specific channel, verify the account has Analytics access
      if (reconnectChannelId) {
        const analyticsTest = await googleOAuthAdapter.verifyAnalyticsAccess(
          tok.accessToken,
          reconnectChannelId,
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
          accessTokenEnc: tok.accessToken,
          ...(tok.refreshToken ? { refreshTokenEnc: tok.refreshToken } : {}),
          updatedAt: new Date(),
        },
        create: {
          userId: row.userId,
          provider: "google",
          providerAccountId,
          refreshTokenEnc: tok.refreshToken ?? null,
          accessTokenEnc: tok.accessToken,
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
