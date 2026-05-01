/**
 * Compute deterministic, non-obvious "Patterns we noticed" signals
 * from already-gathered data. No new LLM calls.
 *
 * Each insight cross-references at least two data sources so the finding
 * is something the creator could not get from YouTube Studio alone:
 *
 *   - retention curve × transcript CTAs           → CTA timing
 *   - retention curve × time-to-value             → hook delay
 *   - transcript retention killers × analytics    → script-level kills
 *   - title × transcript top keywords             → keyword alignment
 *   - SEO tag analysis × traffic sources          → tag opportunity
 *   - description signals × niche norms           → completeness
 *   - engagement metrics × channel baseline       → engagement gap
 *   - pacing × content gaps                       → structure issues
 *
 * Insights are ordered by severity then category, and capped at 8 to
 * avoid the "wall of advice" that violates Hick's Law.
 */

import type {
GatheredData, InsightContext, 
  ReportSectionKey,
  Signal,
  SignalCategory,
  SignalsData,
  SignalSeverity} from "../types";

const MAX_SIGNALS = 8;

type SignalContext = {
  gathered: GatheredData;
  insightContext: InsightContext;
  /** Already-rendered retention curve data with annotations. */
  retentionCurveSec: ReadonlyArray<{ timeSec: number; retention: number }>;
  videoDurationSec: number;
};

type DerivedShape = {
  impressionsCtr?: number | null;
  avgViewDuration?: number | null;
  avdRatio?: number | null;
  subsPer1k?: number | null;
  commentsPer1k?: number | null;
  likesPer1k?: number | null;
  totalViews?: number;
};

// ── Insight: CTA timing vs retention ──────────────────

function ctaTimingSignal(ctx: SignalContext): Signal | null {
  const ctas = ctx.gathered.transcriptReport?.allCtas ?? [];
  if (ctas.length === 0 || ctx.retentionCurveSec.length < 2) {return null;}

  // Find peak retention window (5+ second contiguous span with highest retention)
  const peak = findPeakRetentionWindow(ctx.retentionCurveSec);
  if (!peak) {return null;}

  // Locate the highest-impact CTA by type priority and retention at its timestamp
  const subscribeCta = ctas.find((c) => c.type === "subscribe");
  const focus = subscribeCta ?? ctas[0];
  if (!focus) {return null;}

  const retentionAtCta = retentionAt(ctx.retentionCurveSec, focus.timeSec);
  if (retentionAtCta == null) {return null;}

  // If CTA is in the peak window already, that's good news.
  const inPeak = focus.timeSec >= peak.startSec && focus.timeSec <= peak.endSec;
  const ctaPct = Math.round(retentionAtCta * 100);
  const peakPct = Math.round(peak.retention * 100);

  if (inPeak) {
    return {
      id: "cta-timing-good",
      category: "timing",
      severity: "good",
      headline: `Your subscribe ask is well-timed`,
      body: `You ask viewers to subscribe at ${formatTime(focus.timeSec)} when ${ctaPct}% are still watching — that's inside the peak retention window (${formatTime(peak.startSec)}–${formatTime(peak.endSec)}).`,
      recommendation: null,
      evidence: [
        { label: "CTA at", value: formatTime(focus.timeSec) },
        { label: "Retention there", value: `${ctaPct}%` },
      ],
      confidence: "high",
    };
  }

  // CTA outside peak window AND notably lower retention than peak — recommend moving it.
  if (peakPct - ctaPct < 12) {return null;}

  return {
    id: "cta-timing-late",
    category: "timing",
    severity: "improvement",
    headline: `Your CTA lands after most viewers have left`,
    body: `You ask viewers to ${focus.type === "subscribe" ? "subscribe" : focus.type} at ${formatTime(focus.timeSec)}, when only ${ctaPct}% are still watching. Peak retention was at ${formatTime(peak.startSec)}–${formatTime(peak.endSec)} (${peakPct}%).`,
    recommendation: `Move your subscribe ask into the ${formatTime(peak.startSec)}–${formatTime(peak.endSec)} window in your next video — that's when your audience is most engaged.`,
    evidence: [
      { label: "CTA at", value: formatTime(focus.timeSec) },
      { label: "Retention there", value: `${ctaPct}%` },
      { label: "Peak window", value: `${formatTime(peak.startSec)}–${formatTime(peak.endSec)} (${peakPct}%)` },
    ],
    confidence: "high",
  };
}

