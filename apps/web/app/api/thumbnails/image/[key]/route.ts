import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { getImage } from "@/lib/features/thumbnails";
import { getStorage } from "@/lib/adapters/storage";

export const GET = createApiRoute(
  { route: "/api/thumbnails/image/[key]" },
  withAuth(
    { mode: "optional" },
    async (req: NextRequest, ctx, api: ApiAuthContext) => {
      void ctx;
      void api;

      const url = new URL(req.url);
      const pathParts = url.pathname.split("/");
      const encodedKey = pathParts[pathParts.length - 1] ?? "";

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
