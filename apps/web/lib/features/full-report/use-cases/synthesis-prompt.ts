import type { TranscriptReport } from "@/lib/features/transcript-analysis";
import type { SeoAnalysis } from "@/lib/features/video-insights/types";
import type { CompetitiveContextResult } from "@/lib/ports/DataForSeoPort";

import type { GatheredData, InsightContext, VideoSignals } from "../types";

// ── Shared rules applied to all section prompts ────────

const SHARED_SYNTHESIS_RULES = `You are an elite YouTube growth strategist. Produce FINISHED PRODUCTS the creator can copy-paste immediately. Every section must give concrete actions, not generic advice.

RULES:
- NO GENERIC ADVICE. Never use "should" or "consider." Provide finished products — titles to paste, descriptions to copy, pre-written social posts, specific fixes.
- FILTER SUB COUNT NOISE: NEVER mention subscriber counts or channel size in any output. Use subscriber data internally to calibrate tone only.
- Return ONLY valid JSON matching the exact schema specified.`;

// ── Per-section prompt builders ────────────────────────

export function buildDiscoverabilityPrompt(data: GatheredData): {
  system: string;
  user: string;
} {
  const system = `${SHARED_SYNTHESIS_RULES}

Return ONLY valid JSON matching this exact schema:
{
  "titleOptions": [
    { "type": "High Volume", "text": "Ready-to-paste title under 70 chars", "stats": "Volume: 12K | Difficulty: 25" },
    { "type": "Low Competition", "text": "...", "stats": "Volume: 8K | Difficulty: 15" },
    { "type": "Curiosity Gap", "text": "...", "stats": "Volume: 5K | Difficulty: 40" }
  ],
  "descriptionBlock": "Full SEO-optimized YouTube description (150-300 words).",
  "tags": ["tag1", "tag2", "...up to 15 keywords sorted by search volume"],
  "thumbnailConcepts": [
    { "name": "Concept name", "overlayText": "Bold text overlay", "composition": "Subject placement", "colorScheme": "Colors", "emotionToConvey": "Target emotion" }
  ]
}

SECTION RULES:
- Sort titleOptions by search volume (highest first). Each title under 70 characters.
- For titleOptions stats, estimate search volume (e.g. 8K, 15K, 120K) and keyword difficulty (1-100). Use SEO analysis data to inform estimates.
- Tags: lowercase, no duplicates, no hashtags, sorted by estimated search volume.
- The description must follow the SEO sandwich: (1) Top 2 lines — hook + main keyword (before "Show more"), (2) Middle — 2-3 sentences with secondary keywords, (3) End — 3-5 relevant hashtags. 150-300 words total.
- Generate exactly 2 concrete thumbnail concepts with specific overlayText, composition, colorScheme, and emotionToConvey.`;

  return { system, user: buildUserContext(data) };
}

export function buildPromotionPrompt(data: GatheredData): {
  system: string;
  user: string;
} {
  const system = `${SHARED_SYNTHESIS_RULES}

Return ONLY valid JSON matching this exact schema:
{
  "promotionPlaybook": [
    {
      "type": "social" | "community" | "collaboration",
      "platform": "Reddit",
      "target": "r/subreddit",
      "action": "Post discussion thread",
      "draftText": "Pre-written copy the creator can paste"
    }
  ]
}

SECTION RULES:
- Generate 3-5 actions across types: social, community, collaboration. Each has pre-written draftText the creator can copy-paste.
- Be specific — name actual subreddits, forums, or creators relevant to the topic.
- Promotion draftText must be natural and authentic — not promotional spam. Write like a genuine community member sharing something valuable.`;

  return { system, user: buildUserContext(data) };
}

export function buildRetentionPrompt(data: GatheredData): {
  system: string;
  user: string;
} {
  const captionRule = data.hasCaptions
    ? "Transcript data is available — use drop-off diagnoses for retention analysis."
    : "NO CAPTIONS available — return empty dropOffPoints.";

  const system = `${SHARED_SYNTHESIS_RULES}

Return ONLY valid JSON matching this exact schema:
{
  "dropOffPoints": [
    {
      "timestamp": "01:30",
      "percentDrop": "~15% of viewers left",
      "issue": "Navigation Loop",
      "reasoning": "Circling the same area for 30 seconds without new information",
      "action": "Cut to 02:00 or add voiceover explaining the goal",
      "visualCue": "Add a map overlay graphic showing the route"
    }
  ]
}

SECTION RULES:
- Express drop-off as percentage of viewers who left (e.g., "~15% of viewers left"). Use the severityPct from drop-off diagnoses.
- Provide a specific editing action for each drop-off point.
- For each drop-off point, include a specific production suggestion in visualCue (e.g., "Add a countdown timer overlay", "Cut to B-roll of the product") — not generic advice.
- ${captionRule}`;

  return { system, user: buildUserContext(data) };
}