// ── Insight: time-to-value (hook delay) ───────────────

function timeToValueSignal(ctx: SignalContext): Signal | null {
  const ttv = ctx.gathered.transcriptReport?.timeToValueSec;
  if (ttv == null || ttv <= 0) {return null;}

  const retentionAt30 = retentionAt(ctx.retentionCurveSec, 30);
  const retentionAtHook = retentionAt(ctx.retentionCurveSec, ttv);
  if (retentionAt30 == null || retentionAtHook == null) {return null;}

  // Drop in first 30s
  const start = ctx.retentionCurveSec[0]?.retention ?? 1;
  const earlyDropPct = Math.round((start - retentionAt30) * 100);

  // Good case: time-to-value under 15s
  if (ttv <= 15) {
    return {
      id: "hook-fast",
      category: "structure",
      severity: "good",
      headline: `You deliver the value prop in the first ${ttv}s`,
      body: `Viewers learn what they're getting by ${formatTime(ttv)} — that's why ${Math.round(retentionAtHook * 100)}% of them are still watching at the hook landing.`,
      recommendation: null,
      evidence: [
        { label: "Time to value", value: `${ttv}s` },
        { label: "Retention at hook", value: `${Math.round(retentionAtHook * 100)}%` },
      ],
      confidence: "high",
    };
  }

  // Bad case: time-to-value > 20s AND meaningful early drop
  if (ttv >= 20 && earlyDropPct >= 12) {
    return {
      id: "hook-slow",
      category: "structure",
      severity: "critical",
      headline: `Your value prop lands too late`,
      body: `It takes ${formatTime(ttv)} to make the concrete promise — but you've already lost ${earlyDropPct}% of viewers by ${formatTime(30)}. The hook is being killed before it lands.`,
      recommendation: `Cut everything before your value prop. Open with the question or promise and let the rest follow.`,
      evidence: [
        { label: "Time to value", value: formatTime(ttv) },
        { label: "Drop by 0:30", value: `−${earlyDropPct}%` },
      ],
      confidence: "high",
    };
  }

  return null;
}

// ── Insight: transcript retention killers ──────────────

function retentionKillerSignal(ctx: SignalContext): Signal | null {
  const killers = ctx.gathered.transcriptReport?.retentionKillers ?? [];
  const top = killers[0];
  if (!top) {return null;}
  return {
    id: `retention-killer-${top.timeSec}`,
    category: "structure",
    severity: "improvement",
    headline: `Script-level retention kill at ${formatTime(top.timeSec)}`,
    body: top.issue,
    recommendation: top.fix,
    evidence: [{ label: "Timestamp", value: formatTime(top.timeSec) }],
    confidence: "medium",
  };
}

// ── Insight: title × transcript top-keyword alignment ──

function keywordAlignmentSignal(ctx: SignalContext): Signal | null {
  const keywords = ctx.gathered.transcriptReport?.topKeywords ?? [];
  const title = ctx.insightContext.derivedData.video.title;
  if (keywords.length === 0 || !title) {return null;}

  const titleLower = title.toLowerCase();
  const missing = keywords
    .slice(0, 6)
    .filter((kw) => kw.length >= 3 && !titleLower.includes(kw.toLowerCase()))
    .slice(0, 3);

  if (missing.length === 0) {
    return {
      id: "keyword-alignment-good",
      category: "discovery",
      severity: "good",
      headline: `Title aligns with what your video actually delivers`,
      body: `Your top transcript keywords appear in the title — search ranking for the topic you actually covered should hold.`,
      recommendation: null,
      confidence: "medium",
    };
  }

  return {
    id: "keyword-alignment",
    category: "discovery",
    severity: "improvement",
    headline: `Title misses ${missing.length} of your video's top keywords`,
    body: `Your transcript leans heavily on ${missing.map((m) => `"${m}"`).join(", ")} but none appear in the title. Search ranking for what the video actually covers is leaving views on the table.`,
    recommendation: `Try a title variant that includes one of: ${missing.map((m) => `"${m}"`).join(", ")}.`,
    evidence: [{ label: "Missing keywords", value: missing.join(", ") }],
    confidence: "medium",
  };
}

