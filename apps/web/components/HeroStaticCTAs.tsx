import Link from "next/link";

/**
 * HeroStaticCTAs - Static server-rendered CTAs for the landing page
 *
 * Shows a descriptive CTA button that links to /videos.
 * The videos page handles auth guarding and redirects to login if needed.
 */
export function HeroStaticCTAs() {
  return (
    <div className="heroCtas">
      <Link href="/videos" className="heroCtas__primary">
        Start analyzing your channel
      </Link>
    </div>
  );
}
