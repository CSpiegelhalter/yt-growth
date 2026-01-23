import Link from "next/link";

/**
 * HeroStaticCTAs - Static server-rendered CTAs for the landing page
 *
 * Shows a descriptive CTA button that links to /dashboard.
 * The dashboard page handles auth guarding and redirects to login if needed.
 */
export function HeroStaticCTAs() {
  return (
    <div className="heroCtas">
      <Link href="/dashboard" className="heroCtas__primary">
        Start analyzing your channel
      </Link>
    </div>
  );
}
