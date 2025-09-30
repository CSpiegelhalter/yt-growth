// app/api/me/channels/route.ts
export async function GET() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE!;
  try {
    const res = await fetch(`${apiBase}/me/channels`, {
      // Route handler runs server-side, so no CORS issues.
      // If/when you add Cognito, attach Authorization: Bearer <id_token> here.
      // headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    // Pass through backend status codes
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Upstream error", detail: String(err) }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