// ── Insight: SEO tag opportunity ──────────────────────

function tagOpportunitySignal(ctx: SignalContext): Signal | null {
  const seo = ctx.gathered.seoAnalysis;
  if (!seo) {return null;}

  const missing = seo.tagAnalysis.missing.slice(0, 4);
  if (missing.length === 0) {return null;}
  if (seo.tagAnalysis.impactLevel === "low") {return null;}

  return {
    id: "tag-opportunity",
    category: "discovery",
    severity: seo.tagAnalysis.impactLevel === "high" ? "critical" : "improvement",
    headline: `${missing.length} high-impact tag${missing.length === 1 ? "" : "s"} missing`,
    body: `${seo.tagAnalysis.feedback} Adding tags like ${missing.map((m) => `"${m}"`).join(", ")} could surface you in suggested feeds you're not currently showing up in.`,
    recommendation: `Add to your tags: ${missing.join(", ")}.`,
    evidence: [{ label: "Suggested tags", value: missing.join(", ") }],
    confidence: seo.tagAnalysis.impactLevel === "high" ? "high" : "medium",
  };
}

// ── Insight: description completeness ──────────────────

function descriptionCompletenessSignal(ctx: SignalContext): Signal | null {
  const sig = ctx.gathered.videoSignals;
  const seo = ctx.gathered.seoAnalysis;
  const description = ctx.insightContext.derivedData.video.description ?? "";
  const wordCount = description.split(/\s+/).filter(Boolean).length;

  const missing: string[] = [];
  if (wordCount < 50) {missing.push(`substantive description text (currently ${wordCount} words)`);}
  if (!sig.hasTimestamps) {missing.push("chapter timestamps");}
  if (sig.descriptionLinkCount === 0) {missing.push("links (related videos / channel / resources)");}

  if (missing.length === 0) {return null;}

  const seoScore = seo?.descriptionAnalysis.score ?? null;
  const severity: SignalSeverity = missing.length >= 2 || (seoScore != null && seoScore < 5) ? "improvement" : "neutral";

  return {
    id: "description-completeness",
    category: "discovery",
    severity,
    headline: `Description is missing ${missing.length} thing${missing.length === 1 ? "" : "s"} top videos always have`,
    body: `Your description is missing ${missing.join(", ")}. Description quality directly affects browse-time and search ranking; YouTube reads the first 150 chars to decide what your video is about.`,
    recommendation: seo?.descriptionAnalysis.addTheseLines.length
      ? `Add: "${seo.descriptionAnalysis.addTheseLines[0]}"`
      : `Add chapter markers in the description (0:00 Intro, 1:30 Topic A, ...) and a link to a related video.`,
    evidence: [
      { label: "Word count", value: `${wordCount}` },
      { label: "Chapter timestamps", value: sig.hasTimestamps ? "yes" : "no" },
      { label: "Links", value: `${sig.descriptionLinkCount}` },
    ],
    confidence: "high",
  };
}

// ── Insight: engagement gap diagnostic ─────────────────

const LOW_COMMENTS_PER_1K = 0.5;
const LOW_LIKES_PER_1K = 8;