export function buildHookAnalysisPrompt(data: GatheredData): {
  system: string;
  user: string;
} {
  const captionRule = data.hasCaptions
    ? "Transcript data is available — use it for hook analysis. Set currentScript to the verbatim opening words (first 15-20 seconds)."
    : "NO CAPTIONS available — base assessment on title/thumbnail analysis only. Set currentScript to null.";

  const system = String.raw`${SHARED_SYNTHESIS_RULES}

Return ONLY valid JSON matching this exact schema:
{
  "score": "Strong" | "Needs Work" | "Weak",
  "currentScript": "The verbatim opening words from the transcript (first 15-20 seconds), or null if no transcript",
  "issue": "What's wrong with the current hook — be specific",
  "scriptFix": "1. THE STAKE: [spoken sentence]\n2. THE CURIOSITY GAP: [spoken sentence]\n3. THE VELOCITY: [spoken sentence]"
}

SECTION RULES:
- Score the current hook honestly.
- The scriptFix must follow this exact 3-point format: "1. THE STAKE: [spoken sentence teasing the key discovery]\n2. THE CURIOSITY GAP: [spoken sentence posing a compelling question]\n3. THE VELOCITY: [spoken sentence that skips housekeeping and launches into action]".
- Each line is a spoken sentence — no stage directions, no brackets in the actual text. Conversational, specific to their niche.
- ${captionRule}`;

  return { system, user: buildUserContext(data) };
}

function buildUserContext(data: GatheredData): string {
  const { insightContext, transcriptReport, seoAnalysis, competitiveContext, videoSignals } = data;

  const parts = [
    ...buildMetadataLines(insightContext),
    ...buildVideoSignalLines(videoSignals),
    ...buildTranscriptLines(transcriptReport),
    ...buildSeoLines(seoAnalysis),
    ...buildCompetitiveLines(competitiveContext),
  ];

  return parts.join("\n");
}

function buildMetadataLines(ctx: InsightContext): string[] {
  const { derivedData, channel } = ctx;
  const video = derivedData.video;
  const derived = derivedData.derived;

  const lines: string[] = [
    `CHANNEL: ${channel.subscriberCount?.toLocaleString() ?? "unknown"} subscribers`,
    `VIDEO TITLE: "${video.title}"`,
    `DURATION: ${Math.round(video.durationSec / 60)} minutes`,
    `VIEWS: ${derived.totalViews.toLocaleString()}`,
    `VIEWS/DAY: ${derived.viewsPerDay.toFixed(1)}`,
  ];

  if (derived.avdRatio != null) {
    lines.push(`AVG VIEW DURATION RATIO: ${(derived.avdRatio * 100).toFixed(1)}%`);
  }
  if (derived.impressionsCtr != null) {
    lines.push(`IMPRESSIONS CTR: ${(derived.impressionsCtr * 100).toFixed(1)}%`);
  }
  if (ctx.videoPublishedAt) {
    lines.push(`PUBLISHED: ${ctx.videoPublishedAt}`);
  }

  const bottleneck = derivedData.bottleneck;
  if (bottleneck) {
    lines.push(`\nBOTTLENECK: ${bottleneck.bottleneck}\nEVIDENCE: ${bottleneck.evidence}`);
  }

  return lines;
}

function buildVideoSignalLines(signals: VideoSignals): string[] {
  return [
    "\n--- VIDEO SIGNALS (pre-parsed) ---",
    `TITLE LENGTH: ${signals.titleLength} chars`,
    `DESCRIPTION LINKS: ${signals.descriptionLinkCount}`,
    `HAS TIMESTAMPS: ${signals.hasTimestamps}`,
    `HASHTAG COUNT: ${signals.hashtagCount}`,
    `CTA COUNT (from transcript): ${signals.ctaCount}`,
    `HAS CAPTIONS: ${signals.hasCaptions}`,
  ];
}

