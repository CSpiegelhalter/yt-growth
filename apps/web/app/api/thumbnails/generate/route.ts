import type { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { GenerateThumbnailBodySchema } from "@/lib/features/thumbnails/schemas";
import { generateThumbnail } from "@/lib/features/thumbnails";
import {
  createPrediction,
  verifyModelVersion,
} from "@/lib/adapters/replicate";
import { callLLM } from "@/lib/llm";
import { getAppBaseUrl } from "@/lib/server/url";

export const runtime = "nodejs";

export const POST = createApiRoute(
  { route: "/api/thumbnails/generate" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      {
        operation: "thumbnailGenerateV2",
        identifier: (api) => api.userId,
      },
      withValidation(
        { body: GenerateThumbnailBodySchema },
        async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
          void ctx;
          const body = validated.body!;
          const result = await generateThumbnail(
            {
              userId: api.userId!,
              style: body.style,
              prompt: body.prompt,
              includeIdentity: body.includeIdentity,
              identityModelId: body.identityModelId,
              variants: body.variants,
              webhookUrl: `${getAppBaseUrl(req)}/api/webhooks/replicate`,
            },
            {
              replicate: { createPrediction, verifyModelVersion },
              llm: {
                async complete(params) {
                  const r = await callLLM(
                    params.messages.map((m) => ({
                      role: m.role,
                      content: m.content,
                    })),
                    {
                      temperature: params.temperature,
                      maxTokens: params.maxTokens,
                      responseFormat: "json_object",
                    },
                  );
                  return {
                    content: r.content,
                    tokensUsed: r.tokensUsed,
                    model: r.model,
                  };
                },
              },
            },
          );
          return jsonOk(result, { requestId: api.requestId });
        },
      ),
    ),
  ),
);
