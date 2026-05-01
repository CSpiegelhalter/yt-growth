/**
 * Channel-baseline percentile comparisons for the full-report Score Strip.
 *
 * Produces ScoreStripData (3 KPI tiles) and RetentionCurveData
 * from the data already gathered for the report.
 *
 * Falls back to platform-norm thresholds when channel sample
 * is too small (< MIN_CHANNEL_SAMPLE).
 */

import type {
  AnnotatedDropOff,
  RetentionAnalysis,
  RetentionCurveData,
  RetentionCurveSample,
  RetentionRebound,
  ScoreStripData,
  ScoreTile,
  ScoreTileTone,
} from "@/lib/features/full-report";
import type { InsightContext } from "@/lib/features/full-report/types";

// Minimum retention pts (out of 100) the curve must rebound by before we treat
// it as a "clippable moment". 3 pts is conservative — anything less is noise.
const REBOUND_THRESHOLD_PTS = 3;
// Don't surface rebounds in the very last seconds of the video — those are
// usually outro/end-screen views, not re-watches.
const REBOUND_TAIL_GUARD_SEC = 5;
// Cap the number of rebounds shown to avoid clutter.
const MAX_REBOUNDS = 4;

/**
 * Structural subset of derived metrics — only the fields the score strip needs.
 * Avoids coupling to the full `DerivedMetrics` shape from owned-video-math
 * (the cached derivedJson uses a thinner type alias on the server).
 */
type ScoreStripDerivedMetrics = {
  impressionsCtr?: number | null;
  avgViewDuration?: number | null;
  avdRatio?: number | null;
  subsPer1k?: number | null;
};

type BaselineMeanStd = { mean: number; std: number };

type ChannelBaselineShape = {
  avgViewPercentage?: BaselineMeanStd;
  subsPer1k?: BaselineMeanStd;
  viewsPerDay?: BaselineMeanStd;
  impressionsCtr?: BaselineMeanStd;
  sampleSize?: number;
};

const MIN_CHANNEL_SAMPLE = 5;

// Platform-norm thresholds (rough rules-of-thumb used when channel sample is thin).
// These are intentionally conservative — they classify "is this video roughly OK?"
// not "is this best in class".
const PLATFORM_NORM = {
  ctrPct: 4, // 4% CTR is typical for videos that get distributed
  avdRatio: 0.45, // 45% avg view percentage is typical
  subsPer1k: 1.5,
} as const;

function tileFromDelta(deltaPct: number | null): ScoreTileTone {
  if (deltaPct == null) {return "unknown";}
  if (deltaPct >= 10) {return "above";}
  if (deltaPct >= -10) {return "on_par";}
  if (deltaPct >= -25) {return "below";}
  return "well_below";
}

function comparisonLabel(
  tone: ScoreTileTone,
  source: "channel" | "platform" | "none" | "insufficient",
): string {
  if (source === "insufficient") {return "not enough data yet";}
  const suffix = source === "channel" ? "vs your average" : source === "platform" ? "vs typical" : "";
  switch (tone) {
    case "above": {
      return `↑ above average ${suffix}`.trim();
    }
    case "on_par": {
      return `≈ on par ${suffix}`.trim();
    }
    case "below": {
      return `↓ below average ${suffix}`.trim();
    }
    case "well_below": {
      return `↓ well below average ${suffix}`.trim();
    }
    case "unknown": {
      return "no baseline yet";
    }
  }
}

/**
 * For metrics where 0 is almost certainly "not measured yet" rather than a
 * real reading (CTR, AVD, AVD ratio), normalize 0 to null. Otherwise we
 * compare 0 against the baseline and produce nonsense like "−100% well below
 * average" for low-view videos.
 */
function unmeasuredAsNull(value: number | null | undefined): number | null {
  if (value == null) {return null;}
  return value > 0 ? value : null;
}

function unknownTile(id: ScoreTile["id"], label: string, displayValue: string): ScoreTile {
  return {
    id,
    label,
    displayValue,
    rawValue: null,
    deltaPct: null,
    comparisonLabel: comparisonLabel("unknown", "insufficient"),
    tone: "unknown",
    sparkline: [],
  };
}

