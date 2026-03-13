import Link from "next/link";

import { BRAND } from "@/lib/shared/brand";

import { Logo } from "./Logo";
import s from "./StaticNav.module.css";

/**
 * Marketing top nav for static pages (landing, learn, learn/*,
 * privacy, terms, contact).
 *
 * Server component — no client JS needed.
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
          <Link href="/auth/login?redirect=/videos" className={s.ctaBtn}>
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
