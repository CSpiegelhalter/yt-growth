"use client";

import Link from "next/link";
import s from "./Footer.module.css";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.left}>
          <span className={s.copyright}>
            © {currentYear} YT Growth
          </span>
        </div>

        <div className={s.links}>
          <Link href="/contact" className={s.link}>
            Contact
          </Link>
          <span className={s.divider}>·</span>
          <Link href="/privacy" className={s.link}>
            Privacy
          </Link>
          <span className={s.divider}>·</span>
          <Link href="/terms" className={s.link}>
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