function deltaPct(value: number, baseline: number): number | null {
  if (!Number.isFinite(value) || !Number.isFinite(baseline) || baseline <= 0) {
    return null;
  }
  return Math.round(((value - baseline) / baseline) * 1000) / 10;
}

function formatPercent(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

function formatMmSs(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) {return "—";}
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function buildCtrTile(
  derived: ScoreStripDerivedMetrics,
  baseline: ChannelBaselineShape | null,
  hasChannelBaseline: boolean,
): ScoreTile {
  // 0% CTR for a video with views is almost always "not yet computed" — bail
  // to unknown rather than producing −100% delta nonsense.
  const ctr = unmeasuredAsNull(derived.impressionsCtr);
  if (ctr == null) {return unknownTile("ctr", "Impressions CTR", "—");}

  const channelMean = baseline?.impressionsCtr?.mean ?? null;
  const useChannel = hasChannelBaseline && channelMean != null && channelMean > 0;
  const compare = useChannel ? channelMean : PLATFORM_NORM.ctrPct;
  const delta = deltaPct(ctr, compare);
  const tone = tileFromDelta(delta);
  return {
    id: "ctr",
    label: "Impressions CTR",
    displayValue: formatPercent(ctr),
    rawValue: ctr,
    deltaPct: delta,
    comparisonLabel: comparisonLabel(tone, useChannel ? "channel" : "platform"),
    tone,
    sparkline: [],
  };
}

function buildAvdTile(
  derived: ScoreStripDerivedMetrics,
  baseline: ChannelBaselineShape | null,
  hasChannelBaseline: boolean,
): ScoreTile {
  // 0 here means YouTube hasn't computed averageViewDuration yet — typical
  // for very fresh videos or videos under the analytics threshold (~50 viewers).
  const avdSec = unmeasuredAsNull(derived.avgViewDuration);
  const avdRatio = unmeasuredAsNull(derived.avdRatio);
  if (avdSec == null || avdRatio == null) {
    return unknownTile("avd", "Avg View Duration", "—");
  }

  const channelRatio = baseline?.avgViewPercentage?.mean ?? null; // already 0..1
  const useChannel = hasChannelBaseline && channelRatio != null && channelRatio > 0;
  const compare = useChannel ? channelRatio : PLATFORM_NORM.avdRatio;
  const delta = deltaPct(avdRatio, compare);
  const tone = tileFromDelta(delta);
  return {
    id: "avd",
    label: "Avg View Duration",
    displayValue: formatMmSs(avdSec),
    rawValue: avdRatio,
    deltaPct: delta,
    comparisonLabel: comparisonLabel(tone, useChannel ? "channel" : "platform"),
    tone,
    sparkline: [],
  };
}

function buildSubsTile(
  derived: ScoreStripDerivedMetrics,
  baseline: ChannelBaselineShape | null,
  hasChannelBaseline: boolean,
): ScoreTile {
  const subsPer1k = derived.subsPer1k ?? null;
  const channelMean = baseline?.subsPer1k?.mean ?? null;
  const useChannel = hasChannelBaseline && channelMean != null && channelMean > 0;
  const compare = useChannel ? channelMean : PLATFORM_NORM.subsPer1k;
  const delta = subsPer1k != null ? deltaPct(subsPer1k, compare) : null;
  const tone = tileFromDelta(delta);
  const source: "channel" | "platform" | "none" = subsPer1k == null ? "none" : useChannel ? "channel" : "platform";
  return {
    id: "subs",
    label: "Subs / 1K Views",
    displayValue: subsPer1k == null ? "—" : subsPer1k.toFixed(2),
    rawValue: subsPer1k,
    deltaPct: delta,
    comparisonLabel: comparisonLabel(tone, source),
    tone,
    sparkline: [],
  };
}

/**
 * Build the Score Strip from already-gathered analytics + baseline data.
 *
 * `baselineRaw` is the opaque-typed `baseline` field on `InsightContext`,
 * which (when populated) matches the `ChannelBaseline` shape from owned-video-math.
 */
export function buildScoreStripData(
  derived: ScoreStripDerivedMetrics,
  baselineRaw: InsightContext["baseline"],
): ScoreStripData {
  const baseline = baselineRaw as ChannelBaselineShape | null;
  const sample = baseline?.sampleSize ?? null;
  const hasChannelBaseline = sample != null && sample >= MIN_CHANNEL_SAMPLE;
  const baselineConfidence: ScoreStripData["baselineConfidence"] = hasChannelBaseline
    ? "channel"
    : sample != null
      ? "platform"
      : "platform";

  return {
    tiles: [
      buildCtrTile(derived, baseline, hasChannelBaseline),
      buildAvdTile(derived, baseline, hasChannelBaseline),
      buildSubsTile(derived, baseline, hasChannelBaseline),
    ],
    baselineConfidence,
    baselineSampleSize: sample,
  };
}

// ── Retention curve ────────────────────────────────────

/** Subset of TranscriptReport used to label retention rebounds. */
export type RetentionRebountLabelSource = {
  contentStructure?: ReadonlyArray<{
    label: string;
    startTimeSec: number;
    endTimeSec: number;
  }>;
  chunkAnalyses?: ReadonlyArray<{
    startTimeSec: number;
    endTimeSec: number;
    topicSummary: string;
  }>;
};

/**
 * Build a sampled retention curve + annotation list from the raw
 * YouTube Analytics retention curve and the LLM retention section.
 *
 * The LLM retention section provides plain-language drop-off explanations
 * with timestamps; we anchor them to curve coordinates so the chart can
 * render markers that point to the prose underneath.
 *
 * We also extract retention rebounds (local lows followed by local highs)
 * — these are moments viewers re-watch or where late-joiners catch up,
 * which makes them prime candidates to clip into shorts.
 */
export function buildRetentionCurveData(
  rawCurve: ReadonlyArray<{ elapsedRatio: number; audienceWatchRatio: number }>,
  videoDurationSec: number,
  retentionSection: RetentionAnalysis | null,
  youtubeVideoId: string,
  labelSource: RetentionRebountLabelSource | null,
): RetentionCurveData {
  const samples: RetentionCurveSample[] = rawCurve.map((point) => ({
    timeSec: Math.round(point.elapsedRatio * videoDurationSec),
    retention: Math.max(0, Math.min(1, point.audienceWatchRatio)),
  }));

  const annotations: AnnotatedDropOff[] = (retentionSection?.dropOffPoints ?? [])
    .map((p) => annotateDropOff(p, youtubeVideoId))
    .filter((a): a is AnnotatedDropOff => a !== null)
    .slice(0, 6);

  const rebounds = extractRebounds(samples, videoDurationSec, youtubeVideoId, labelSource);

  return {
    samples,
    videoDurationSec,
    annotations,
    rebounds,
  };
}

function findRebounds(
  samples: ReadonlyArray<RetentionCurveSample>,
  videoDurationSec: number,
): Array<{ timeSec: number; liftPct: number }> {
  const tailCutoff = videoDurationSec - REBOUND_TAIL_GUARD_SEC;
  const minLift = REBOUND_THRESHOLD_PTS / 100;
  const found: Array<{ timeSec: number; liftPct: number }> = [];

  // Walk the curve looking for a local minimum followed by a local maximum.
  // Each (min, max) pair where (max - min) >= threshold is a rebound; we
  // record the max point (the actual peak) as the clippable timestamp.
  let lastLow: { idx: number; value: number } | null = { idx: 0, value: samples[0]?.retention ?? 1 };

  for (let i = 1; i < samples.length - 1; i++) {
    const prev = samples[i - 1]!.retention;
    const curr = samples[i]!.retention;
    const next = samples[i + 1]!.retention;

    // Local minimum
    if (curr < prev && curr <= next && (lastLow == null || curr < lastLow.value)) {
      lastLow = { idx: i, value: curr };
      continue;
    }

    // Local maximum after a low — candidate rebound
    if (lastLow != null && curr > prev && curr >= next) {
      const lift = curr - lastLow.value;
      if (lift >= minLift) {
        const timeSec = samples[i]!.timeSec;
        if (timeSec <= tailCutoff) {
          found.push({ timeSec, liftPct: Math.round(lift * 100) });
        }
        lastLow = null; // reset so we capture the next descent → ascent pair
      }
    }
  }

  return found;
}

function extractRebounds(
  samples: ReadonlyArray<RetentionCurveSample>,
  videoDurationSec: number,
  youtubeVideoId: string,
  labelSource: RetentionRebountLabelSource | null,
): RetentionRebound[] {
  if (samples.length < 4 || videoDurationSec <= REBOUND_TAIL_GUARD_SEC * 2) {return [];}

  const candidates = findRebounds(samples, videoDurationSec);
  candidates.sort((a, b) => b.liftPct - a.liftPct);
  const top = candidates.slice(0, MAX_REBOUNDS);
  // Sort the surviving rebounds chronologically so the UI reads top-to-bottom.
  top.sort((a, b) => a.timeSec - b.timeSec);

  return top.map((r) => ({
    timeSec: r.timeSec,
    liftPct: r.liftPct,
    label: labelForTimestamp(r.timeSec, labelSource),
    url: youtubeUrlAt(youtubeVideoId, r.timeSec),
  }));
}

function labelForTimestamp(
  timeSec: number,
  labelSource: RetentionRebountLabelSource | null,
): string | null {
  if (!labelSource) {return null;}
  // Prefer content-structure segment labels (they're concise: "The Big Reveal", "Setup").
  for (const seg of labelSource.contentStructure ?? []) {
    if (timeSec >= seg.startTimeSec && timeSec <= seg.endTimeSec) {
      return seg.label.trim() || null;
    }
  }
  // Fallback to chunk topic summary, truncated.
  for (const chunk of labelSource.chunkAnalyses ?? []) {
    if (timeSec >= chunk.startTimeSec && timeSec <= chunk.endTimeSec) {
      const summary = chunk.topicSummary.trim();
      if (!summary) {return null;}
      return summary.length > 80 ? `${summary.slice(0, 77)}...` : summary;
    }
  }
  return null;
}

function youtubeUrlAt(youtubeVideoId: string, timeSec: number): string {
  const t = Math.max(0, Math.floor(timeSec));
  return `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeVideoId)}&t=${t}s`;
}

function annotateDropOff(
  point: {
    timestamp: string;
    percentDrop: string;
    issue: string;
    reasoning: string;
    action: string;
  },
  youtubeVideoId: string,
): AnnotatedDropOff | null {
  const timeSec = parseTimestamp(point.timestamp);
  const severityPct = parsePercent(point.percentDrop);
  if (timeSec == null || severityPct == null) {return null;}
  const why = [point.issue, point.reasoning].filter(Boolean).join(" — ") || null;
  return {
    timeSec,
    severityPct,
    why,
    action: point.action || null,
    url: youtubeUrlAt(youtubeVideoId, timeSec),
  };
}

function parseTimestamp(raw: string): number | null {
  const m = raw.match(/(\d+):(\d+)(?::(\d+))?/);
  if (!m) {return null;}
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = m[3] ? Number(m[3]) : null;
  if (c != null) {
    // hh:mm:ss
    return a * 3600 + b * 60 + c;
  }
  return a * 60 + b;
}

function parsePercent(raw: string): number | null {
  const m = raw.match(/-?\d+(?:\.\d+)?/);
  if (!m) {return null;}
  const n = Number(m[0]);
  return Number.isFinite(n) ? Math.abs(n) : null;
}

// ── Display helpers (re-exported for components) ───────

export function describeBaselineConfidence(strip: ScoreStripData): string | null {
  if (strip.baselineConfidence === "channel") {return null;}
  if (strip.baselineSampleSize != null && strip.baselineSampleSize > 0) {
    return `Comparing to typical channels — we'll switch to your channel average once you have ${MIN_CHANNEL_SAMPLE}+ recent videos.`;
  }
  return "Comparing to typical channels — channel baseline isn't available yet.";
}