function engagementCopy(isLowComments: boolean): { body: string; recommendation: string } {
  if (isLowComments) {
    return {
      body: `Comments per 1K is low — viewers consumed but didn't react. Videos that explicitly ask a specific question in the first 30 seconds get 2× the comment rate.`,
      recommendation: `End the next video with one specific, concrete question — not "what do you think?" but "Should I do part 2 on X or Y?"`,
    };
  }
  return {
    body: `Likes per 1K is below typical. Asking for a like at the moment of a payoff (rather than at the start) tends to lift like rate noticeably.`,
    recommendation: `Move your "if this helped, hit like" prompt to right after a payoff moment instead of the intro.`,
  };
}

function engagementEvidence(
  commentsPer1k: number | null,
  likesPer1k: number | null,
  channelEngagementAvg: number | null,
): { label: string; value: string }[] {
  const evidence: { label: string; value: string }[] = [];
  if (commentsPer1k != null) {evidence.push({ label: "Comments / 1K", value: commentsPer1k.toFixed(2) });}
  if (likesPer1k != null) {evidence.push({ label: "Likes / 1K", value: likesPer1k.toFixed(1) });}
  if (channelEngagementAvg != null) {evidence.push({ label: "Channel engagement avg", value: channelEngagementAvg.toFixed(3) });}
  return evidence;
}

function engagementGapSignal(ctx: SignalContext): Signal | null {
  const derived = ctx.insightContext.derivedData.derived as DerivedShape;
  const baseline = (ctx.insightContext.baseline ?? {}) as Record<string, { mean?: number } | undefined>;

  const commentsPer1k = derived.commentsPer1k ?? null;
  const likesPer1k = derived.likesPer1k ?? null;
  if (commentsPer1k == null && likesPer1k == null) {return null;}

  const isLowComments = commentsPer1k != null && commentsPer1k < LOW_COMMENTS_PER_1K;
  const isLowLikes = likesPer1k != null && likesPer1k < LOW_LIKES_PER_1K;
  if (!isLowComments && !isLowLikes) {return null;}

  const copy = engagementCopy(isLowComments);

  return {
    id: "engagement-gap",
    category: "engagement",
    severity: "improvement",
    headline: `Engagement is below the bar viewers usually clear`,
    body: copy.body,
    recommendation: copy.recommendation,
    evidence: engagementEvidence(commentsPer1k, likesPer1k, baseline.engagementPerView?.mean ?? null),
    confidence: "medium",
  };
}

// ── Insight: pacing / structure ────────────────────────

function pacingSignal(ctx: SignalContext): Signal | null {
  const pacing = ctx.gathered.transcriptReport?.pacingScore;
  if (!pacing) {return null;}

  const verdict = pacing.verdict.toLowerCase();
  const isSlow = verdict.includes("slow") || pacing.avgWordsPerMinute < 110;
  const isRushed = pacing.avgWordsPerMinute > 200;

  if (!isSlow && !isRushed) {return null;}

  if (isSlow) {
    return {
      id: "pacing-slow",
      category: "structure",
      severity: "improvement",
      headline: `Pacing is slow — ${Math.round(pacing.avgWordsPerMinute)} words / min`,
      body: `Pacing analysis: "${pacing.verdict}". Most retention-friendly videos in this category land at 130–180 wpm. Slow segments and long topic shifts let the viewer's attention wander.`,
      recommendation: `Tighten cuts: remove 'umm/uh' takes, shorten transitional pauses, and split long sentences in your script.`,
      evidence: [
        { label: "Words / min", value: String(Math.round(pacing.avgWordsPerMinute)) },
        { label: "Avg segment", value: `${Math.round(pacing.avgSegmentLengthSec)}s` },
      ],
      confidence: "medium",
    };
  }

  return {
    id: "pacing-rushed",
    category: "structure",
    severity: "improvement",
    headline: `Pacing is rushed — ${Math.round(pacing.avgWordsPerMinute)} words / min`,
    body: `At ${Math.round(pacing.avgWordsPerMinute)} wpm you're well above the 130–180 wpm sweet spot. Viewers can't absorb the content; retention often drops in dense informational sections.`,
    recommendation: `Add brief recap moments after each major point ("so to recap…") and let the audio breathe between segments.`,
    evidence: [{ label: "Words / min", value: String(Math.round(pacing.avgWordsPerMinute)) }],
    confidence: "medium",
  };
}

