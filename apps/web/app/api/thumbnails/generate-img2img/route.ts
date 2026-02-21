import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { GenerateImg2ImgBodySchema } from "@/lib/features/thumbnails/schemas";
import { generateImg2Img } from "@/lib/features/thumbnails";
import { createPrediction } from "@/lib/adapters/replicate";
import { getAppBaseUrl } from "@/lib/server/url";

export const runtime = "nodejs";

export const POST = createApiRoute(
  { route: "/api/thumbnails/generate-img2img" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      {
        operation: "thumbnailImg2Img",
        identifier: (api) => api.userId,
      },
      withValidation(
        { body: GenerateImg2ImgBodySchema },
        async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
          void ctx;
          const body = validated.body!;
          const result = await generateImg2Img(
            {
              userId: api.userId!,
              inputImageUrl: body.inputImageUrl,
              parentJobId: body.parentJobId,
              prompt: body.prompt,
              strength: body.strength,
              webhookUrl: `${getAppBaseUrl(req)}/api/webhooks/replicate`,
            },
            {
              replicate: { createPrediction },
            },
          );
          return jsonOk(result, { requestId: api.requestId });
        },
      ),
    ),
  ),
);
