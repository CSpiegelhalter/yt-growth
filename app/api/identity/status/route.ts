import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { prisma } from "@/prisma";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

export const GET = createApiRoute(
  { route: "/api/identity/status" },
  withAuth(
    { mode: "required" },
    async (_req: NextRequest, ctx, api: ApiAuthContext) => {
      void ctx;
      const userId = api.userId!;

      // Get uploaded photos (uncommitted assets that can be used for training)
      const photos = await prisma.userTrainingAsset.findMany({
        where: { userId, identityModelId: null },
        select: {
          id: true,
          s3KeyOriginal: true,
          width: true,
          height: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      // Generate public URLs for the photos
      const storage = getStorage();
      const photosWithUrls = photos.map((p) => {
        let url: string | null = null;
        if (p.s3KeyOriginal && p.s3KeyOriginal !== "pending") {
          try {
            url = storage.getPublicUrl(p.s3KeyOriginal);
          } catch {
            // Ignore errors
          }
        }
        return {
          id: p.id,
          url,
          width: p.width,
          height: p.height,
        };
      });

      const photoCount = photos.length;

      const model = await prisma.userModel.findUnique({
        where: { userId },
      });

      if (!model) {
        return NextResponse.json({ 
          status: "none", 
          photoCount,
          photos: photosWithUrls,
        });
      }

      return NextResponse.json({
        status: model.status,
        identityModelId: model.id,
        replicate: {
          owner: model.replicateModelOwner,
          name: model.replicateModelName,
          version: model.replicateModelVersion,
        },
        triggerWord: model.status === "ready" ? model.triggerWord : undefined,
        errorMessage: model.errorMessage ?? undefined,
        photoCount,
        photos: photosWithUrls,
      });
    }
  )
);

