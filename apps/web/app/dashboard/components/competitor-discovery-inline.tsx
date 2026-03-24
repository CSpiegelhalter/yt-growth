"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiFetchJson } from "@/lib/client/api";
import type { SearchEvent, SearchItemsEvent } from "@/lib/client/ndjson-stream";
import { readNdjsonStream } from "@/lib/client/ndjson-stream";

import s from "./competitor-discovery-inline.module.css";

type ChannelCandidate = {
  ytChannelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  videoCount: number;
  topViewsPerDay: number;
  matchReason: string | null;
  nicheOverlap: number | null;
};

type CompetitorDiscoveryInlineProps = {
  channelId: string;
  youtubeChannelId: string;
  onComplete: () => void;
};

type SaveResponse = { saved: number; total: number };

const PAGE_SIZE = 4;

function groupVideosByChannel(
  items: SearchItemsEvent["items"],
): ChannelCandidate[] {
  const channelMap = new Map<
    string,
    {
      channelTitle: string;
      thumbnailUrl: string | null;
      videoCount: number;
      topViewsPerDay: number;
    }
  >();

  for (const item of items) {
    const existing = channelMap.get(item.channelId);
    if (existing) {
      existing.videoCount++;
      existing.topViewsPerDay = Math.max(
        existing.topViewsPerDay,
        item.derived.viewsPerDay,
      );
      if (!existing.thumbnailUrl) {
        existing.thumbnailUrl = item.channelThumbnailUrl || item.thumbnailUrl;
      }
    } else {
      channelMap.set(item.channelId, {
        channelTitle: item.channelTitle,
        thumbnailUrl: item.channelThumbnailUrl || item.thumbnailUrl,
        videoCount: 1,
        topViewsPerDay: item.derived.viewsPerDay,
      });
    }
  }

  return Array.from(channelMap.entries())
    .map(([ytChannelId, data]) => ({
      ytChannelId,
      channelTitle: data.channelTitle,
      thumbnailUrl: data.thumbnailUrl,
      subscriberCount: null,
      videoCount: data.videoCount,
      topViewsPerDay: data.topViewsPerDay,
      matchReason: null,
      nicheOverlap: null,
    }))
    .sort((a, b) => b.videoCount - a.videoCount || b.topViewsPerDay - a.topViewsPerDay);
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function CompetitorDiscoveryInline({
  channelId,
  youtubeChannelId,
  onComplete,
}: CompetitorDiscoveryInlineProps) {
  const [allCandidates, setAllCandidates] = useState<ChannelCandidate[]>([]);
  const [candidates, setCandidates] = useState<ChannelCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pageRef = useRef(0);

  const runSearch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("loading");
    setErrorMsg(null);
    setAllCandidates([]);
    setCandidates([]);
    setSelected(new Set());
    pageRef.current = 0;

    try {
      const response = await fetch("/api/competitors/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "search_my_niche", channelId: youtubeChannelId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : typeof data.message === "string"
              ? data.message
              : `Search failed (${response.status})`,
        );
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const allItems: SearchItemsEvent["items"] = [];

      await readNdjsonStream(response.body, (event: SearchEvent) => {
        if (event.type === "items") {
          allItems.push(...event.items);
        }
        if (event.type === "error") {
          throw new Error(event.error);
        }
      });

      if (controller.signal.aborted) return;

      const grouped = groupVideosByChannel(allItems);
      if (grouped.length === 0) {
        setErrorMsg("No channels found in your niche yet. Try again later.");
        setPhase("error");
        return;
      }

      setAllCandidates(grouped);
      setCandidates(grouped.slice(0, PAGE_SIZE));
      setPhase("ready");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }, [youtubeChannelId]);

  // Auto-search on mount (compatible with React Strict Mode double-mount)
  useEffect(() => {
    void runSearch();
    return () => {
      abortRef.current?.abort();
    };
  }, [runSearch]);

  function handleShowDifferent() {
    if (allCandidates.length <= PAGE_SIZE) {
      setCandidates(shuffleArray(allCandidates));
    } else {
      const nextPage = pageRef.current + 1;
      const start = (nextPage * PAGE_SIZE) % allCandidates.length;
      const page = allCandidates.slice(start, start + PAGE_SIZE);
      // Wrap around if we don't have enough
      if (page.length < PAGE_SIZE) {
        page.push(...allCandidates.slice(0, PAGE_SIZE - page.length));
      }
      setCandidates(page);
      pageRef.current = nextPage;
    }
    setSelected(new Set());
  }

  function toggleCandidate(ytChannelId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ytChannelId)) {
        next.delete(ytChannelId);
      } else if (next.size < 3) {
        next.add(ytChannelId);
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (selected.size === 0) return;

    setPhase("saving");
    try {
      const competitorsToSave = candidates
        .filter((c) => selected.has(c.ytChannelId))
        .map((c) => ({
          ytChannelId: c.ytChannelId,
          channelTitle: c.channelTitle,
          thumbnailUrl: c.thumbnailUrl,
          subscriberCount: c.subscriberCount,
          matchReason: c.matchReason,
          nicheOverlap: c.nicheOverlap,
        }));

      await apiFetchJson<SaveResponse>(
        `/api/me/channels/${channelId}/competitors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ competitors: competitorsToSave, source: "auto" }),
        },
      );

      onComplete();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save competitors");
      setPhase("ready");
    }
  }

  if (phase === "loading") {
    return (
      <div className={s.container}>
        <div className={s.header}>
          <h3 className={s.title}>Finding channels in your niche</h3>
        </div>
        <div className={s.loadingState}>
          <span className={s.spinner} />
          <p className={s.loadingText}>Scanning for similar channels...</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={s.container}>
        <div className={s.header}>
          <h3 className={s.title}>Find channels in your niche</h3>
          <p className={s.subtitle}>
            We&apos;ll use these to power smarter, evidence-backed ideas.
          </p>
        </div>
        <p className={s.errorState}>{errorMsg}</p>
        <button type="button" className={s.confirmBtn} onClick={runSearch}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={`${s.container} ${phase === "saving" ? s.saving : ""}`}>
      <div className={s.header}>
        <h3 className={s.title}>Want smarter ideas?</h3>
        <p className={s.subtitle}>
          Pick 1–3 channels in your niche to power better suggestions.
        </p>
      </div>

      <div className={s.candidatesGrid}>
        {candidates.map((candidate) => {
          const isSelected = selected.has(candidate.ytChannelId);
          const isDisabled = !isSelected && selected.size >= 3;

          return (
            <button
              key={candidate.ytChannelId}
              type="button"
              className={`${s.candidateCard} ${isSelected ? s.candidateSelected : ""} ${isDisabled ? s.candidateDisabled : ""}`}
              onClick={() => !isDisabled && toggleCandidate(candidate.ytChannelId)}
              disabled={phase === "saving"}
            >
              {candidate.thumbnailUrl ? (
                <img
                  src={candidate.thumbnailUrl}
                  alt=""
                  className={s.candidateAvatar}
                  loading="lazy"
                />
              ) : (
                <span className={s.candidateAvatarPlaceholder}>
                  {candidate.channelTitle.charAt(0).toUpperCase()}
                </span>
              )}
              <span className={s.candidateInfo}>
                <span className={s.candidateName}>{candidate.channelTitle}</span>
                <span className={s.candidateMeta}>
                  {candidate.videoCount} trending video{candidate.videoCount !== 1 ? "s" : ""}
                  {candidate.topViewsPerDay > 0 &&
                    ` \u00B7 ${formatNumber(Math.round(candidate.topViewsPerDay))} views/day`}
                </span>
              </span>
              <a
                href={`https://youtube.com/channel/${candidate.ytChannelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={s.channelLink}
                onClick={(e) => e.stopPropagation()}
                aria-label={`View ${candidate.channelTitle} on YouTube`}
              >
                &#8599;
              </a>
              {isSelected && (
                <span className={s.candidateCheck} aria-hidden="true">
                  &#10003;
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={s.footer}>
        <span className={s.selectionHint}>
          {selected.size} of 1–3 selected
        </span>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <button
            type="button"
            className={s.refreshBtn}
            onClick={handleShowDifferent}
            disabled={phase === "saving"}
          >
            Show different matches
          </button>
          <button
            type="button"
            className={s.confirmBtn}
            onClick={handleConfirm}
            disabled={selected.size === 0 || phase === "saving"}
          >
            {selected.size === 1 ? "Use this competitor" : "Use these competitors"}
          </button>
        </div>
      </div>

      {errorMsg && <p className={s.errorState}>{errorMsg}</p>}
    </div>
  );
}
