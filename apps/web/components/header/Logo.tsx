import Link from "next/link";
import { BRAND } from "@/lib/brand";
import s from "../Header.module.css";

/**
 * Logo component - pure, no state.
 */
export function Logo() {
  return (
    <Link
      href="/"
      className={s.logo}
      aria-label={`${BRAND.name} - Go to homepage`}
    >
      <span className={s.logoIcon} aria-hidden="true">
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
      <span className={s.logoText}>{BRAND.name}</span>
    </Link>
  );
}
