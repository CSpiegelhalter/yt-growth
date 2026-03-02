import type {
  BeatChecklistCategory,
  BeatChecklistItem,
  ContentSegment,
  DropOffDiagnosis,
  DropOffPoint,
  HookAnalysis,
  RetentionKiller,
} from "../types";

const VALID_CATEGORIES = new Set<BeatChecklistCategory>([
  "hook",
  "pacing",
  "structure",
  "engagement",
  "retention",
]);

export function sanitizeHookAnalysis(
  hookRaw: Record<string, unknown> | undefined,
): HookAnalysis {
  return {
    summary:
      typeof hookRaw?.summary === "string"
        ? hookRaw.summary
        : "Unable to assess hook",
    deliversOnPromise:
      typeof hookRaw?.deliversOnPromise === "boolean"
        ? hookRaw.deliversOnPromise
        : false,
    strengths: Array.isArray(hookRaw?.strengths)
      ? (hookRaw.strengths as unknown[]).filter(
          (s): s is string => typeof s === "string",
        )
      : [],
    weaknesses: Array.isArray(hookRaw?.weaknesses)
      ? (hookRaw.weaknesses as unknown[]).filter(
          (s): s is string => typeof s === "string",
        )
      : [],
    audiencePsychology:
      typeof hookRaw?.audiencePsychology === "string"
        ? hookRaw.audiencePsychology
        : "Unintentional — describe the accidental effect",
    reproduciblePattern:
      typeof hookRaw?.reproduciblePattern === "string"
        ? hookRaw.reproduciblePattern
        : "None identified",
  };
}

export function sanitizeContentStructure(
  raw: unknown,
  videoDurationSec?: number,
): ContentSegment[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const maxTime = videoDurationSec ?? Infinity;
  return raw
    .filter(
      (s): s is Record<string, unknown> =>
        typeof s === "object" && s !== null,
    )
    .map((s) => ({
      label: typeof s.label === "string" ? s.label : "Unknown",
      startTimeSec: Math.min(
        Math.max(typeof s.startTimeSec === "number" ? s.startTimeSec : 0, 0),
        maxTime,
      ),
      endTimeSec: Math.min(
        Math.max(typeof s.endTimeSec === "number" ? s.endTimeSec : 0, 0),
        maxTime,
      ),
      description:
        typeof s.description === "string" ? s.description : "",
    }));
}

export function sanitizeDropOffDiagnoses(
  raw: unknown,
  dropOffPoints: DropOffPoint[],
): DropOffDiagnosis[] {
  if (dropOffPoints.length === 0) {
    return [];
  }
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter(
      (d): d is Record<string, unknown> =>
        typeof d === "object" && d !== null,
    )
    .map((d) => ({
      timeSec: typeof d.timeSec === "number" ? d.timeSec : 0,
      severityPct:
        typeof d.severityPct === "number" ? d.severityPct : 0,
      reason: typeof d.reason === "string" ? d.reason : "Unknown",
      contentAtMoment:
        typeof d.contentAtMoment === "string"
          ? d.contentAtMoment
          : "",
    }));
}

export function sanitizeBeatChecklist(raw: unknown): BeatChecklistItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter(
      (b): b is Record<string, unknown> =>
        typeof b === "object" && b !== null,
    )
    .map((b) => ({
      action: typeof b.action === "string" ? b.action : "",
      category: VALID_CATEGORIES.has(b.category as BeatChecklistCategory)
        ? (b.category as BeatChecklistCategory)
        : "structure",
    }))
    .filter((b) => b.action.length > 0)
    .slice(0, 8);
}

export function sanitizeRetentionKillers(
  raw: unknown,
  videoDurationSec?: number,
): RetentionKiller[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const maxTime = videoDurationSec ?? Infinity;
  return raw
    .filter(
      (r): r is Record<string, unknown> =>
        typeof r === "object" && r !== null,
    )
    .map((r) => ({
      timeSec: Math.min(
        Math.max(typeof r.timeSec === "number" ? r.timeSec : 0, 0),
        maxTime,
      ),
      issue: typeof r.issue === "string" ? r.issue : "",
      fix: typeof r.fix === "string" ? r.fix : "",
    }))
    .filter((r) => r.issue.length > 0);
}

export function sanitizeContentGaps(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((g): g is string => typeof g === "string")
    .filter((g) => g.length > 0);
}

export function sanitizeTimeToValue(
  raw: unknown,
  videoDurationSec?: number,
): number {
  if (typeof raw === "number" && raw >= 0) {
    const clamped = videoDurationSec
      ? Math.min(raw, videoDurationSec)
      : raw;
    return Math.round(clamped);
  }
  return 0;
}
