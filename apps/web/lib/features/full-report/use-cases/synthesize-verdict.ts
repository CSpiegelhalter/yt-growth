import type { LlmCallFn } from "@/lib/features/video-insights/types";
import { createLogger } from "@/lib/shared/logger";

import { FullReportError } from "../errors";
import type {
  Discoverability,
  HookAnalysis,
  PrioritiesList,
  Priority,
  PriorityEvidence,
  PriorityRank,
  PrioritySource,
  PromotionAction,
  RetentionAnalysis,
  ScoreStripData,
  Verdict,
  VerdictSeverity,
  VideoAge,
  VideoAudit,
} from "../types";

const log = createLogger({ subsystem: "full-report" });

const VALID_SEVERITY: ReadonlySet<VerdictSeverity> = new Set([
  "outperforming",
  "on_track",
  "underperforming",
  "critical",
]);
const VALID_AGE: ReadonlySet<VideoAge> = new Set(["early", "mature"]);
const VALID_SOURCE: ReadonlySet<PrioritySource> = new Set([
  "retention",
  "hook",
  "audit",
  "discoverability",
  "promotion",
  "score",
]);

const SYSTEM_PROMPT = `You are an experienced YouTube growth coach helping a creator make sense of one of their videos.

You receive five things:
1. A score strip (CTR, AVD, subs/1k) with deltas vs the creator's channel baseline.
2. A pass/fail audit checklist.
3. A retention analysis (drop-off points, why viewers leave, suggested action).
4. A hook analysis (Strong/Needs Work/Weak + script weaknesses).
5. Discoverability + promotion notes (titles, description, tags, share drafts).

You produce TWO things together: a one-line verdict and a ranked list of EXACTLY THREE priorities.

CRITICAL VOICE RULES — break these and you fail:
- Coach voice, not auditor voice. Use "your" / "you". Never "the user", never "the video failed".
- Lead with the action verb, not the diagnosis. "Tighten the first 15 seconds" beats "Hook is weak".
- Specific numbers, not adjectives. "-38%" beats "low".
- Never start with "Unfortunately" or "Sadly".
- Never use the word "failed".
- Match severity to data — don't doom-cast a video that's actually fine.
- For "early" videoAge (≤ 3 days since publish), use action-oriented phrasing — there's still time to act. For "mature", use lesson-oriented phrasing — apply this to the next video.

VERDICT FORMS (pick the one that fits the severity):
- critical:        "[Specific number] of [audience problem] — fix [thing] before anything else."
- underperforming: "This one's underperforming on [metric] — [highest-leverage fix] is the move."
- on_track:        "This is performing roughly to your channel average — [keep doing X]."
- outperforming:   "This is one of your stronger videos on [metric] — here's what to keep doing."

PRIORITIES — exactly 3, ranked by impact:
- Each item draws from one source: retention, hook, audit, discoverability, promotion, or score.
- Don't have all three priorities come from the same source. If only one source has a real problem, use the score strip to pick the second/third.
- "what" — one plain-language sentence about what is wrong.
- "why" — one or two sentences citing the actual numeric evidence (delta vs baseline, drop-off %, AVD ratio).
- "doThis" — 2-4 concrete actions, ordered by tractability.
- "evidence" — { metric, value, baseline } when there is a baseline-comparable number; null otherwise.
- "title" — short, action-led: "Tighten the first 15 seconds", "Rethink title and thumbnail combo", "Fix metadata gaps".

OUTPUT — ONLY valid JSON:
{
  "verdict": {
    "severity": "outperforming" | "on_track" | "underperforming" | "critical",
    "oneLine": "...",
    "videoAge": "early" | "mature"
  },
  "priorities": {
    "items": [
      {
        "rank": 1,
        "title": "...",
        "what": "...",
        "why": "...",
        "doThis": ["...", "..."],
        "evidence": { "metric": "...", "value": "...", "baseline": "..." } | null,
        "sourceSection": "retention" | "hook" | "audit" | "discoverability" | "promotion" | "score"
      },
      { "rank": 2, ... },
      { "rank": 3, ... }
    ]
  }
}

No markdown. No prose outside JSON.`;

type VerdictSynthesisInput = {
  videoTitle: string;
  videoAge: VideoAge;
  scoreStrip: ScoreStripData;
  audit: VideoAudit | null;
  retention: RetentionAnalysis | null;
  hookAnalysis: HookAnalysis | null;
  discoverability: Discoverability | null;
  promotion: PromotionAction[] | null;
};

function formatScoreStripBlock(scoreStrip: VerdictSynthesisInput["scoreStrip"]): string {
  const tiles = scoreStrip.tiles
    .map((t) => {
      const tail = t.deltaPct == null
        ? " (no baseline)"
        : ` (${t.deltaPct > 0 ? "+" : ""}${t.deltaPct}% vs baseline · ${t.tone})`;
      return `- ${t.label}: ${t.displayValue}${tail}`;
    })
    .join("\n");
  const baselineNote = scoreStrip.baselineConfidence === "channel"
    ? `Channel baseline available (n=${scoreStrip.baselineSampleSize ?? "?"}).`
    : `No reliable channel baseline yet — comparisons fall back to platform norms.`;
  return `${tiles}\n${baselineNote}`;
}

function formatAuditBlock(audit: VerdictSynthesisInput["audit"]): string {
  if (!audit) {return "Audit not available.";}
  const fails = audit.items.filter((i) => !i.passed);
  const passes = audit.items.filter((i) => i.passed);
  const failed = fails.map((i) => `${i.criterion} — ${i.action ?? i.detail}`).join("; ") || "(none)";
  return `${fails.length} failed / ${passes.length} passed.\nFAILED: ${failed}`;
}

