"use client";

import styles from "./panels.module.css";
import { InsightCard } from "../ui";
import { formatCompactRounded as formatCompact } from "@/lib/shared/format";

type PostWatchPanelProps = {
  endScreenClicks: number | null;
  endScreenImpressions: number | null;
  endScreenCtr: number | null;
  avgViewPercentage: number | null;
  shares: number | null;
  playlistAdds: number | null;
  totalViews: number;
  baselineEndScreenCtr?: number | null;
};

/**
 * PostWatchPanel - Analyzes post-watch behavior and session continuation
 * Now includes session signal explanations
 */
export function PostWatchPanel({
  endScreenClicks,
  endScreenImpressions,
  endScreenCtr,
  avgViewPercentage,
  shares,
  playlistAdds,
  totalViews,
  baselineEndScreenCtr,
}: PostWatchPanelProps) {
  // Check if we have meaningful data
  const hasEndScreenData =
    endScreenImpressions != null && endScreenImpressions > 0;
  const hasEngagementData = (shares ?? 0) > 0 || (playlistAdds ?? 0) > 0;

  if (!hasEndScreenData && !hasEngagementData) {
    return (
      <InsightCard title="Post-watch behavior">
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Limited data available</p>
          <p className={styles.emptyDesc}>
            Add end screens to your video to track how well you're driving
            viewers to watch more content.
          </p>
        </div>
      </InsightCard>
    );
  }

  // Determine end screen performance
  const endScreenPerformance = getEndScreenPerformance(
    endScreenCtr,
    baselineEndScreenCtr,
  );

  // Generate recommendation
  const recommendation = getRecommendation(
    endScreenCtr,
    avgViewPercentage,
    shares,
    playlistAdds,
    totalViews,
  );

  return (
    <InsightCard
      title="Session continuation"
      subtitle="Do viewers watch more after this video?"
      status={endScreenPerformance?.status}
    >
      {/* Stats Grid */}
      <div className={styles.postWatchStats}>
        {hasEndScreenData && (
          <>
            <div className={styles.postWatchStat}>
              <span className={styles.postWatchStatValue}>
                {endScreenCtr != null ? `${endScreenCtr.toFixed(1)}%` : "–"}
              </span>
              <span className={styles.postWatchStatLabel}>End Screen CTR</span>
              <span className={styles.postWatchStatTarget}>Target: 3%+</span>
            </div>
            <div className={styles.postWatchStat}>
              <span className={styles.postWatchStatValue}>
                {endScreenClicks != null && endScreenClicks > 0
                  ? formatCompact(endScreenClicks)
                  : "–"}
              </span>
              <span className={styles.postWatchStatLabel}>
                End Screen Clicks
              </span>
            </div>
          </>
        )}
        <div className={styles.postWatchStat}>
          <span className={styles.postWatchStatValue}>
            {shares != null && shares > 0 ? formatCompact(shares) : "–"}
          </span>
          <span className={styles.postWatchStatLabel}>Shares</span>
        </div>
        <div className={styles.postWatchStat}>
          <span className={styles.postWatchStatValue}>
            {playlistAdds != null && playlistAdds > 0
              ? formatCompact(playlistAdds)
              : "–"}
          </span>
          <span className={styles.postWatchStatLabel}>Playlist Saves</span>
        </div>
      </div>

      {/* Performance indicator */}
      {endScreenPerformance && (
        <div
          className={`${styles.trafficDiagnosis} ${styles[endScreenPerformance.status]}`}
        >
          <span className={styles.diagnosisTitle}>
            {endScreenPerformance.title}
          </span>
          <p className={styles.diagnosisText}>{endScreenPerformance.message}</p>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className={styles.postWatchRecommendation}>
          <h4 className={styles.postWatchRecommendationTitle}>
            Recommendation
          </h4>
          <p className={styles.postWatchRecommendationText}>{recommendation}</p>
        </div>
      )}
    </InsightCard>
  );
}

function getEndScreenPerformance(
  ctr: number | null,
  baseline: number | null | undefined,
): {
  title: string;
  message: string;
  status: "strong" | "mixed" | "needs-work";
} | null {
  if (ctr == null) {return null;}

  // Compare to baseline if available
  if (baseline != null && baseline > 0) {
    const ratio = ctr / baseline;
    if (ratio >= 1.2) {
      return {
        title: "Strong session continuation",
        message: `End screen CTR (${ctr.toFixed(1)}%) is ${Math.round((ratio - 1) * 100)}% above your channel average. This video is good at driving viewers to watch more.`,
        status: "strong",
      };
    }
    if (ratio < 0.7) {
      return {
        title: "Below average continuation",
        message: `End screen CTR (${ctr.toFixed(1)}%) is below your channel average. Consider improving your end screen pitch or linking to a more relevant follow-up video.`,
        status: "needs-work",
      };
    }
  }

  // Absolute benchmarks
  if (ctr >= 8) {
    return {
      title: "Excellent session continuation",
      message: `${ctr.toFixed(1)}% of viewers who see your end screen click through. This is above typical benchmarks (~5%).`,
      status: "strong",
    };
  }
  if (ctr >= 4) {
    return {
      title: "Good session continuation",
      message: `${ctr.toFixed(1)}% end screen CTR is solid. Consider verbally pitching your next video to boost it further.`,
      status: "mixed",
    };
  }
  if (ctr > 0) {
    return {
      title: "Low session continuation",
      message: `Only ${ctr.toFixed(1)}% of viewers click end screens. Make sure you're verbally recommending a specific video and that the end screen appears at the right time.`,
      status: "needs-work",
    };
  }

  return null;
}

function getRecommendation(
  endScreenCtr: number | null,
  avgViewPct: number | null,
  shares: number | null,
  playlistAdds: number | null,
  totalViews: number,
): string | null {
  // Low retention means few reach end screen
  if (avgViewPct != null && avgViewPct < 40) {
    return "Most viewers leave before reaching your end screen. Focus on improving retention first, then optimize end screens.";
  }

  // Low end screen CTR
  if (endScreenCtr != null && endScreenCtr < 3) {
    return "Verbally pitch your recommended video before the end screen appears. Say something like: 'If you found this helpful, watch this video next where I show you...'";
  }

  // Good engagement signals
  if ((shares ?? 0) / Math.max(totalViews, 1) > 0.01) {
    return "This video has strong share rates. Consider adding a shareable moment or quote graphic to encourage even more sharing.";
  }

  // Good playlist saves
  if ((playlistAdds ?? 0) / Math.max(totalViews, 1) > 0.005) {
    return "Viewers are saving this video. Create a playlist around this topic and link to it in the description and end screen.";
  }

  return null;
}