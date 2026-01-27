/**
 * Server component that renders compact article navigation.
 * Shows a simple "All guides" link instead of a dropdown for cleaner mobile UX.
 * Must remain a server component - no "use client" directive.
 */

import Link from "next/link";

interface LearnTopicsNavProps {
  styles: {
    articleNav: string;
    articleNavLabel: string;
    articleNavLink: string;
    articleNavLinkActive: string;
  };
}

export function LearnTopicsNav({ styles: s }: LearnTopicsNavProps) {
  return (
    <nav className={s.articleNav} aria-label="Learn navigation">
      <Link href="/learn" className="allGuidesLink">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        All guides
      </Link>
    </nav>
  );
}