function formatRetentionBlock(retention: VerdictSynthesisInput["retention"]): string {
  const dropOffs = (retention?.dropOffPoints ?? [])
    .slice(0, 5)
    .map((p) => `- ${p.timestamp} (-${p.percentDrop}): ${p.issue} → ${p.action}`)
    .join("\n");
  return dropOffs || "(none, or no captions available)";
}

function formatHookBlock(hook: VerdictSynthesisInput["hookAnalysis"]): string {
  if (!hook) {return "Hook analysis not available.";}
  return `Score: ${hook.score}\nIssue: ${hook.issue}\nFix: ${hook.scriptFix}`;
}

function formatDiscoverabilityBlock(disc: VerdictSynthesisInput["discoverability"]): string {
  if (!disc) {return "Discoverability not available.";}
  return `Title alternatives: ${disc.titleOptions.length}; tags: ${disc.tags.length}; description suggested: ${disc.descriptionBlock ? "yes" : "no"}.`;
}

function formatPromotionBlock(promotion: VerdictSynthesisInput["promotion"]): string {
  if (!promotion) {return "Promotion not available.";}
  const types = [...new Set(promotion.map((p) => p.type))].join(", ");
  return `Promotion drafts: ${promotion.length} actions across ${types}.`;
}

function buildUserPrompt(input: VerdictSynthesisInput): string {
  return `VIDEO: "${input.videoTitle}"
Age bucket: ${input.videoAge}

SCORE STRIP:
${formatScoreStripBlock(input.scoreStrip)}

AUDIT:
${formatAuditBlock(input.audit)}

RETENTION DROP-OFFS:
${formatRetentionBlock(input.retention)}

HOOK:
${formatHookBlock(input.hookAnalysis)}

DISCOVERABILITY:
${formatDiscoverabilityBlock(input.discoverability)}

PROMOTION:
${formatPromotionBlock(input.promotion)}

Produce the verdict + 3-priority JSON.`;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {return [];}
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0)
    .slice(0, 4);
}

function sanitizeSeverity(raw: unknown): VerdictSeverity {
  return typeof raw === "string" && VALID_SEVERITY.has(raw as VerdictSeverity)
    ? (raw as VerdictSeverity)
    : "underperforming";
}

function sanitizeAge(raw: unknown, fallback: VideoAge): VideoAge {
  return typeof raw === "string" && VALID_AGE.has(raw as VideoAge)
    ? (raw as VideoAge)
    : fallback;
}

function sanitizeSource(raw: unknown, fallback: PrioritySource = "score"): PrioritySource {
  return typeof raw === "string" && VALID_SOURCE.has(raw as PrioritySource)
    ? (raw as PrioritySource)
    : fallback;
}

function sanitizeEvidence(raw: unknown): PriorityEvidence | null {
  if (!raw || typeof raw !== "object") {return null;}
  const obj = raw as Record<string, unknown>;
  const metric = asString(obj.metric);
  const value = asString(obj.value);
  const baseline = asString(obj.baseline);
  if (!metric || !value) {return null;}
  return { metric, value, baseline };
}

function sanitizePriority(raw: unknown, fallbackRank: PriorityRank): Priority | null {
  if (!raw || typeof raw !== "object") {return null;}
  const obj = raw as Record<string, unknown>;
  const title = asString(obj.title);
  const what = asString(obj.what);
  const why = asString(obj.why);
  const doThis = asStringArray(obj.doThis);
  if (!title || !what || doThis.length === 0) {return null;}

  const rank: PriorityRank =
    obj.rank === 1 || obj.rank === 2 || obj.rank === 3 ? obj.rank : fallbackRank;

  return {
    rank,
    title,
    what,
    why,
    doThis,
    evidence: sanitizeEvidence(obj.evidence),
    sourceSection: sanitizeSource(obj.sourceSection),
  };
}

function sanitizeVerdict(
  raw: unknown,
  fallbackAge: VideoAge,
): { verdict: Verdict; priorities: PrioritiesList } {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const verdictRaw = (obj.verdict ?? {}) as Record<string, unknown>;
  const verdict: Verdict = {
    severity: sanitizeSeverity(verdictRaw.severity),
    oneLine: asString(verdictRaw.oneLine, "We've reviewed this video — see priorities below."),
    videoAge: sanitizeAge(verdictRaw.videoAge, fallbackAge),
  };

  const prioritiesRaw = (obj.priorities ?? {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(prioritiesRaw.items) ? prioritiesRaw.items : [];
  const items = itemsRaw
    .map((item, i) => sanitizePriority(item, ((i + 1) as PriorityRank) as PriorityRank))
    .filter((p): p is Priority => p !== null)
    .slice(0, 3)
    .map((p, i) => ({ ...p, rank: ((i + 1) as PriorityRank) }));

  return { verdict, priorities: { items } };
}

export async function synthesizeVerdict(
  input: VerdictSynthesisInput,
  callLlm: LlmCallFn,
): Promise<{ verdict: Verdict; priorities: PrioritiesList }> {
  try {
    const result = await callLlm(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
      { maxTokens: 1200, temperature: 0.4, responseFormat: "json_object" },
    );
    const parsed: unknown = JSON.parse(result.content);
    log.info("verdict synthesis complete");
    return sanitizeVerdict(parsed, input.videoAge);
  } catch (error) {
    log.error("Verdict synthesis failed", { error });
    throw new FullReportError("SECTION_FAILURE", "Verdict synthesis failed", error);
  }
}

export function classifyVideoAge(publishedAt: string | null): VideoAge {
  if (!publishedAt) {return "mature";}
  const ts = Date.parse(publishedAt);
  if (!Number.isFinite(ts)) {return "mature";}
  const ageMs = Date.now() - ts;
  return ageMs <= 3 * 24 * 60 * 60 * 1000 ? "early" : "mature";
}
