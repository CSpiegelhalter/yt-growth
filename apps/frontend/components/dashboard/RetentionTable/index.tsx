"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import s from "./style.module.css";
import type { VideoWithRetention } from "@/types/api";
import { formatReasonHuman } from "@/lib/retention-labels";

type Props = {
  videos: VideoWithRetention[];
  loading?: boolean;
  isDemo?: boolean;
  onLoadMoreSuggestions?: (videoId: string) => Promise<void>;
};

type DropSeverity = "mild" | "moderate" | "sharp";

/**
 * RetentionTable - Shows where viewers leave videos and why
 * Mobile-first design with expandable details for each video
 * Only one accordion item open at a time for better UX
 */
export default function RetentionTable({
  videos,
  loading = false,
  isDemo = false,
  onLoadMoreSuggestions,
}: Props) {
  // Single expandedId ensures only one item is open at a time
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState<string | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  // Toggle accordion - uses video ID as unique identifier (not index)
  const toggleExpand = useCallback((videoId: string) => {
    setExpandedId((prevId) => (prevId === videoId ? null : videoId));
  }, []);

  // Scroll expanded item into view smoothly
  useEffect(() => {
    if (expandedId && expandedRef.current) {
      const timeout = setTimeout(() => {
        expandedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [expandedId]);

  const handleLoadMore = useCallback(
    async (videoId: string) => {
      if (!onLoadMoreSuggestions || loadingMore) return;
      setLoadingMore(videoId);
      try {
        await onLoadMoreSuggestions(videoId);
      } finally {
        setLoadingMore(null);
      }
    },
    [onLoadMoreSuggestions, loadingMore]
  );

  if (loading) {
    return (
      <div className={s.card}>
        <div className={s.header}>
          <h3 className={s.title}>Where Viewers Left</h3>
        </div>
        <div className={s.skeletonList}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={s.skeletonItem}>
              <div className={s.skeletonThumb} />
              <div className={s.skeletonContent}>
                <div
                  className={s.skeleton}
                  style={{ height: 16, width: "70%" }}
                />
                <div
                  className={s.skeleton}
                  style={{ height: 14, width: "40%", marginTop: 8 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={s.card}>
        <div className={s.header}>
          <h3 className={s.title}>Where Viewers Left</h3>
        </div>
        <div className={s.emptyState}>
          <div className={s.emptyIcon} aria-hidden="true">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className={s.emptyTitle}>
            Connect your channel to unlock insights
          </h4>
          <p className={s.emptyDesc}>
            Once synced, you&apos;ll get access to powerful growth tools:
          </p>
          <ul className={s.emptyFeatures}>
            <li className={s.emptyFeature}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
              </svg>
              <span>
                <strong>Video Analysis</strong> — See where viewers drop off and
                get actionable fixes
              </span>
            </li>
            <li className={s.emptyFeature}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>
                <strong>Idea Engine</strong> — AI-powered video ideas based on
                what&apos;s working
              </span>
            </li>
            <li className={s.emptyFeature}>
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
              <span>
                <strong>Competitor Winners</strong> — See what&apos;s working
                for similar channels
              </span>
            </li>
            <li className={s.emptyFeature}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                <strong>Subscriber Drivers</strong> — Discover which videos
                convert viewers to subs
              </span>
            </li>
          </ul>
          <a href="/api/integrations/google/start" className={s.emptyBtn}>
            Connect YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={s.card}>
      <div className={s.header}>
        <div className={s.headerTop}>
          <h3 className={s.title}>Where Viewers Left</h3>
          {isDemo && <span className={s.demoBadge}>Demo Data</span>}
        </div>
        <p className={s.subtitle}>
          See where viewers leave your videos and what likely caused it.
        </p>
      </div>

      <div className={s.videoList} role="list">
        {videos.map((video) => {
          const isExpanded = expandedId === video.youtubeVideoId;
          return (
            <div
              key={video.youtubeVideoId}
              ref={isExpanded ? expandedRef : undefined}
              role="listitem"
            >
              <VideoRetentionCard
                video={video}
                isExpanded={isExpanded}
                onToggle={() => toggleExpand(video.youtubeVideoId)}
                onLoadMore={() => handleLoadMore(video.youtubeVideoId)}
                loadingMore={loadingMore === video.youtubeVideoId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Video Retention Card ---------- */
type VideoRetentionCardProps = {
  video: VideoWithRetention;
  isExpanded: boolean;
  onToggle: () => void;
  onLoadMore: () => void;
  loadingMore: boolean;
};

function VideoRetentionCard({
  video,
  isExpanded,
  onToggle,
  onLoadMore,
  loadingMore,
}: VideoRetentionCardProps) {
  const hasData = video.retention.hasData && video.retention.cliffTimestamp;
  const severity = getDropSeverity(video.retention.cliffReason);
  const causes = getLikelyCauses(
    video.retention.cliffReason,
    video.retention.cliffTimestamp
  );
  const fixes = getFixSuggestions(
    video.retention.cliffReason,
    video.retention.cliffTimestamp
  );
  const patternInterrupts = getPatternInterrupts(
    video.retention.cliffTimestamp
  );
  const timeWindow = getTimeWindow(video.retention.cliffTimestamp);

  // Use the new human-readable labels
  const reasonInfo = formatReasonHuman(video.retention.cliffReason);

  return (
    <div className={`${s.videoCard} ${isExpanded ? s.expanded : ""}`}>
      <button
        className={s.videoCardMain}
        onClick={onToggle}
        type="button"
        aria-expanded={isExpanded}
        aria-controls={`retention-details-${video.youtubeVideoId}`}
      >
        {/* Thumbnail */}
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt=""
            className={s.thumbnail}
            loading="lazy"
          />
        ) : (
          <div className={s.thumbnailPlaceholder}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Video Info */}
        <div className={s.videoInfo}>
          <h4 className={s.videoTitle}>{video.title ?? "Untitled"}</h4>
          <div className={s.videoMeta}>
            {video.publishedAt && (
              <span className={s.metaDate}>
                {formatDate(video.publishedAt)}
              </span>
            )}
          </div>

          {/* Drop-off info */}
          {hasData ? (
            <div className={s.dropOffRow}>
              <span className={s.dropOffLabel}>Drop-off at</span>
              <span className={s.dropOffTime}>
                {video.retention.cliffTimestamp}
              </span>
              <SeverityBadge severity={severity} />
            </div>
          ) : (
            <span className={s.noData}>No data available</span>
          )}
        </div>

        <div className={s.expandIcon} aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={isExpanded ? s.rotated : ""}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Details - Enhanced with human-readable labels */}
      <div
        id={`retention-details-${video.youtubeVideoId}`}
        className={`${s.expandedWrapper} ${
          isExpanded && hasData ? s.open : ""
        }`}
      >
        <div className={s.expandedContent}>
          {/* Likely Cause - Human readable */}
          <div className={s.causeSection}>
            <h5 className={s.sectionTitle}>Likely Cause</h5>
            <div className={s.causeCard}>
              <span className={s.causeLabel}>{reasonInfo.label}</span>
              <span className={s.causeValue}>{reasonInfo.description}</span>
            </div>
          </div>

          {/* Why It Matters */}
          <div className={s.whySection}>
            <h5 className={s.sectionTitle}>Why It Matters</h5>
            <p className={s.whyText}>{reasonInfo.whyItMatters}</p>
          </div>

          {/* What was happening around the drop */}
          <div className={s.contextSection}>
            <h5 className={s.sectionTitle}>Context</h5>
            <div className={s.contextGrid}>
              {timeWindow && (
                <div className={s.contextCard}>
                  <span className={s.contextIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </span>
                  <span className={s.contextLabel}>Time Window</span>
                  <span className={s.contextValue}>{timeWindow}</span>
                </div>
              )}
              <div className={s.contextCard}>
                <span className={s.contextIcon}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
                    <path d="M15 13v6a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2z" />
                  </svg>
                </span>
                <span className={s.contextLabel}>Retention Story</span>
                <span className={s.contextValue}>
                  {getHookStatus(video.retention.cliffTimestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* Contributing Factors */}
          <div className={s.insightSection}>
            <h5 className={s.sectionTitle}>Contributing Factors</h5>
            <ul className={s.insightList}>
              {causes.map((cause, i) => (
                <li key={i}>{cause}</li>
              ))}
            </ul>
          </div>

          {/* What to Do Next */}
          <div className={s.fixSection}>
            <h5 className={s.sectionTitle}>What to Do Next</h5>
            <p className={s.fixIntro}>{reasonInfo.whatToDo}</p>
            <ol className={s.fixList}>
              {fixes.map((fix, i) => (
                <li key={i}>{fix}</li>
              ))}
            </ol>
          </div>

          {/* Pattern Interrupts */}
          <div className={s.interruptSection}>
            <h5 className={s.sectionTitle}>Try This Pattern Interrupt</h5>
            <div className={s.interruptCards}>
              {patternInterrupts.map((interrupt, i) => (
                <div key={i} className={s.interruptCard}>
                  <span className={s.interruptIcon}>{interrupt.icon}</span>
                  <div className={s.interruptContent}>
                    <span className={s.interruptType}>{interrupt.type}</span>
                    <span className={s.interruptDesc}>
                      {interrupt.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For This Exact Moment */}
          <div className={s.momentSuggestion}>
            <h5 className={s.sectionTitle}>For This Exact Moment</h5>
            <p className={s.suggestionText}>
              {getMomentSuggestion(
                video.retention.cliffTimestamp,
                video.retention.cliffReason
              )}
            </p>
          </div>

          {/* Load more suggestions */}
          {onLoadMore && (
            <button
              className={s.loadMoreBtn}
              onClick={onLoadMore}
              disabled={loadingMore}
              type="button"
            >
              {loadingMore ? (
                <>
                  <span className={s.spinner} />
                  Loading...
                </>
              ) : (
                "More Suggestions"
              )}
            </button>
          )}

          {/* Watch on YouTube link */}
          <a
            href={`https://youtube.com/watch?v=${
              video.youtubeVideoId
            }&t=${parseTimestamp(video.retention.cliffTimestamp ?? "0")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={s.watchLink}
          >
            Watch at drop-off point →
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Severity Badge ---------- */
function SeverityBadge({ severity }: { severity: DropSeverity }) {
  const config = {
    mild: { label: "Mild", className: s.severityMild },
    moderate: { label: "Moderate", className: s.severityModerate },
    sharp: { label: "Sharp", className: s.severitySharp },
  }[severity];

  return (
    <span className={`${s.severityBadge} ${config.className}`}>
      {config.label}
    </span>
  );
}

/* ---------- Helper Functions ---------- */

function getDropSeverity(reason: string | null | undefined): DropSeverity {
  if (!reason) return "mild";
  switch (reason) {
    case "steepest_drop":
      return "sharp";
    case "crossed_50":
      return "moderate";
    default:
      return "mild";
  }
}

function getHookStatus(cliffTimestamp: string | null | undefined): string {
  if (!cliffTimestamp) return "Unknown";
  const seconds = parseTimestamp(cliffTimestamp);
  if (seconds < 30) return "Viewers leaving before your promise was delivered";
  if (seconds < 60) return "Drop happened before main content started";
  return "Viewers made it past your hook - good start";
}

function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function getLikelyCauses(
  reason: string | null | undefined,
  timestamp: string | null | undefined
): string[] {
  const seconds = timestamp ? parseTimestamp(timestamp) : 0;
  const causes: string[] = [];

  if (seconds < 30) {
    causes.push("Hook may not match what the title/thumbnail promised");
    causes.push("Opening is too slow - viewers expected faster value");
    causes.push("Viewers clicked expecting different content");
  } else if (seconds < 60) {
    causes.push("Transition from hook to main content feels weak");
    causes.push("Value proposition unclear after intro");
    causes.push("Too much setup before useful insight");
  } else if (seconds < 180) {
    causes.push("Pacing likely slowed - content became predictable");
    causes.push("Topic shift that confused viewers about direction");
    causes.push("Information overload without visual breaks");
  } else {
    causes.push("Natural attention fatigue - need re-engagement");
    causes.push("Content may have felt complete to casual viewers");
    causes.push("Missing clear progression or reason to continue");
  }

  if (reason === "steepest_drop") {
    causes.unshift("Sharp content change confused viewers");
  }

  return causes.slice(0, 3);
}

function getFixSuggestions(
  reason: string | null | undefined,
  timestamp: string | null | undefined
): string[] {
  const seconds = timestamp ? parseTimestamp(timestamp) : 0;
  const fixes: string[] = [];

  if (seconds < 30) {
    fixes.push(
      "Start with your boldest claim or most surprising fact in the first 5 seconds"
    );
    fixes.push(
      "Show a quick preview of the payoff (before/after, end result) within 10 seconds"
    );
    fixes.push(
      "Cut any 'welcome back' or throat-clearing - jump straight into value"
    );
  } else if (seconds < 60) {
    fixes.push(
      "Add a clear 'here's what you'll learn' roadmap between seconds 15-30"
    );
    fixes.push(
      "Use a pattern interrupt (zoom, cut, B-roll) at the 30-second mark"
    );
    fixes.push("Deliver your first useful tip before 45 seconds");
  } else if (seconds < 180) {
    fixes.push("Break up talking head with B-roll every 15-20 seconds");
    fixes.push("Add visual text highlights for key points");
    fixes.push(
      "Insert a curiosity loop: 'But here's what most people miss...'"
    );
  } else {
    fixes.push("Add a 'stick around' hook referencing later content");
    fixes.push("Use chapter markers and announce them verbally");
    fixes.push("Increase energy/pacing in the latter half");
  }

  return fixes.slice(0, 3);
}

type PatternInterrupt = {
  type: string;
  description: string;
  icon: string;
};

function getPatternInterrupts(
  timestamp: string | null | undefined
): PatternInterrupt[] {
  const seconds = timestamp ? parseTimestamp(timestamp) : 0;
  const beforeTime = formatSeconds(Math.max(0, seconds - 5));

  return [
    {
      type: "Visual Cut",
      description: `At ${beforeTime}, cut to B-roll or a close-up to reset attention`,
      icon: "CUT",
    },
    {
      type: "Re-hook Line",
      description: `Insert 'But here's the interesting part...' at ${beforeTime}`,
      icon: "HOOK",
    },
  ];
}

function getTimeWindow(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null;
  const seconds = parseTimestamp(timestamp);
  const before = Math.max(0, seconds - 10);
  const after = seconds + 10;
  return `${formatSeconds(before)} – ${formatSeconds(after)}`;
}

function getMomentSuggestion(
  timestamp: string | null | undefined,
  reason: string | null | undefined
): string {
  if (!timestamp)
    return "Analyze your content structure to find natural break points.";
  const seconds = parseTimestamp(timestamp);
  const beforeSeconds = Math.max(0, seconds - 5);
  const beforeTime = formatSeconds(beforeSeconds);

  if (reason === "steepest_drop") {
    return `Add a transition hook at ${beforeTime}: try a zoom, cut, or "but here's the thing..." to smooth the shift and keep viewers engaged.`;
  }
  if (reason === "crossed_50") {
    return `At ${beforeTime}, preview what's coming next: "In 30 seconds, you'll see exactly how this works..." to create anticipation.`;
  }
  return `Add a visual change or pose a question at ${beforeTime} to reset viewer attention. Example: "Now here's where most people go wrong..."`;
}

function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