// ── Insight: content gaps from transcript ──────────────

function contentGapSignal(ctx: SignalContext): Signal | null {
  const gaps = ctx.gathered.transcriptReport?.contentGaps ?? [];
  if (gaps.length === 0) {return null;}

  const gap = gaps[0]!;
  return {
    id: "content-gap",
    category: "structure",
    severity: "neutral",
    headline: `Content gap detected`,
    body: gap,
    recommendation: gaps[1] ? `Other gaps: ${gaps.slice(1, 3).join("; ")}` : null,
    confidence: "medium",
  };
}

// ── Orchestrator ───────────────────────────────────────

function compareSeverity(a: SignalSeverity, b: SignalSeverity): number {
  const order: Record<SignalSeverity, number> = {
    critical: 0,
    improvement: 1,
    neutral: 2,
    good: 3,
  };
  return order[a] - order[b];
}

function compareCategory(a: SignalCategory, b: SignalCategory): number {
  const order: Record<SignalCategory, number> = {
    structure: 0,
    timing: 1,
    discovery: 2,
    engagement: 3,
    packaging: 4,
    audience: 5,
  };
  return order[a] - order[b];
}

export function computeSignals(
  gathered: GatheredData,
  retentionCurveSec: ReadonlyArray<{ timeSec: number; retention: number }>,
  videoDurationSec: number,
): SignalsData {
  const ctx: SignalContext = {
    gathered,
    insightContext: gathered.insightContext,
    retentionCurveSec,
    videoDurationSec,
  };

  const candidates: Array<Signal | null> = [
    ctaTimingSignal(ctx),
    timeToValueSignal(ctx),
    retentionKillerSignal(ctx),
    keywordAlignmentSignal(ctx),
    tagOpportunitySignal(ctx),
    descriptionCompletenessSignal(ctx),
    engagementGapSignal(ctx),
    pacingSignal(ctx),
    contentGapSignal(ctx),
  ];

  const items = candidates
    .filter((s): s is Signal => s !== null)
    .sort((a, b) => compareSeverity(a.severity, b.severity) || compareCategory(a.category, b.category))
    .slice(0, MAX_SIGNALS);

  return { items };
}

// ── Helpers ────────────────────────────────────────────

function retentionAt(
  curve: ReadonlyArray<{ timeSec: number; retention: number }>,
  timeSec: number,
): number | null {
  if (curve.length === 0) {return null;}
  if (timeSec <= curve[0]!.timeSec) {return curve[0]!.retention;}
  const last = curve.at(-1)!;
  if (timeSec >= last.timeSec) {return last.retention;}

  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1]!;
    const b = curve[i]!;
    if (b.timeSec >= timeSec) {
      const span = b.timeSec - a.timeSec || 1;
      const t = (timeSec - a.timeSec) / span;
      return a.retention + (b.retention - a.retention) * t;
    }
  }
  return null;
}

function findPeakRetentionWindow(
  curve: ReadonlyArray<{ timeSec: number; retention: number }>,
): { startSec: number; endSec: number; retention: number } | null {
  if (curve.length < 3) {return null;}

  // Peak window = the contiguous span (3+ samples) with the highest mean retention,
  // scanning a sliding window of 3 samples.
  let bestStart = 0;
  let bestMean = 0;
  for (let i = 0; i + 2 < curve.length; i++) {
    const mean = (curve[i]!.retention + curve[i + 1]!.retention + curve[i + 2]!.retention) / 3;
    if (mean > bestMean) {
      bestMean = mean;
      bestStart = i;
    }
  }

  return {
    startSec: curve[bestStart]!.timeSec,
    endSec: curve[bestStart + 2]!.timeSec,
    retention: bestMean,
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Re-export the section key list helper used by stream-full-report
export const SIGNAL_SECTION_KEY: ReportSectionKey = "signals";
