"use client";

import Link from "next/link";

import type { Status } from "../saved-ideas-types";
import { STATUS_LABELS } from "../saved-ideas-types";
import s from "../style.module.css";

type EmptyStateProps = {
  filter: Status | "all";
};

export function EmptyState({ filter }: EmptyStateProps) {
  return (
    <div className={s.emptyState}>
      <div className={s.emptyIcon}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h2 className={s.emptyTitle}>
        {filter === "all" ? "No saved ideas yet" : `No ${STATUS_LABELS[filter as Status].toLowerCase()} ideas`}
      </h2>
      <p className={s.emptyDesc}>
        {filter === "all"
          ? "Save ideas from the Idea Engine to build your video backlog. Click the bookmark icon on any idea to save it here."
          : `Move ideas to "${STATUS_LABELS[filter as Status]}" status to see them here.`}
      </p>
      {filter === "all" && (
        <Link href="/ideas" className={s.emptyBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Go to Idea Engine
        </Link>
      )}
    </div>
  );
}
