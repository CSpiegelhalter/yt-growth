import { type NextRequest, NextResponse } from "next/server";

import { getStorage } from "@/lib/adapters/storage";
import { createApiRoute } from "@/lib/api/route";
import { type ApiAuthContext,withAuth } from "@/lib/api/withAuth";
import { getImage } from "@/lib/features/thumbnails";

export const GET = createApiRoute(
  { route: "/api/thumbnails/image/[key]" },
  withAuth(
    { mode: "optional" },
    async (req: NextRequest, ctx, api: ApiAuthContext) => {
      void ctx;
      void api;

      const url = new URL(req.url);
      const pathParts = url.pathname.split("/");
      const encodedKey = pathParts.at(-1) ?? "";

      const result = await getImage(
        { encodedKey },
        { storage: getStorage() },
      );

      return new NextResponse(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          "Content-Type": result.mime,
          "Content-Length": String(result.size),
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    },
  ),
);
