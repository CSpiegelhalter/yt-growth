/**
 * GET /robots.txt
 *
 * Generate robots.txt for SEO
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /audit/
Disallow: /profile/

Sitemap: ${appUrl}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

