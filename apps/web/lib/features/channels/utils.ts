import { stableHash } from "@/lib/shared/stable-hash";

import type { ChannelProfileInput } from "./schemas";
import { PROFILE_CACHE_DAYS } from "./types";

/**
 * Compute a stable hash from the profile input for cache invalidation
 */
export function computeProfileInputHash(input: ChannelProfileInput): string {
  return stableHash({
    description: input.description.toLowerCase().trim(),
    categories: [...input.categories].sort(),
    customCategory: (input.customCategory || "").toLowerCase().trim(),
    formats: [...(input.formats || [])].sort(),
    audience: (input.audience || "").toLowerCase().trim(),
    tone: [...(input.tone || [])].sort(),
    examples: (input.examples || []).map((e) => e.toLowerCase().trim()).sort(),
    goals: [...(input.goals || [])].sort(),
    overview: input.overview ?? null,
    ideaGuidance: input.ideaGuidance ?? null,
    scriptGuidance: input.scriptGuidance ?? null,
    tagGuidance: input.tagGuidance ?? null,
    descriptionGuidance: input.descriptionGuidance ?? null,
    competitors: input.competitors ?? null,
  });
}

/**
 * Check if the AI profile cache is still valid
 */
export function isProfileCacheValid(
  lastGeneratedAt: Date | null,
  currentInputHash: string,
  storedInputHash: string,
): boolean {
  if (currentInputHash !== storedInputHash) {
    return false;
  }

  if (!lastGeneratedAt) {
    return false;
  }

  const cacheExpiresAt = new Date(lastGeneratedAt);
  cacheExpiresAt.setDate(cacheExpiresAt.getDate() + PROFILE_CACHE_DAYS);

  return new Date() < cacheExpiresAt;
}

/**
 * Sanitize user-provided text for safe storage and rendering.
 * Removes potential XSS vectors while preserving legitimate content.
 */
export function sanitizeUserText(text: string): string {
  return text
    .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replaceAll(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replaceAll(/javascript:/gi, "");
}

/**
 * Sanitize the entire profile input
 */
export function sanitizeProfileInput(
  input: ChannelProfileInput,
): ChannelProfileInput {
  const optText = (v: string | undefined) =>
    v ? sanitizeUserText(v) : undefined;
  const optArr = (a: string[] | undefined) => a?.map(sanitizeUserText);
  const sanitizeCompetitors = (
    entries: { channelUrl: string; channelName: string; whatYouAdmire?: string }[] | undefined,
  ) =>
    entries?.map((e) => ({
      channelUrl: sanitizeUserText(e.channelUrl),
      channelName: sanitizeUserText(e.channelName),
      whatYouAdmire: optText(e.whatYouAdmire),
    }));

  return {
    description: sanitizeUserText(input.description),
    categories: input.categories.map((c) => sanitizeUserText(c)),
    customCategory: optText(input.customCategory),
    formats: optArr(input.formats),
    audience: optText(input.audience),
    tone: optArr(input.tone),
    examples: optArr(input.examples),
    goals: optArr(input.goals),

    overview: input.overview
      ? {
          channelDescription: optText(input.overview.channelDescription),
          knownFor: optText(input.overview.knownFor),
          coreTopics: optArr(input.overview.coreTopics),
          contentStyles: optArr(input.overview.contentStyles),
          creatorStrengths: optArr(input.overview.creatorStrengths),
        }
      : undefined,
    ideaGuidance: input.ideaGuidance
      ? {
          topicsToLeanInto: optText(input.ideaGuidance.topicsToLeanInto),
          topicsToAvoid: optText(input.ideaGuidance.topicsToAvoid),
          idealVideo: optText(input.ideaGuidance.idealVideo),
          viewerFeeling: optText(input.ideaGuidance.viewerFeeling),
          formatPreferences: optArr(input.ideaGuidance.formatPreferences),
        }
      : undefined,
    scriptGuidance: input.scriptGuidance
      ? {
          tone: optText(input.scriptGuidance.tone),
          structurePreference: optText(input.scriptGuidance.structurePreference),
          styleNotes: optText(input.scriptGuidance.styleNotes),
          neverInclude: optText(input.scriptGuidance.neverInclude),
        }
      : undefined,
    tagGuidance: input.tagGuidance
      ? {
          primaryKeywords: optArr(input.tagGuidance.primaryKeywords),
          nicheTerms: optArr(input.tagGuidance.nicheTerms),
          tagStylePreference: optText(input.tagGuidance.tagStylePreference),
        }
      : undefined,
    descriptionGuidance: input.descriptionGuidance
      ? {
          descriptionFormat: optText(input.descriptionGuidance.descriptionFormat),
          standardLinks: optText(input.descriptionGuidance.standardLinks),
          seoPriority: optText(input.descriptionGuidance.seoPriority),
        }
      : undefined,
    competitors: input.competitors
      ? {
          differentiation: optText(input.competitors.differentiation),
          closeToSize: sanitizeCompetitors(input.competitors.closeToSize),
          aspirational: sanitizeCompetitors(input.competitors.aspirational),
          nicheHero: sanitizeCompetitors(input.competitors.nicheHero),
        }
      : undefined,
  };
}

/**
 * Format the profile input for LLM consumption.
 * Creates a human-readable summary without sensitive formatting.
 */
export function formatInputForLLM(input: ChannelProfileInput): string {
  const lines: string[] = [
    `CHANNEL DESCRIPTION:\n${input.description}`,
    `\nPRIMARY CATEGORIES: ${input.categories.join(", ")}`,
  ];

  if (input.customCategory) {
    lines.push(`\nCUSTOM CATEGORY: ${input.customCategory}`);
  }

  if (input.formats && input.formats.length > 0) {
    lines.push(`\nCONTENT FORMATS: ${input.formats.join(", ")}`);
  }

  if (input.audience) {
    lines.push(`\nTARGET AUDIENCE: ${input.audience}`);
  }

  if (input.tone && input.tone.length > 0) {
    lines.push(`\nTONE/STYLE: ${input.tone.join(", ")}`);
  }

  if (input.examples && input.examples.some(Boolean)) {
    lines.push(
      `\nEXAMPLE VIDEO TOPICS:\n${input.examples
        .filter(Boolean)
        .map((e, i) => `${i + 1}. ${e}`)
        .join("\n")}`,
    );
  }

  if (input.goals && input.goals.length > 0) {
    lines.push(`\nCHANNEL GOALS: ${input.goals.join(", ")}`);
  }

  return lines.join("\n");
}
