import Link from "next/link";

/**
 * HeroStaticCTAs - Static server-rendered CTAs for the landing page
 * 
 * Renders immediately without layout shift. Always shows the signed-out state
 * (Get Started + Sign In) which is appropriate for the landing page since:
 * - Most visitors are not signed in
 * - Signed-in users landing here can still navigate via header
 * - Eliminates CLS from client-side auth checks
 */
export function HeroStaticCTAs() {
  return (
    <div className="heroCtas">
      <Link href="/auth/signup" className="heroCtas__primary">
        Get Started
      </Link>
      <Link href="/auth/login" className="heroCtas__secondary">
        Sign In
      </Link>
    </div>
  );
}

