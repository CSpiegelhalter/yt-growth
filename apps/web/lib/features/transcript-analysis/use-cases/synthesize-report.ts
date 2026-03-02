import type { LlmCallFn } from "@/lib/features/video-insights/types";

import type {
  BeatChecklistItem,
  ChunkAnalysisResult,
  ContentSegment,
  DropOffDiagnosis,
  DropOffPoint,
  HookAnalysis,
  PacingScore,
  RetentionKiller,
} from "../types";
import {
  sanitizeBeatChecklist,
  sanitizeContentGaps,
  sanitizeContentStructure,
  sanitizeDropOffDiagnoses,
  sanitizeHookAnalysis,
  sanitizeRetentionKillers,
  sanitizeTimeToValue,
} from "./sanitize-synthesis";

type SynthesizeInput = {
  videoTitle: string;
  videoDurationSec: number;
  totalWordCount: number;
  chunkAnalyses: ChunkAnalysisResult[];
  dropOffPoints: DropOffPoint[];
  verbatimOpening: string | null;
};

function buildSystemPrompt(): string {
  return `You are a cynical YouTube strategist. First classify the video format, then judge it on its own terms.

Return ONLY valid JSON:

{
  "videoFormat": "Tutorial"|"Podcast"|"Vlog"|"Animation"|"Let's Play"|"Review"|"News"|"Short"|"Other",
  "hookAnalysis": {
    "summary": "Assessment of the first 30-60 seconds",
    "deliversOnPromise": true/false,
    "strengths": ["strength 1"],
    "weaknesses": ["weakness 1"],
    "audiencePsychology": "Describe the viewer's emotional state during the hook — what they feel and why they stay or leave",
    "reproduciblePattern": "Named pattern the creator used or should use"
  },
  "contentStructure": [
    { "label": "Intro"|"Main"|"Tangent"|"Outro"|etc, "startTimeSec": 0, "endTimeSec": 60, "description": "brief" }
  ],
  "dropOffDiagnoses": [
    { "timeSec": 120, "severityPct": 12, "reason": "why viewers left", "contentAtMoment": "what was happening" }
  ],
  "topicShiftFrequency": "low"|"medium"|"high",
  "verdict": "Overall pacing assessment in 1-2 sentences",
  "beatChecklist": [
    { "action": "Specific actionable item", "category": "hook"|"pacing"|"structure"|"engagement"|"retention" }
  ],
  "retentionKillers": [
    { "timeSec": 90, "issue": "30-second tangent about unrelated topic", "fix": "Cut entirely or move to end card" }
  ],
  "contentGaps": ["Promise from title not delivered in content"],
  "timeToValueSec": 45
}

Rules:
- videoFormat: Classify FIRST, then judge pacing, valueDensity, and severity relative to that genre. A Let's Play is judged differently from a Tutorial.
- hookAnalysis: Describe the viewer's emotional state, not the creator's technique. If no deliberate hook exists, describe the accidental psychology (e.g. "mild curiosity from the title, but no emotional escalation"). Never return "None" for audiencePsychology.
- contentStructure: No segment may exceed 15 minutes. Use chunk topicSummary data to create granular sub-chapters. Never label a segment just "Main" — always add a qualifier (e.g. "Main: React hooks walkthrough").
  TIMESTAMP BUDGET: The video duration is provided. The endTimeSec of ANY segment MUST NOT exceed the video duration. Every segment must follow chronologically (each startTimeSec >= previous endTimeSec). Use ONLY timestamps that fall within the actual chunk time ranges provided. Do NOT invent or extrapolate timestamps beyond the data.
- dropOffDiagnoses: Only include if drop-off data is provided. Tie each diagnosis to specific transcript content.
- beatChecklist: 5-8 actionable items. Each action MUST reference a specific timestamp or frictionPoint from the chunk data. Generic advice is FAILURE. Bad: "Add a more engaging hook." Good: "Instead of opening with Chris explaining the plan, open with the specific 'S Tier' moment mentioned in the title — show the payoff first, then rewind." Every item must name specific content from THIS video that should change and what should replace it.
- retentionKillers: Every fix must directly address a frictionPoint from the chunk data. Map each retention killer to the specific friction that caused it.
  GENRE AWARENESS: For "Let's Play" videos, flag any math/planning/calculation segments longer than 2 minutes as a "Retention Killer" — viewers came for gameplay energy, not spreadsheets. For Tutorials, flag tangents. For Podcasts, flag monologues without topic shifts.
- contentGaps: Compare the videoTitle to the chunk topicSummaries. If the title promises excitement (e.g. "S Tier RNG") but the content is mostly calculations/planning, explicitly call out the "Title-Content Mismatch." What did the title/hook promise that the content never delivered?
- timeToValueSec: Seconds until the viewer gets their first "aha moment" or payoff. Be strict.
- Return ONLY valid JSON.`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function buildUserPrompt(input: SynthesizeInput): string {
  const timeline = input.chunkAnalyses
    .map(
      (c) =>
        `Chunk ${c.chunkIndex + 1} (${formatTime(c.startTimeSec)}–${formatTime(c.endTimeSec)}): ${c.topicSummary} (pacing: ${c.pacingDensity}, ${c.wordsPerMinute} wpm, value: ${c.valueDensity}/10)${
          c.frictionPoints.length > 0
            ? ` [FRICTION: ${c.frictionPoints.join("; ")}]`
            : ""
        }${c.dropOffHypothesis ? ` [DROP-OFF: ${c.dropOffHypothesis}]` : ""}`,
    )
    .join("\n");

  const allCtas = input.chunkAnalyses
    .flatMap((c) => c.ctas)
    .map((cta) => `- ${formatTime(cta.timeSec)}: [${cta.type}] "${cta.quote}"`)
    .join("\n");

  const dropOffContext =
    input.dropOffPoints.length > 0
      ? `\nDROP-OFF POINTS:\n${input.dropOffPoints
          .map((d) => `- At ${formatTime(d.timeSec)}: ${d.severityPct}% drop`)
          .join("\n")}`
      : "\nNo retention drop-off data available.";

  const openingSection = input.verbatimOpening
    ? `\nVERBATIM OPENING (~first 45 seconds):\n${input.verbatimOpening}`
    : "";

  return `Video: "${input.videoTitle}"
Duration: ${formatTime(input.videoDurationSec)} (${input.videoDurationSec} seconds total — no timestamp may exceed this)
Total words: ${input.totalWordCount}

CHUNK SUMMARIES (timeline):
${timeline}

CTAs FOUND:
${allCtas || "None detected"}
${dropOffContext}
${openingSection}

Synthesize a strategic report for this video. Be specific and actionable.`;
}

function computeDeterministicPacing(
  chunkAnalyses: ChunkAnalysisResult[],
  videoDurationSec: number,
): { avgWordsPerMinute: number; avgSegmentLengthSec: number } {
  const totalWords = chunkAnalyses.reduce(
    (sum, c) => sum + Math.max(c.wordsPerMinute, 0),
    0,
  );
  const avgWordsPerMinute =
    chunkAnalyses.length > 0
      ? Math.round(totalWords / chunkAnalyses.length)
      : 0;
  const avgSegmentLengthSec =
    chunkAnalyses.length > 0
      ? Math.round(videoDurationSec / chunkAnalyses.length)
      : 0;

  return { avgWordsPerMinute, avgSegmentLengthSec };
}

export async function synthesizeReport(
  input: SynthesizeInput,
  callLlm: LlmCallFn,
): Promise<{
  hookAnalysis: HookAnalysis;
  contentStructure: ContentSegment[];
  dropOffDiagnoses: DropOffDiagnosis[];
  pacingScore: PacingScore;
  beatChecklist: BeatChecklistItem[];
  videoFormat: string;
  retentionKillers: RetentionKiller[];
  contentGaps: string[];
  timeToValueSec: number;
}> {
  const result = await callLlm(
    [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(input) },
    ],
    { maxTokens: 2000, temperature: 0.3, responseFormat: "json_object" },
  );

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(result.content) as Record<string, unknown>;
  } catch {
    // Fall through to defaults
  }

  const hookAnalysis = sanitizeHookAnalysis(
    parsed.hookAnalysis as Record<string, unknown> | undefined,
  );
  const contentStructure = sanitizeContentStructure(
    parsed.contentStructure,
    input.videoDurationSec,
  );
  const dropOffDiagnoses = sanitizeDropOffDiagnoses(
    parsed.dropOffDiagnoses,
    input.dropOffPoints,
  );

  const { avgWordsPerMinute, avgSegmentLengthSec } =
    computeDeterministicPacing(input.chunkAnalyses, input.videoDurationSec);

  const pacingScore: PacingScore = {
    avgWordsPerMinute,
    avgSegmentLengthSec,
    topicShiftFrequency:
      typeof parsed.topicShiftFrequency === "string"
        ? parsed.topicShiftFrequency
        : "medium",
    verdict:
      typeof parsed.verdict === "string"
        ? parsed.verdict
        : "Pacing assessment unavailable",
  };

  const beatChecklist = sanitizeBeatChecklist(parsed.beatChecklist);
  const videoFormat =
    typeof parsed.videoFormat === "string" ? parsed.videoFormat : "Other";
  const retentionKillers = sanitizeRetentionKillers(
    parsed.retentionKillers,
    input.videoDurationSec,
  );
  const contentGaps = sanitizeContentGaps(parsed.contentGaps);
  const timeToValueSec = sanitizeTimeToValue(
    parsed.timeToValueSec,
    input.videoDurationSec,
  );

  return {
    hookAnalysis,
    contentStructure,
    dropOffDiagnoses,
    pacingScore,
    beatChecklist,
    videoFormat,
    retentionKillers,
    contentGaps,
    timeToValueSec,
  };
}
