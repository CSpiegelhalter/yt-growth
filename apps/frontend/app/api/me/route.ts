// app/api/me/route.ts
import { asApiResponse } from "@/lib/http";
import { publicMePayload, requireUserContext } from "@/lib/server-user";

export async function GET() {
  try {
    const ctx = await requireUserContext();
    return Response.json(publicMePayload(ctx), {
      headers: { "cache-control": "no-store" },
    });
  } catch (err: any) {
    return asApiResponse(err);
  }
}
