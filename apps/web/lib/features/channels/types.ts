import type { z } from "zod";

import type { ChannelProfileAI, ChannelProfileInput, CompetitorEntrySchema } from "./schemas";

export type CompetitorEntry = z.infer<typeof CompetitorEntrySchema>;

// ── Constants ───────────────────────────────────────────────────

export const CONTENT_STYLES = [
  "Educational",
  "Entertaining",
  "Opinion/Commentary",
  "Storytelling",
  "Tutorial",
  "Review",
  "Documentary",
  "Vlog",
  "News/Updates",
] as const;

export const CREATOR_STRENGTHS = [
  "On-camera presence",
  "Editing",
  "Storytelling",
  "Research",
  "Humor",
  "Teaching",
  "Visual design",
  "Writing",
  "Interviewing",
] as const;

export const FORMAT_PREFERENCES = [
  "Long-form",
  "Shorts",
  "List/Ranking",
  "How-to",
  "Deep dive",
  "Reaction",
  "Challenge",
  "Interview",
  "Behind-the-scenes",
] as const;

export const SCRIPT_TONES = [
  "Casual & conversational",
  "Professional & authoritative",
  "Energetic & enthusiastic",
  "Calm & thoughtful",
  "Humorous & witty",
  "Direct & no-nonsense",
] as const;

export const TAG_STYLE_PREFERENCES = [
  "Broad & general",
  "Niche & specific",
  "Mix of both",
] as const;

export const SEO_PRIORITIES = [
  "Very important (keyword-rich)",
  "Moderate (natural with some keywords)",
  "Minimal (conversational)",
] as const;

export const PROFILE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "idea-guidance", label: "New idea guidance" },
  { id: "script-guidance", label: "Script guidance" },
  { id: "tag-guidance", label: "Tag guidance" },
  { id: "description-guidance", label: "Description guidance" },
  { id: "competitors", label: "Competitors" },
] as const;

export type ProfileTabId = (typeof PROFILE_TABS)[number]["id"];

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
  overview: {
    channelDescription: "",
    coreTopics: [],
    knownFor: "",
    contentStyles: [],
    creatorStrengths: [],
  },
  ideaGuidance: {
    topicsToLeanInto: "",
    topicsToAvoid: "",
    idealVideo: "",
    formatPreferences: [],
    viewerFeeling: "",
  },
  scriptGuidance: {
    tone: "",
    structurePreference: "",
    styleNotes: "",
    neverInclude: "",
  },
  tagGuidance: {
    primaryKeywords: [],
    nicheTerms: [],
    tagStylePreference: "",
  },
  descriptionGuidance: {
    descriptionFormat: "",
    standardLinks: "",
    seoPriority: "",
  },
  competitors: {
    closeToSize: [],
    aspirational: [],
    nicheHero: [],
    differentiation: "",
  },
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
