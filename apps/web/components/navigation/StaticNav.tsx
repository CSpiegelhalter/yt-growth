import Link from "next/link";

import { BRAND } from "@/lib/shared/brand";

import { Logo } from "./Logo";
import s from "./StaticNav.module.css";
import { StaticNavCta } from "./StaticNavCta";

/**
 * Marketing top nav for static pages (landing, learn, learn/*,
 * privacy, terms, contact).
 *
 * Server component — CTA is a server component that reads the session
 * and renders "Dashboard" → /dashboard for signed-in users from first paint.
 */
export function StaticNav() {
  return (
    <header className={s.header}>
      <nav className={s.inner} aria-label="Marketing navigation">
        <Link href="/" className={s.logoLink} aria-label={`${BRAND.name} - Go to home`}>
          <Logo size={36} />
        </Link>

        <div className={s.navLinks}>
          <Link href="/learn" className={s.navLink}>
            Learn
          </Link>
          <Link href="/pricing" className={s.navLink}>
            Pricing
          </Link>
          <StaticNavCta />
        </div>
      </nav>
    </header>
  );
}
