/**
 * Retention cliff analysis algorithm
 *
 * Finds the point in a video where viewer retention drops significantly,
 * either crossing below 50% or having the steepest decline.
 */

export type RetentionPoint = {
  elapsedRatio: number; // 0-1, position in video
  audienceWatchRatio: number; // 0-1, percentage of viewers still watching
};

export type CliffResult = {
  cliffTimeSec: number;
  cliffReason: "crossed_50" | "steepest_drop";
  slope: number;
  contextWindow: {
    startSec: number;
    endSec: number;
    startRatio: number;
    endRatio: number;
  };
};

/**
 * Apply a simple moving average to smooth the retention curve.
 */
function smoothMovingAverage(points: RetentionPoint[], windowSize: number = 3): RetentionPoint[] {
  if (points.length <= windowSize) return points;
  const result: RetentionPoint[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(points.length, i + halfWindow + 1);
    const slice = points.slice(start, end);
    const avgRatio = slice.reduce((sum, p) => sum + p.audienceWatchRatio, 0) / slice.length;
    result.push({
      elapsedRatio: points[i].elapsedRatio,
      audienceWatchRatio: avgRatio,
    });
  }
  return result;
}

/**
 * Compute the retention cliff for a video.
 *
 * Algorithm:
 * 1. Convert elapsedRatio to seconds
 * 2. Apply moving average smoothing
 * 3. Find first point where ratio <= 0.50, OR
 * 4. Find point with steepest negative slope
 *
 * @param durationSec - Total video duration in seconds
 * @param points - Array of retention points
 * @param smoothWindow - Moving average window size (default 3)
 */
export function computeRetentionCliff(
  durationSec: number,
  points: RetentionPoint[],
  smoothWindow: number = 3
): CliffResult | null {
  if (!points || points.length < 2 || durationSec <= 0) {
    return null;
  }

  // Sort by elapsed ratio
  const sorted = [...points].sort((a, b) => a.elapsedRatio - b.elapsedRatio);

  // Apply smoothing
  const smoothed = smoothMovingAverage(sorted, smoothWindow);

  // Convert to seconds
  const withSeconds = smoothed.map((p) => ({
    ...p,
    seconds: Math.round(p.elapsedRatio * durationSec),
  }));

  // Strategy 1: Find first point where ratio crosses below 50%
  let crossed50Index = -1;
  for (let i = 0; i < withSeconds.length; i++) {
    if (withSeconds[i].audienceWatchRatio <= 0.5) {
      crossed50Index = i;
      break;
    }
  }

  // Strategy 2: Find steepest negative slope
  let steepestIndex = -1;
  let steepestSlope = 0;
  for (let i = 1; i < withSeconds.length; i++) {
    const prev = withSeconds[i - 1];
    const curr = withSeconds[i];
    const timeDelta = curr.seconds - prev.seconds;
    if (timeDelta <= 0) continue;
    const slope = (curr.audienceWatchRatio - prev.audienceWatchRatio) / timeDelta;
    if (slope < steepestSlope) {
      steepestSlope = slope;
      steepestIndex = i;
    }
  }

  // Determine which cliff to use
  let cliffIndex: number;
  let cliffReason: "crossed_50" | "steepest_drop";
  let slope: number;

  if (crossed50Index >= 0) {
    cliffIndex = crossed50Index;
    cliffReason = "crossed_50";
    // Calculate slope at this point
    const prev = withSeconds[Math.max(0, cliffIndex - 1)];
    const curr = withSeconds[cliffIndex];
    const timeDelta = curr.seconds - prev.seconds || 1;
    slope = (curr.audienceWatchRatio - prev.audienceWatchRatio) / timeDelta;
  } else if (steepestIndex >= 0) {
    cliffIndex = steepestIndex;
    cliffReason = "steepest_drop";
    slope = steepestSlope;
  } else {
    return null;
  }

  // Build context window (2 points before and after)
  const windowStart = Math.max(0, cliffIndex - 2);
  const windowEnd = Math.min(withSeconds.length - 1, cliffIndex + 2);

  return {
    cliffTimeSec: withSeconds[cliffIndex].seconds,
    cliffReason,
    slope,
    contextWindow: {
      startSec: withSeconds[windowStart].seconds,
      endSec: withSeconds[windowEnd].seconds,
      startRatio: withSeconds[windowStart].audienceWatchRatio,
      endRatio: withSeconds[windowEnd].audienceWatchRatio,
    },
  };
}

/**
 * Format seconds as MM:SS timestamp.
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Calculate subscribers gained per 1000 views.
 */
export function calcSubsPerThousandViews(subsGained: number, views: number): number {
  if (views <= 0) return 0;
  return Math.round((subsGained / views) * 1000 * 100) / 100;
}

