/**
 * Channel Profile Types
 * 
 * The channel profile allows users to describe their channel's niche,
 * audience, and style. This complements the auto-inferred niche from videos.
 */

import { z } from "zod";

// ============================================
// CONSTANTS
// ============================================

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


// Cache duration: 3 days
export const PROFILE_CACHE_DAYS = 3;

// ============================================
// USER INPUT TYPES (RAW FORM DATA)
// ============================================

export const ChannelProfileInputSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  categories: z.array(z.string()).min(1, "Select at least one category").max(5),
  customCategory: z.string().max(100).optional(), // When "Other" is selected
  formats: z.array(z.string()).optional(),
  audience: z.string().max(500).optional(),
  tone: z.array(z.string()).optional(),
  examples: z.array(z.string().max(200)).max(3).optional(),
  goals: z.array(z.string()).optional(),
});

export type ChannelProfileInput = z.infer<typeof ChannelProfileInputSchema>;

// ============================================
// AI-GENERATED STRUCTURED PROFILE
// ============================================

export const ChannelProfileAISchema = z.object({
  nicheLabel: z.string(), // Short + specific: "Budget meal prep for busy parents"
  nicheDescription: z.string(), // 1-2 sentences
  primaryCategories: z.array(z.string()), // Normalized
  contentPillars: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })), // 3-6 pillars
  targetAudience: z.string(), // Concise
  channelValueProposition: z.string(), // "Why watch?"
  keywords: z.array(z.string()), // 15-30 niche terms
  competitorSearchHints: z.array(z.string()), // 8-15 hints
  videoIdeaAngles: z.array(z.string()), // 8-15 angles
  toneAndStyle: z.array(z.string()), // Normalized
});

export type ChannelProfileAI = z.infer<typeof ChannelProfileAISchema>;

// ============================================
// FULL PROFILE (STORED IN DB)
// ============================================

export type ChannelProfile = {
  id: string;
  channelId: number;
  // Raw user input
  input: ChannelProfileInput;
  inputHash: string;
  // AI-generated structured profile
  aiProfile: ChannelProfileAI | null;
  // Timestamps
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
};


// ============================================
// DEFAULT/EMPTY PROFILE INPUT
// ============================================

export const DEFAULT_PROFILE_INPUT: ChannelProfileInput = {
  description: "",
  categories: [],
  formats: [],
  audience: "",
  tone: [],
  examples: [],
  goals: [],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a fallback AI profile from raw input when LLM fails
 */
export function createFallbackAIProfile(input: ChannelProfileInput): ChannelProfileAI {
  return {
    nicheLabel: input.categories.slice(0, 2).join(" & ") || "Content Creator",
    nicheDescription: input.description.slice(0, 200) || "YouTube channel",
    primaryCategories: input.categories.slice(0, 3),
    contentPillars: input.categories.slice(0, 3).map(cat => ({
      name: cat,
      description: `Content related to ${cat.toLowerCase()}`,
    })),
    targetAudience: input.audience || "General audience interested in " + (input.categories[0] || "diverse content"),
    channelValueProposition: `Quality ${input.categories[0] || "content"} videos`,
    keywords: [
      ...input.categories.map(c => c.toLowerCase()),
      ...(input.tone || []).map(t => t.toLowerCase()),
    ],
    competitorSearchHints: input.categories.map(c => c.toLowerCase()),
    videoIdeaAngles: input.examples?.filter(Boolean) || [],
    toneAndStyle: input.tone || [],
  };
}
