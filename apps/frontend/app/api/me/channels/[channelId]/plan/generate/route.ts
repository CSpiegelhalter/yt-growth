import { prisma } from "@/prisma";
import { ApiError, asApiResponse } from "@/lib/http";
import { ensureSubscribed, requireUserContext } from "@/lib/server-user";
import { generatePlanMarkdown } from "@/lib/llm";
import { z } from "zod";

const bodySchema = z
  .object({
    force: z.boolean().optional(),
    niche: z.string().optional(),
    competitors: z.array(z.string()).optional(),
  })
  .optional();

export async function POST(req: Request, { params }: { params: { channelId: string } }) {
  try {
    const ctx = await requireUserContext();
    ensureSubscribed(ctx.isSubscribed);

    const channelId = Number(params.channelId);
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel || channel.userId !== ctx.user.id) throw new ApiError(404, "Channel not found");

    const body = bodySchema.safeParse(await req.json().catch(() => ({} as any)));
    const force = body.success ? body.data?.force : false;
    const niche = body.success ? body.data?.niche : undefined;
    const competitors = body.success ? body.data?.competitors ?? [] : [];

    const existing = await prisma.plan.findFirst({
      where: { channelId, userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });
    const now = new Date();
    if (!force && existing?.cachedUntil && existing.cachedUntil > now) {
      return Response.json({ cached: true, plan: existing });
    }

    const metrics = await prisma.videoMetric.findMany({
      where: { channelId, userId: ctx.user.id },
      orderBy: { fetchedAt: "desc" },
      include: { Video: true },
      take: 10,
    });

    const planMd = await generatePlanMarkdown({
      channelTitle: channel.title,
      niche,
      competitors,
      recentStats: metrics.map((m) => ({
        title: m.Video?.title,
        views: m.viewCount ?? undefined,
        avgViewDuration: m.averageViewDuration ?? undefined,
      })),
    });

    const plan = await prisma.plan.create({
      data: {
        userId: ctx.user.id,
        channelId: channel.id,
        outputMarkdown: planMd,
        inputsJson: { niche, competitors },
        modelVersion: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        cachedUntil: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    });

    await prisma.channel.update({
      where: { id: channel.id },
      data: { lastPlanGeneratedAt: now },
    });

    return Response.json({ cached: false, plan });
  } catch (err) {
    return asApiResponse(err);
  }
}
