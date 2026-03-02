import type {
  Discoverability,
  DropOffPoint,
  HookAnalysis,
  HookScore,
  PromotionAction,
  PromotionActionType,
  RetentionAnalysis,
  ThumbnailConcept,
  TitleOption,
} from "../types";

const VALID_HOOK_SCORES = new Set<HookScore>(["Strong", "Needs Work", "Weak"]);
const VALID_PROMO_TYPES = new Set<PromotionActionType>(["social", "community", "collaboration", "seo"]);

function sanitizeTitleOption(raw: unknown): TitleOption | null {
  if (!raw || typeof raw !== "object") { return null; }
  const obj = raw as Record<string, unknown>;

  const type = typeof obj.type === "string" ? obj.type.slice(0, 50) : "";
  const text = typeof obj.text === "string" ? obj.text.slice(0, 100) : "";
  const stats = typeof obj.stats === "string" ? obj.stats.slice(0, 50) : "";
  if (!text) { return null; }

  return { type, text, stats };
}

function sanitizeThumbnailConcept(raw: unknown): ThumbnailConcept | null {
  if (!raw || typeof raw !== "object") { return null; }
  const obj = raw as Record<string, unknown>;

  const name = typeof obj.name === "string" ? obj.name.slice(0, 100) : "";
  const overlayText = typeof obj.overlayText === "string" ? obj.overlayText.slice(0, 100) : "";
  const composition = typeof obj.composition === "string" ? obj.composition.slice(0, 200) : "";
  const colorScheme = typeof obj.colorScheme === "string" ? obj.colorScheme.slice(0, 100) : "";
  const emotionToConvey = typeof obj.emotionToConvey === "string" ? obj.emotionToConvey.slice(0, 100) : "";
  if (!name) { return null; }

  return { name, overlayText, composition, colorScheme, emotionToConvey };
}

export function sanitizeDiscoverability(raw: unknown): Discoverability {
  const fallback: Discoverability = { titleOptions: [], descriptionBlock: "", tags: [], thumbnailConcepts: [] };
  if (!raw || typeof raw !== "object") { return fallback; }
  const obj = raw as Record<string, unknown>;

  const titleOptions = Array.isArray(obj.titleOptions)
    ? obj.titleOptions
        .map((t) => sanitizeTitleOption(t))
        .filter((t): t is TitleOption => t !== null)
        .slice(0, 5)
    : [];

  const tags = Array.isArray(obj.tags)
    ? obj.tags.filter((t): t is string => typeof t === "string").slice(0, 20)
    : [];

  const thumbnailConcepts = Array.isArray(obj.thumbnailConcepts)
    ? obj.thumbnailConcepts
        .map((c) => sanitizeThumbnailConcept(c))
        .filter((c): c is ThumbnailConcept => c !== null)
        .slice(0, 2)
    : [];

  return {
    titleOptions,
    descriptionBlock: typeof obj.descriptionBlock === "string" ? obj.descriptionBlock.slice(0, 1000) : "",
    tags,
    thumbnailConcepts,
  };
}

export function sanitizePromotionAction(raw: unknown): PromotionAction | null {
  if (!raw || typeof raw !== "object") { return null; }
  const obj = raw as Record<string, unknown>;

  const type = typeof obj.type === "string" && VALID_PROMO_TYPES.has(obj.type as PromotionActionType)
    ? (obj.type as PromotionActionType)
    : "social";

  const platform = typeof obj.platform === "string" ? obj.platform.slice(0, 50) : "";
  const target = typeof obj.target === "string" ? obj.target.slice(0, 100) : "";
  const action = typeof obj.action === "string" ? obj.action.slice(0, 200) : "";
  const draftText = typeof obj.draftText === "string" ? obj.draftText.slice(0, 500) : "";

  if (!action) { return null; }

  return { type, platform, target, action, draftText };
}

function sanitizeDropOffPoint(raw: unknown): DropOffPoint | null {
  if (!raw || typeof raw !== "object") { return null; }
  const obj = raw as Record<string, unknown>;

  const timestamp = typeof obj.timestamp === "string" ? obj.timestamp : "";
  const percentDrop = typeof obj.percentDrop === "string" ? obj.percentDrop : "";
  const issue = typeof obj.issue === "string" ? obj.issue : "";
  const reasoning = typeof obj.reasoning === "string" ? obj.reasoning : "";
  const action = typeof obj.action === "string" ? obj.action : "";
  const visualCue = typeof obj.visualCue === "string" ? obj.visualCue.slice(0, 300) : "";

  if (!timestamp || !issue) { return null; }

  return { timestamp, percentDrop, issue, reasoning, action, visualCue };
}

export function sanitizeRetention(raw: unknown): RetentionAnalysis {
  const fallback: RetentionAnalysis = { dropOffPoints: [] };
  if (!raw || typeof raw !== "object") { return fallback; }
  const obj = raw as Record<string, unknown>;

  const dropOffPoints = Array.isArray(obj.dropOffPoints)
    ? obj.dropOffPoints
        .map((d) => sanitizeDropOffPoint(d))
        .filter((d): d is DropOffPoint => d !== null)
        .slice(0, 10)
    : [];

  return { dropOffPoints };
}

export function sanitizeHookAnalysis(raw: unknown): HookAnalysis {
  const fallback: HookAnalysis = { score: "Needs Work", issue: "Hook analysis unavailable.", scriptFix: "", currentScript: null };
  if (!raw || typeof raw !== "object") { return fallback; }
  const obj = raw as Record<string, unknown>;

  const score = typeof obj.score === "string" && VALID_HOOK_SCORES.has(obj.score as HookScore)
    ? (obj.score as HookScore)
    : "Needs Work";

  const rawWindow = typeof obj.hookWindowSeconds === "number" ? obj.hookWindowSeconds : undefined;
  const hookWindowSeconds = rawWindow !== undefined
    ? Math.max(5, Math.min(120, Math.round(rawWindow)))
    : undefined;

  return {
    score,
    issue: typeof obj.issue === "string" ? obj.issue : fallback.issue,
    scriptFix: typeof obj.scriptFix === "string" ? obj.scriptFix : "",
    currentScript: typeof obj.currentScript === "string" ? obj.currentScript.slice(0, 500) : null,
    hookWindowSeconds,
  };
}


