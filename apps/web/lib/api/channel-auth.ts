import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";
import { channelParamsSchema } from "@/lib/competitors/video-detail/validation";

type AuthChannelOk = { ok: true; user: { id: number }; channelId: string };
type AuthChannelErr = { ok: false; response: Response };
export type AuthChannelResult = AuthChannelOk | AuthChannelErr;

/**
 * Shared auth + channel-param validation for /api/me/channels/[channelId]/** routes.
 *
 * Returns the authenticated user and the parsed `channelId` param, or
 * a ready-made error Response (401 / 400). Callers still perform their
 * own channel ownership query so they can customise select/include.
 */
export async function authenticateAndParseChannel(
  params: Promise<{ channelId: string }>,
): Promise<AuthChannelResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const paramsObj = await params;
  const parsed = channelParamsSchema.safeParse(paramsObj);
  if (!parsed.success) {
    return { ok: false, response: Response.json({ error: "Invalid channel ID" }, { status: 400 }) };
  }

  return { ok: true, user, channelId: parsed.data.channelId };
}

/**
 * Full auth + ownership check. Returns user + channel or an error Response.
 * Use when you only need to confirm ownership without custom select/include.
 */
export async function requireOwnedChannel(
  params: Promise<{ channelId: string }>,
) {
  const auth = await authenticateAndParseChannel(params);
  if (!auth.ok) return auth;

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: auth.channelId, userId: auth.user.id },
  });

  if (!channel) {
    return { ok: false, response: Response.json({ error: "Channel not found" }, { status: 404 }) } as AuthChannelErr;
  }

  return { ok: true as const, user: auth.user, channel };
}
