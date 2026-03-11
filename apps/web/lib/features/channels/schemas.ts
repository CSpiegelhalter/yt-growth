import { z } from "zod";

// ── Competitor entry schema ─────────────────────────────────────

export const CompetitorEntrySchema = z.object({
  channelUrl: z.string().max(500),
  channelName: z.string().max(200),
  whatYouAdmire: z.string().max(1000).optional(),
});

// ── Section schemas ─────────────────────────────────────────────

const OverviewSectionSchema = z.object({
  channelDescription: z.string().max(2000).optional(),
  coreTopics: z.array(z.string().max(100)).max(20).optional(),
  knownFor: z.string().max(500).optional(),
  contentStyles: z.array(z.string()).optional(),
  creatorStrengths: z.array(z.string()).optional(),
});

const IdeaGuidanceSectionSchema = z.object({
  topicsToLeanInto: z.string().max(2000).optional(),
  topicsToAvoid: z.string().max(2000).optional(),
  idealVideo: z.string().max(2000).optional(),
  formatPreferences: z.array(z.string()).optional(),
  viewerFeeling: z.string().max(500).optional(),
});

const ScriptGuidanceSectionSchema = z.object({
  tone: z.string().max(200).optional(),
  structurePreference: z.string().max(2000).optional(),
  styleNotes: z.string().max(2000).optional(),
  neverInclude: z.string().max(2000).optional(),
});

const TagGuidanceSectionSchema = z.object({
  primaryKeywords: z.array(z.string().max(100)).max(30).optional(),
  nicheTerms: z.array(z.string().max(100)).max(30).optional(),
  tagStylePreference: z.string().max(200).optional(),
});

const DescriptionGuidanceSectionSchema = z.object({
  descriptionFormat: z.string().max(2000).optional(),
  standardLinks: z.string().max(2000).optional(),
  seoPriority: z.string().max(200).optional(),
});

const CompetitorsSectionSchema = z.object({
  closeToSize: z.array(CompetitorEntrySchema).max(3).optional(),
  aspirational: z.array(CompetitorEntrySchema).max(3).optional(),
  nicheHero: z.array(CompetitorEntrySchema).max(3).optional(),
  differentiation: z.string().max(2000).optional(),
});

// ── Channel profile input (user-submitted form data) ────────────

export const ChannelProfileInputSchema = z.object({
  // Legacy fields (backward compatible)
  description: z.string().max(2000),
  categories: z.array(z.string()).max(5),
  customCategory: z.string().max(100).optional(),
  formats: z.array(z.string()).optional(),
  audience: z.string().max(500).optional(),
  tone: z.array(z.string()).optional(),
  examples: z.array(z.string().max(200)).max(3).optional(),
  goals: z.array(z.string()).optional(),

  // New section-grouped fields
  overview: OverviewSectionSchema.optional(),
  ideaGuidance: IdeaGuidanceSectionSchema.optional(),
  scriptGuidance: ScriptGuidanceSectionSchema.optional(),
  tagGuidance: TagGuidanceSectionSchema.optional(),
  descriptionGuidance: DescriptionGuidanceSectionSchema.optional(),
  competitors: CompetitorsSectionSchema.optional(),
});

export type ChannelProfileInput = z.infer<typeof ChannelProfileInputSchema>;

// ── AI-generated structured profile ─────────────────────────────

export const ChannelProfileAISchema = z.object({
  nicheLabel: z.string(),
  nicheDescription: z.string(),
  primaryCategories: z.array(z.string()),
  contentPillars: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
  targetAudience: z.string(),
  channelValueProposition: z.string(),
  keywords: z.array(z.string()),
  competitorSearchHints: z.array(z.string()),
  videoIdeaAngles: z.array(z.string()),
  toneAndStyle: z.array(z.string()),
});

export type ChannelProfileAI = z.infer<typeof ChannelProfileAISchema>;

// ── Route body schemas ───────────────────────────────────────

export const UpdateProfileBodySchema = z.object({
  input: ChannelProfileInputSchema,
});

export const GenerateProfileBodySchema = z.object({
  force: z.boolean().optional().default(false),
});

export const SuggestProfileFieldBodySchema = z.object({
  field: z.string().min(1),
  section: z.string().min(1),
  currentInput: z.record(z.string(), z.unknown()),
});
