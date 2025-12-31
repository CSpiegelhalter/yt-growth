import Link from "next/link";
import { BRAND } from "@/lib/brand";

/**
 * Lightweight static header for public/marketing pages.
 * No client-side JavaScript - pure server component.
 * Used on: landing, learn, terms, privacy, contact, auth pages.
 */
export function HeaderStatic() {
  return (
    <header className="headerStatic">
      <div className="headerStatic__inner">
        <Link
          href="/"
          className="headerStatic__logo"
          aria-label={`${BRAND.name} - Go to homepage`}
        >
          <span className="headerStatic__logoIcon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
          <span className="headerStatic__logoText">{BRAND.name}</span>
        </Link>

        <nav className="headerStatic__nav" aria-label="Main navigation">
          <Link href="/learn" className="headerStatic__navLink">
            Learn
          </Link>
          <Link href="/contact" className="headerStatic__navLink">
            Contact
          </Link>
        </nav>

        <div className="headerStatic__auth">
          <Link href="/auth/login" className="headerStatic__login">
            Log in
          </Link>
          <Link href="/auth/signup" className="headerStatic__signup">
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