function buildTranscriptLines(report: TranscriptReport | null): string[] {
  if (!report) { return []; }

  const lines: string[] = [
    "\n--- TRANSCRIPT ANALYSIS ---",
    `FORMAT: ${report.videoFormat}`,
    `HOOK: ${report.hookAnalysis.summary}`,
    `HOOK STRENGTHS: ${report.hookAnalysis.strengths.join("; ")}`,
    `HOOK WEAKNESSES: ${report.hookAnalysis.weaknesses.join("; ")}`,
    `TIME TO VALUE: ${report.timeToValueSec}s`,
    `PACING: ${report.pacingScore.verdict}`,
  ];

  if (report.retentionKillers.length > 0) {
    const killers = report.retentionKillers
      .slice(0, 5)
      .map((k) => `  @${k.timeSec}s: ${k.issue} → ${k.fix}`)
      .join("\n");
    lines.push(`RETENTION KILLERS:\n${killers}`);
  }

  const verbatimOpening = report.chunkAnalyses[0]?.verbatimOpening;
  if (verbatimOpening) {
    lines.push(`VERBATIM OPENING (first ~15s): "${verbatimOpening}"`);
  }

  if (report.contentGaps.length > 0) {
    lines.push(`CONTENT GAPS: ${report.contentGaps.join("; ")}`);
  }

  if (report.dropOffDiagnoses.length > 0) {
    const drops = report.dropOffDiagnoses
      .slice(0, 5)
      .map((d) => `  @${d.timeSec}s (${d.severityPct}%): ${d.reason} — "${d.contentAtMoment}"`)
      .join("\n");
    lines.push(`DROP-OFF POINTS:\n${drops}`);
  }

  const topKeywords = report.topKeywords.slice(0, 10).join(", ");
  if (topKeywords) {
    lines.push(`TOP KEYWORDS: ${topKeywords}`);
  }

  return lines;
}

function buildSeoLines(seo: SeoAnalysis | null): string[] {
  if (!seo) { return []; }

  const lines: string[] = ["\n--- SEO ANALYSIS ---"];

  if (seo.focusKeyword) {
    lines.push(`FOCUS KEYWORD: "${seo.focusKeyword.keyword}" (${seo.focusKeyword.confidence})`);
  }

  lines.push(
    `TITLE SCORE: ${seo.titleAnalysis.score}/10`,
    `TITLE WEAKNESSES: ${seo.titleAnalysis.weaknesses.join("; ")}`,
    `TITLE SUGGESTIONS: ${seo.titleAnalysis.suggestions.join(" | ")}`,
    `DESCRIPTION SCORE: ${seo.descriptionAnalysis.score}/10`,
    `DESCRIPTION WEAKNESSES: ${seo.descriptionAnalysis.weaknesses.join("; ")}`,
    `TAG SCORE: ${seo.tagAnalysis.score}/10 (impact: ${seo.tagAnalysis.impactLevel})`,
    `MISSING TAGS: ${seo.tagAnalysis.missing.slice(0, 10).join(", ")}`,
  );

  return lines;
}

function buildCompetitiveLines(ctx: CompetitiveContextResult | null): string[] {
  if (!ctx) { return []; }

  const lines: string[] = ["\n--- COMPETITIVE CONTEXT ---"];

  if (ctx.searchRankings?.length) {
    const rankings = ctx.searchRankings
      .map((r) => `  "${r.term}": position ${r.position ?? "not ranked"}, expected CTR ${r.expectedCtr.toFixed(1)}%, actual CTR ${r.actualCtr.toFixed(1)}%`)
      .join("\n");
    lines.push(`SEARCH RANKINGS:\n${rankings}`);
  }

  if (ctx.topicTrends) {
    lines.push(`TOPIC TREND: ${ctx.topicTrends.trend} (interest: ${ctx.topicTrends.recentInterest})`);
  }

  if (ctx.similarVideos?.length) {
    const similar = ctx.similarVideos
      .slice(0, 3)
      .map((v) => `  "${v.title}" — ${v.views?.toLocaleString() ?? "?"} views`)
      .join("\n");
    lines.push(`COMPETING VIDEOS:\n${similar}`);
  }

  return lines;
}
