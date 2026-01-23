/**
 * GET /api/thumbnails/image/:key
 *
 * Stream stored thumbnail images with proper headers.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { ApiError } from "@/lib/api/errors";
import { getStorage } from "@/lib/storage";

export const GET = createApiRoute(
  { route: "/api/thumbnails/image/[key]" },
  withAuth(
    { mode: "optional" }, // Allow public access for preview URLs
    async (req: NextRequest, ctx, api: ApiAuthContext) => {
      void ctx;
      void api;
      // Get key from URL path
      const url = new URL(req.url);
      const pathParts = url.pathname.split("/");
      const encodedKey = pathParts[pathParts.length - 1];

      if (!encodedKey) {
        throw new ApiError({
          code: "VALIDATION_ERROR",
          status: 400,
          message: "Missing image key",
        });
      }

      // Decode the key
      const key = decodeURIComponent(encodedKey);

      // Security: Validate key format (should be thumbnails/..., assets/..., face-refs/..., or identity/...)
      if (
        !key.startsWith("thumbnails/") &&
        !key.startsWith("assets/") &&
        !key.startsWith("face-refs/") &&
        !key.startsWith("identity/")
      ) {
        throw new ApiError({
          code: "FORBIDDEN",
          status: 403,
          message: "Invalid image key",
        });
      }

      const storage = getStorage();
      const obj = await storage.get(key);

      if (!obj) {
        throw new ApiError({
          code: "NOT_FOUND",
          status: 404,
          message: "Image not found",
        });
      }

      // Return image with proper headers
      return new NextResponse(new Uint8Array(obj.buffer), {
        status: 200,
        headers: {
          "Content-Type": obj.mime,
          "Content-Length": String(obj.size),
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  )
);
