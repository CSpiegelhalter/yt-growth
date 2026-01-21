import Link from "next/link";
import { BRAND } from "@/lib/brand";
import s from "./Footer.module.css";

// Server component - no "use client" needed
// Year is computed at build/request time
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.left}>
          <span className={s.copyright}>
            © {currentYear} {BRAND.name}
          </span>
        </div>

        <nav className={s.links} aria-label="Footer navigation">
          <Link href="/learn" className={s.link}>
            YouTube Guides
          </Link>
          <span className={s.divider} aria-hidden="true">·</span>
          <Link href="/contact" className={s.link}>
            Contact
          </Link>
          <span className={s.divider} aria-hidden="true">·</span>
          <Link href="/privacy" className={s.link}>
            Privacy
          </Link>
          <span className={s.divider} aria-hidden="true">·</span>
          <Link href="/terms" className={s.link}>
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
