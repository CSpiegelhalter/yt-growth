import type { Idea } from "@/types/api";

export type Status = "saved" | "in_progress" | "filmed" | "published";

export type IdeaJsonData = Record<string, unknown> & {
  __detailsGeneratedAt?: string;
  titles?: Array<{ text: string; styleTags?: string[] }>;
  hooks?: Array<{ text: string; typeTags?: string[] }>;
  keywords?: Array<{ text: string }>;
};

export type SavedIdea = {
  id: string;
  ideaId: string;
  youtubeChannelId: string | null;
  title: string;
  angle: string | null;
  ideaJson: Idea;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedDetailsPayload = {
  titles: string[];
  hooks: string[];
  keywords: string[];
  creativeDirections?: {
    titleAngles: string[];
    hookSetups: string[];
    visualMoments: string[];
  } | null;
  remixes?: Array<{ title: string; hook: string; angle: string }>;
};

export const STATUS_LABELS: Record<Status, string> = {
  saved: "Saved",
  in_progress: "In Progress",
  filmed: "Filmed",
  published: "Published",
};

export const FILTER_TABS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "All Ideas" },
  { key: "saved", label: "Saved" },
  { key: "in_progress", label: "In Progress" },
  { key: "filmed", label: "Filmed" },
  { key: "published", label: "Published" },
];

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) { return "Today"; }
  if (days === 1) { return "Yesterday"; }
  if (days < 7) { return `${days} days ago`; }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isEmptyDetailsPayload(payload: GeneratedDetailsPayload): boolean {
  return payload.titles.length === 0 && payload.hooks.length === 0 && payload.keywords.length === 0;
}

export function hasExistingGeneratedDetails(ideaJson: IdeaJsonData): boolean {
  return (
    Boolean(ideaJson.__detailsGeneratedAt) ||
    (Array.isArray(ideaJson.titles) && ideaJson.titles.length > 0) ||
    (Array.isArray(ideaJson.hooks) && ideaJson.hooks.length > 0) ||
    (Array.isArray(ideaJson.keywords) && ideaJson.keywords.length > 0)
  );
}

export function buildEnrichedIdeaJson(existing: IdeaJsonData, payload: GeneratedDetailsPayload): IdeaJsonData {
  return {
    ...existing,
    titles: payload.titles.map((t) => ({ text: t, styleTags: ["specific"] })),
    hooks: payload.hooks.map((h) => ({ text: h, typeTags: ["curiosity"] })),
    keywords: payload.keywords.map((k) => ({ text: k, intent: "search" })),
    __detailsGeneratedAt: new Date().toISOString(),
    __creativeDirections: payload.creativeDirections ?? null,
    __remixes: payload.remixes ?? [],
  };
}
