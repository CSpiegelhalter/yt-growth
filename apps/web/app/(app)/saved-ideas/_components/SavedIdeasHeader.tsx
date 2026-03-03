"use client";

import Link from "next/link";

import s from "../style.module.css";

export function SavedIdeasHeader() {
  return (
    <header className={s.header}>
      <div className={s.headerTop}>
        <div>
          <div className={s.titleRow}>
            <div className={s.headerIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className={s.title}>Saved Ideas</h2>
          </div>
          <p className={s.subtitle}>
            Your collection of video ideas. Track progress from saved to published.
          </p>
        </div>
        <Link href="/ideas" className={s.backLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Ideas
        </Link>
      </div>
    </header>
  );
}
