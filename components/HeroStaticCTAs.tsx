import Link from "next/link";

/**
 * HeroStaticCTAs - Static server-rendered CTAs for the landing page
 *
 * Shows a single "Get Started" button that links to /dashboard.
 * The dashboard page handles auth guarding and redirects to login if needed.
 */
export function HeroStaticCTAs() {
  return (
    <div className="heroCtas">
      <Link href="/dashboard" className="heroCtas__primary">
        Get Started
      </Link>
    </div>
  );
}
