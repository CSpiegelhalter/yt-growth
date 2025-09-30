// app/api/me/channels/[channelId]/route.ts
export async function DELETE(_: Request, { params }: { params: { channelId: string } }) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE!;
    try {
      const res = await fetch(`${apiBase}/me/channels/${params.channelId}`, { method: "DELETE" });
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
  