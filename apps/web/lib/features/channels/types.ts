import type { ChannelProfileInput, ChannelProfileAI } from "./schemas";

// ── Constants ───────────────────────────────────────────────────

export const PROFILE_CATEGORIES = [
  "Gaming",
  "Education",
  "Tech",
  "Fitness",
  "Beauty",
  "Finance",
  "Cooking",
  "Vlogs",
  "Music",
  "Comedy",
  "Parenting",
  "Travel",
  "Sports",
  "News",
  "ASMR",
  "DIY",
  "Business",
  "Other",
] as const;

export const CONTENT_FORMATS = [
  "Long-form",
  "Shorts",
  "Livestreams",
  "Podcasts/Interviews",
  "Tutorials",
  "Reviews",
  "Vlogs",
  "Commentary",
  "Challenges",
  "Documentaries",
] as const;

export const PROFILE_CACHE_DAYS = 3;

export const DEFAULT_PROFILE_INPUT: ChannelProfileInput = {
  description: "",
  categories: [],
  formats: [],
  audience: "",
  tone: [],
  examples: [],
  goals: [],
};

// ── Domain types ────────────────────────────────────────────────

export type ChannelProfile = {
  id: string;
  channelId: number;
  input: ChannelProfileInput;
  inputHash: string;
  aiProfile: ChannelProfileAI | null;
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ── Helper functions ────────────────────────────────────────────

export function createFallbackAIProfile(
  input: ChannelProfileInput,
): ChannelProfileAI {
  return {
    nicheLabel:
      input.categories.slice(0, 2).join(" & ") || "Content Creator",
    nicheDescription: input.description.slice(0, 200) || "YouTube channel",
    primaryCategories: input.categories.slice(0, 3),
    contentPillars: input.categories.slice(0, 3).map((cat) => ({
      name: cat,
      description: `Content related to ${cat.toLowerCase()}`,
    })),
    targetAudience:
      input.audience ||
      `General audience interested in ${ 
        input.categories[0] || "diverse content"}`,
    channelValueProposition: `Quality ${input.categories[0] || "content"} videos`,
    keywords: [
      ...input.categories.map((c) => c.toLowerCase()),
      ...(input.tone || []).map((t) => t.toLowerCase()),
    ],
    competitorSearchHints: input.categories.map((c) => c.toLowerCase()),
    videoIdeaAngles: input.examples?.filter(Boolean) || [],
    toneAndStyle: input.tone || [],
  };
}
