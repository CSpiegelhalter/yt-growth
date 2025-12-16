export type RetentionPoint = { elapsedRatio: number; audienceWatchRatio: number };

export type RetentionCliff = {
  cliffTimeSec: number;
  cliffReason: "crossed_50" | "steepest_drop";
  slope: number;
  context: Array<{ second: number; ratio: number }>;
};

function movingAverage(points: RetentionPoint[], window = 3) {
  if (points.length <= 1) return points;
  const half = Math.floor(window / 2);
  return points.map((p, idx) => {
    const start = Math.max(0, idx - half);
    const end = Math.min(points.length, idx + half + 1);
    const slice = points.slice(start, end);
    const avg =
      slice.reduce((acc, cur) => acc + cur.audienceWatchRatio, 0) /
      (slice.length || 1);
    return { ...p, audienceWatchRatio: avg };
  });
}

function ratioToSeconds(ratio: number, durationSec: number) {
  return Math.max(0, Math.round(ratio * durationSec));
}

export function computeRetentionCliff(
  durationSec: number,
  rawPoints: RetentionPoint[]
): RetentionCliff | null {
  if (!durationSec || !rawPoints || rawPoints.length === 0) return null;
  const points = movingAverage(
    rawPoints.sort((a, b) => a.elapsedRatio - b.elapsedRatio),
    5
  );

  let cliffIdx: number | null = null;
  let cliffReason: RetentionCliff["cliffReason"] = "crossed_50";
  let slope = 0;

  // Find first crossing <= 0.5
  for (let i = 0; i < points.length; i++) {
    if (points[i].audienceWatchRatio <= 0.5) {
      cliffIdx = i;
      cliffReason = "crossed_50";
      slope =
        i > 0
          ? points[i].audienceWatchRatio - points[i - 1].audienceWatchRatio
          : points[i].audienceWatchRatio;
      break;
    }
  }

  // Otherwise pick steepest negative slope
  if (cliffIdx === null) {
    let worstSlope = 0;
    let worstIdx = 0;
    for (let i = 1; i < points.length; i++) {
      const delta = points[i].audienceWatchRatio - points[i - 1].audienceWatchRatio;
      if (delta < worstSlope) {
        worstSlope = delta;
        worstIdx = i;
      }
    }
    cliffIdx = worstIdx;
    cliffReason = "steepest_drop";
    slope = worstSlope;
  }

  const second = ratioToSeconds(points[cliffIdx].elapsedRatio, durationSec);
  const context: Array<{ second: number; ratio: number }> = [];
  for (let i = Math.max(0, cliffIdx - 2); i <= Math.min(points.length - 1, cliffIdx + 2); i++) {
    context.push({
      second: ratioToSeconds(points[i].elapsedRatio, durationSec),
      ratio: Number(points[i].audienceWatchRatio.toFixed(3)),
    });
  }

  return {
    cliffTimeSec: second,
    cliffReason,
    slope,
    context,
  };
}
