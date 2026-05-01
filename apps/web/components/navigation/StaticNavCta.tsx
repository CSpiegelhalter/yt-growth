import Link from "next/link";

import s from "./StaticNav.module.css";

/**
 * Static CTA for the marketing nav. Always links to /dashboard, which renders
 * a public guest preview for unauthenticated visitors and the personalized
 * dashboard for signed-in users. No auth logic needed in the marketing chrome.
 */
export function StaticNavCta() {
  return (
    <Link href="/dashboard" className={s.ctaBtn}>
      Get Started
    </Link>
  );
}
