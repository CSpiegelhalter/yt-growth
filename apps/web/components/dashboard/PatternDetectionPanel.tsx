"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./PatternDetectionPanel.module.css";

type VideoPerformance = {
  videoId: string;
  title: string;
  thumbnailUrl?: string | null;
  views: number;
  avgViewPct?: number | null;
  publishedAt: string;
};

type FormatInsight = {
  pattern: string;
  impact: "positive" | "negative" | "neutral";
  evidence: string;
  suggestion?: string;
};

type PatternData = {
  topPerformers: VideoPerformance[];
  underperformers: VideoPerformance[];
  formatInsights: FormatInsight[];
  avgViews: number;
  avgRetention: number | null;
  videoCount: number;
};

type Props = {
  channelId: string;
  videos: Array<{
    youtubeVideoId: string;
    title: string;
    thumbnailUrl?: string | null;
    publishedAt?: Date | string | null;
    viewCount?: number | null;
    avgViewPercentage?: number | null;
    durationSec?: number | null;
  }>;
};

/**
 * PatternDetectionPanel - Identifies patterns in video performance
 * Shows top performers, underperformers, and format insights
 */
export function PatternDetectionPanel({ channelId, videos }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [patternData, setPatternData] = useState<PatternData | null>(null);

  // Analyze videos to detect patterns
  useEffect(() => {
    if (videos.length < 5) {
      setPatternData(null);
      return;
    }

    // Filter to videos with views
    const validVideos = videos
      .filter((v) => v.viewCount && v.viewCount > 10)
      .map((v) => ({
        videoId: v.youtubeVideoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        views: v.viewCount ?? 0,
        avgViewPct: v.avgViewPercentage,
        publishedAt: v.publishedAt?.toString() ?? "",
        durationSec: v.durationSec ?? 0,
      }));

    if (validVideos.length < 5) {
      setPatternData(null);
      return;
    }

    // Calculate averages
    const avgViews =
      validVideos.reduce((sum, v) => sum + v.views, 0) / validVideos.length;
    const withRetention = validVideos.filter((v) => v.avgViewPct != null);
    const avgRetention =
      withRetention.length > 0
        ? withRetention.reduce((sum, v) => sum + (v.avgViewPct ?? 0), 0) /
          withRetention.length
        : null;

    // Sort by views to find top/bottom performers
    const sorted = [...validVideos].sort((a, b) => b.views - a.views);
    const topPerformers = sorted.slice(0, 3);
    const underperformers = sorted.slice(-3).reverse();

    // Detect format patterns
    const formatInsights = detectFormatPatterns(validVideos, avgViews);

    setPatternData({
      topPerformers: topPerformers.map((v) => ({
        videoId: v.videoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        views: v.views,
        avgViewPct: v.avgViewPct,
        publishedAt: v.publishedAt,
      })),
      underperformers: underperformers.map((v) => ({
        videoId: v.videoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        views: v.views,
        avgViewPct: v.avgViewPct,
        publishedAt: v.publishedAt,
      })),
      formatInsights,
      avgViews,
      avgRetention,
      videoCount: validVideos.length,
    });
  }, [videos]);

  if (!patternData) {
    return null; // Not enough data to show patterns
  }

  const {
    topPerformers,
    underperformers,
    formatInsights,
    avgViews,
    videoCount,
  } = patternData;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Pattern Detection</h3>
        <span className={styles.subtitle}>Based on {videoCount} videos</span>
      </div>

      {/* Top Performers */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <span className={styles.iconPositive}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </span>
          Top performers
        </h4>
        <div className={styles.videoList}>
          {topPerformers.map((video) => (
            <Link
              key={video.videoId}
              href={`/video/${video.videoId}?channelId=${channelId}`}
              className={styles.videoRow}
            >
              <span className={styles.videoTitle}>{video.title}</span>
              <span className={styles.videoStat}>
                {formatViews(video.views)}
                {avgViews > 0 && (
                  <span className={styles.vsAvg}>
                    ({Math.round((video.views / avgViews) * 100)}% of avg)
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Underperformers */}
      {underperformers.length > 0 &&
        underperformers[0].views < avgViews * 0.5 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.iconNegative}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
              Underperformers
            </h4>
            <div className={styles.videoList}>
              {underperformers
                .filter((v) => v.views < avgViews * 0.5)
                .slice(0, 3)
                .map((video) => (
                  <Link
                    key={video.videoId}
                    href={`/video/${video.videoId}?channelId=${channelId}`}
                    className={styles.videoRow}
                  >
                    <span className={styles.videoTitle}>{video.title}</span>
                    <span className={styles.videoStat}>
                      {formatViews(video.views)}
                      {avgViews > 0 && (
                        <span className={styles.vsAvgNegative}>
                          ({Math.round((video.views / avgViews) * 100)}% of avg)
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        )}

      {/* Format Insights */}
      {formatInsights.length > 0 && (
        <>
          <button
            className={styles.expandBtn}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? "Hide insights"
              : `Show ${formatInsights.length} format insights`}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={expanded ? styles.rotated : ""}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {expanded && (
            <div className={styles.insightsList}>
              {formatInsights.map((insight, i) => (
                <div
                  key={i}
                  className={`${styles.insightCard} ${styles[insight.impact]}`}
                >
                  <span className={styles.insightPattern}>
                    {insight.pattern}
                  </span>
                  <span className={styles.insightEvidence}>
                    {insight.evidence}
                  </span>
                  {insight.suggestion && (
                    <span className={styles.insightSuggestion}>
                      {insight.suggestion}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
}

function detectFormatPatterns(
  videos: Array<{
    videoId: string;
    title: string;
    views: number;
    avgViewPct?: number | null;
    durationSec: number;
  }>,
  avgViews: number,
): FormatInsight[] {
  const insights: FormatInsight[] = [];

  // Analyze video length patterns
  const shortVideos = videos.filter(
    (v) => v.durationSec > 0 && v.durationSec < 300,
  );
  const longVideos = videos.filter((v) => v.durationSec >= 600);

  if (shortVideos.length >= 3 && longVideos.length >= 3) {
    const shortAvg =
      shortVideos.reduce((sum, v) => sum + v.views, 0) / shortVideos.length;
    const longAvg =
      longVideos.reduce((sum, v) => sum + v.views, 0) / longVideos.length;

    if (shortAvg > longAvg * 1.4) {
      insights.push({
        pattern: "Shorter videos outperform",
        impact: "positive",
        evidence: `Videos under 5 min: ${formatViews(Math.round(shortAvg))} avg vs ${formatViews(Math.round(longAvg))} for 10+ min videos`,
        suggestion: "Consider focusing on concise, punchy content.",
      });
    } else if (longAvg > shortAvg * 1.4) {
      insights.push({
        pattern: "Longer videos outperform",
        impact: "positive",
        evidence: `Videos 10+ min: ${formatViews(Math.round(longAvg))} avg vs ${formatViews(Math.round(shortAvg))} for under 5 min`,
        suggestion:
          "Your audience prefers in-depth content. Lean into longer formats.",
      });
    }
  }

  // Analyze title patterns (questions, numbers, how-to)
  const questionTitles = videos.filter(
    (v) =>
      v.title.includes("?") ||
      v.title.toLowerCase().startsWith("how") ||
      v.title.toLowerCase().startsWith("what"),
  );
  const otherTitles = videos.filter(
    (v) =>
      !v.title.includes("?") &&
      !v.title.toLowerCase().startsWith("how") &&
      !v.title.toLowerCase().startsWith("what"),
  );

  if (questionTitles.length >= 3 && otherTitles.length >= 3) {
    const questionAvg =
      questionTitles.reduce((sum, v) => sum + v.views, 0) /
      questionTitles.length;
    const otherAvg =
      otherTitles.reduce((sum, v) => sum + v.views, 0) / otherTitles.length;

    if (questionAvg > otherAvg * 1.3) {
      insights.push({
        pattern: "Question-style titles perform well",
        impact: "positive",
        evidence: `Question/how-to titles: ${formatViews(Math.round(questionAvg))} avg vs ${formatViews(Math.round(otherAvg))} for other titles`,
        suggestion: "Your audience responds to curiosity-driven titles.",
      });
    }
  }

  // Analyze numbered list patterns
  const numberedTitles = videos.filter(
    (v) =>
      /\d/.test(v.title) &&
      /(top|best|\d\s*(ways|tips|reasons|things))/i.test(v.title),
  );
  if (numberedTitles.length >= 3) {
    const numberedAvg =
      numberedTitles.reduce((sum, v) => sum + v.views, 0) /
      numberedTitles.length;
    if (numberedAvg > avgViews * 1.2) {
      insights.push({
        pattern: "List-style videos perform above average",
        impact: "positive",
        evidence: `Numbered list videos: ${formatViews(Math.round(numberedAvg))} avg (${Math.round((numberedAvg / avgViews) * 100)}% of channel avg)`,
      });
    }
  }

  // Retention analysis
  const withRetention = videos.filter(
    (v) => v.avgViewPct != null && v.avgViewPct > 0,
  );
  if (withRetention.length >= 5) {
    const highRetention = withRetention.filter((v) => (v.avgViewPct ?? 0) > 50);
    const lowRetention = withRetention.filter((v) => (v.avgViewPct ?? 0) < 35);

    if (highRetention.length >= 2 && lowRetention.length >= 2) {
      const highRetAvgViews =
        highRetention.reduce((sum, v) => sum + v.views, 0) /
        highRetention.length;
      const lowRetAvgViews =
        lowRetention.reduce((sum, v) => sum + v.views, 0) / lowRetention.length;

      if (highRetAvgViews > lowRetAvgViews * 1.5) {
        insights.push({
          pattern: "Retention strongly predicts views",
          impact: "neutral",
          evidence: `High retention videos (>50%) average ${formatViews(Math.round(highRetAvgViews))} vs ${formatViews(Math.round(lowRetAvgViews))} for low retention (<35%)`,
          suggestion:
            "Focus on the first 30 seconds and mid-video hooks to boost retention.",
        });
      }
    }
  }

  return insights;
}

export default PatternDetectionPanel;
