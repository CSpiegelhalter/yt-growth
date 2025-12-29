import type { IdeaBoardData, Idea, IdeaHook, IdeaKeyword, IdeaTitle } from "@/types/api";

type NormalizeOptions = {
  nicheKeywords?: string[];
};

function asNonEmptyString(v: unknown, fallback = ""): string {
  const s = typeof v === "string" ? v.trim() : "";
  return s || fallback;
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function deriveKeywordsFromTitle(title: string): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4);
  return uniq(words).slice(0, 6);
}

function fallbackHooks(title: string, topic: string): IdeaHook[] {
  const hooks: IdeaHook[] = [
    {
      text: `Stop doing ${topic} wrong — do this instead`,
      typeTags: ["contrarian", "promise"] as IdeaHook["typeTags"],
    },
    {
      text: `I tested ${topic} so you don’t have to`,
      typeTags: ["story", "curiosity"] as IdeaHook["typeTags"],
    },
    {
      text: `If you care about ${topic}, watch this before you start`,
      typeTags: ["curiosity", "promise"] as IdeaHook["typeTags"],
    },
  ];

  return hooks.map((h) => ({
    ...h,
    text: asNonEmptyString(h.text, title).slice(0, 120),
  }));
}

function fallbackTitles(title: string, topic: string): IdeaTitle[] {
  const titles: IdeaTitle[] = [
    {
      text: asNonEmptyString(title, `The Truth About ${topic}`),
      styleTags: ["specific", "outcome"] as IdeaTitle["styleTags"],
    },
    {
      text: `The Complete ${topic} Guide (Start Here)`,
      styleTags: ["authority", "specific"] as IdeaTitle["styleTags"],
    },
    {
      text: `I Tried ${topic} for 7 Days — Here’s What Worked`,
      styleTags: ["personal", "timebound"] as IdeaTitle["styleTags"],
    },
  ];

  return titles.map((t) => ({ ...t, text: asNonEmptyString(t.text, title).slice(0, 120) }));
}

function normalizeHooks(hooks: unknown, title: string, topic: string): IdeaHook[] {
  if (Array.isArray(hooks) && hooks.length) {
    const coerced = hooks
      .map((h: any) => ({
        text: asNonEmptyString(h?.text),
        typeTags: Array.isArray(h?.typeTags) ? (h.typeTags as any[]) : [],
      }))
      .filter((h) => h.text);
    if (coerced.length) return coerced as IdeaHook[];
  }
  return fallbackHooks(title, topic);
}

function normalizeTitles(titles: unknown, title: string, topic: string): IdeaTitle[] {
  if (Array.isArray(titles) && titles.length) {
    const coerced = titles
      .map((t: any) => ({
        text: asNonEmptyString(t?.text),
        styleTags: Array.isArray(t?.styleTags) ? (t.styleTags as any[]) : [],
        basedOnVideoId: typeof t?.basedOnVideoId === "string" ? t.basedOnVideoId : undefined,
        basedOnChannel: typeof t?.basedOnChannel === "string" ? t.basedOnChannel : undefined,
      }))
      .filter((t) => t.text);
    if (coerced.length) return coerced as IdeaTitle[];
  }
  return fallbackTitles(title, topic);
}

function normalizeKeywords(
  keywords: unknown,
  title: string,
  opts?: NormalizeOptions
): IdeaKeyword[] {
  if (Array.isArray(keywords) && keywords.length) {
    const coerced = keywords
      .map((k: any) => ({
        text: asNonEmptyString(k?.text),
        intent:
          k?.intent === "browse" || k?.intent === "suggested" ? k.intent : ("search" as const),
        fit: typeof k?.fit === "string" ? k.fit : undefined,
        monthlySearches: typeof k?.monthlySearches === "string" ? k.monthlySearches : undefined,
        competition:
          k?.competition === "low" || k?.competition === "medium" || k?.competition === "high"
            ? k.competition
            : undefined,
      }))
      .filter((k) => k.text);
    if (coerced.length) return coerced as IdeaKeyword[];
  }

  const seed = uniq([
    ...(opts?.nicheKeywords?.filter(Boolean) ?? []),
    ...deriveKeywordsFromTitle(title),
  ]).slice(0, 8);

  return seed.map((text) => ({
    text,
    intent: "search",
    fit: "Auto-generated fallback",
  }));
}

export function normalizeIdeaBoardData(
  data: unknown,
  opts?: NormalizeOptions
): IdeaBoardData | null {
  if (!data || typeof data !== "object") return null;
  const d: any = data;

  if (!Array.isArray(d.ideas)) return null;

  const ideas: Idea[] = d.ideas.map((raw: any, i: number) => {
    const title = asNonEmptyString(raw?.title, `Idea ${i + 1}`);
    const angle = asNonEmptyString(raw?.angle, "");
    const topic = (opts?.nicheKeywords?.[0] ?? deriveKeywordsFromTitle(title)[0] ?? "this").trim();

    const hooks = normalizeHooks(raw?.hooks, title, topic);
    const titles = normalizeTitles(raw?.titles, title, topic);
    const keywords = normalizeKeywords(raw?.keywords, title, opts);

    const proofBasedOn = Array.isArray(raw?.proof?.basedOn) ? raw.proof.basedOn : [];

    return {
      id: asNonEmptyString(raw?.id, `idea-${i + 1}`),
      title,
      angle,
      whyNow: typeof raw?.whyNow === "string" ? raw.whyNow : undefined,
      estimatedViews: typeof raw?.estimatedViews === "string" ? raw.estimatedViews : undefined,
      format: raw?.format === "shorts" ? "shorts" : "long",
      difficulty:
        raw?.difficulty === "easy" || raw?.difficulty === "medium" || raw?.difficulty === "stretch"
          ? raw.difficulty
          : "medium",
      hooks,
      titles,
      thumbnailConcept: raw?.thumbnailConcept ?? {
        overlayText: topic.toUpperCase().slice(0, 18),
        composition: "Close-up face + key object + big readable text",
        avoid: ["Tiny text", "Busy background", "Low contrast"],
      },
      scriptOutline: raw?.scriptOutline,
      keywords,
      proof: { basedOn: proofBasedOn },
      remixVariants: raw?.remixVariants,
    };
  });

  return {
    channelId: asNonEmptyString(d.channelId, "UNKNOWN"),
    channelTitle: typeof d.channelTitle === "string" ? d.channelTitle : undefined,
    range: d.range === "28d" ? "28d" : "7d",
    generatedAt: asNonEmptyString(d.generatedAt, new Date().toISOString()),
    cachedUntil: asNonEmptyString(d.cachedUntil, new Date(Date.now() + 3600_000).toISOString()),
    ideas,
    nicheInsights: d.nicheInsights ?? { momentumNow: [], patternsToCopy: [], gapsToExploit: [] },
    similarChannels: Array.isArray(d.similarChannels) ? d.similarChannels : [],
    demo: d.demo === true ? true : undefined,
  };
}


