export async function GET() {
  // In real flow, proxy to backend: `${process.env.NEXT_PUBLIC_API_BASE}/me/channels`
  // For local MVP, demonstrate shape.
  return Response.json([
    { channel_id: "UC_DEMO_123", title: "Demo Channel" }
  ]);
}