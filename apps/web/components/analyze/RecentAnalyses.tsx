"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import s from "@/app/(app)/analyze/style.module.css";

const STORAGE_KEY = "cb:recent-analyses";
const MAX_ITEMS = 5;

type RecentAnalysisEntry = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  channelTitle: string;
  analyzedAt: string; // ISO string
};

/** Read recent analyses from localStorage. */
function getRecentAnalyses(): RecentAnalysisEntry[] {
  if (typeof window === "undefined") {return [];}
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {return [];}
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {return [];}
    return parsed.slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/** Save a new analysis entry to localStorage (deduped, max 5). */
export function saveRecentAnalysis(entry: RecentAnalysisEntry): void {
  if (typeof window === "undefined") {return;}
  try {
    const existing = getRecentAnalyses();
    // Remove duplicate if present
    const filtered = existing.filter((e) => e.videoId !== entry.videoId);
    // Prepend new entry
    const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be full or disabled; ignore
  }
}

/**
 * RecentAnalyses - Displays up to 5 recent analyses from localStorage.
 * Compact card layout with thumbnail, title, and channel.
 */
export function RecentAnalyses() {
  const [entries, setEntries] = useState<RecentAnalysisEntry[]>([]);

  useEffect(() => {
    setEntries(getRecentAnalyses());
  }, []);

  if (entries.length === 0) {return null;}

  return (
    <div className={s.recentSection}>
      <h3 className={s.recentTitle}>Recent Analyses</h3>
      <div className={s.recentGrid}>
        {entries.map((entry) => (
          <Link
            key={entry.videoId}
            href={`/analyze/${entry.videoId}`}
            className={s.recentCard}
          >
            {entry.thumbnailUrl && (
              <Image
                src={entry.thumbnailUrl}
                alt=""
                width={72}
                height={40}
                className={s.recentThumb}
                unoptimized
              />
            )}
            <div className={s.recentInfo}>
              <div className={s.recentVideoTitle}>{entry.title}</div>
              <div className={s.recentMeta}>{entry.channelTitle}</div>
            </div>
            <span className={s.recentArrow} aria-hidden="true">
              &rsaquo;
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
