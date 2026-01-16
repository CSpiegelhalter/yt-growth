import { MarketingHeader } from "@/components/marketing";
import { Footer } from "@/components/Footer";
import { getCurrentUserServer } from "@/lib/server/bootstrap";

/**
 * Marketing layout for public pages.
 * 
 * Server Component layout that:
 * - Checks auth server-side (no client round trip)
 * - Renders MarketingHeader with user state (shows "Dashboard" if logged in)
 * - Page content
 * - Footer
 * 
 * No Suspense boundaries for layout chrome - this ensures zero CLS.
 * Both authenticated and unauthenticated headers have identical height.
 * 
 * Pages rendered under this layout: /, /learn/**, /privacy, /terms, /contact
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check (returns null if not authenticated)
  const user = await getCurrentUserServer();
  
  return (
    <div className="appShell">
      <MarketingHeader user={user} />
      <div className="appMain">{children}</div>
      <Footer />
    </div>
  );
}
