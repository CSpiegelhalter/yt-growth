import Link from "next/link";

/**
 * HeroStaticCTAs - Static server-rendered CTAs for the landing page
 *
 * Shows a descriptive CTA button that links to the public guest dashboard,
 * letting unauthenticated visitors try the product before signing up.
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
