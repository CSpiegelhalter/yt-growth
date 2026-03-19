import type { ChannelProfileInput } from "./schemas";
import type { ProfileTabId } from "./types";
import { PROFILE_TABS } from "./types";

export type ProfileSectionCompletion = {
  sectionId: ProfileTabId;
  label: string;
  isComplete: boolean;
  href: string;
};

type CompetitorEntry = {
  channelUrl?: string;
  channelName?: string;
  whatYouAdmire?: string;
};

function hasText(...values: (string | undefined)[]): boolean {
  return values.some((v) => typeof v === "string" && v.trim().length > 0);
}

function hasItems(arr: unknown[] | undefined): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

function hasCompetitorUrl(entries: CompetitorEntry[] | undefined): boolean {
  if (!Array.isArray(entries)) { return false; }
  return entries.some((e) => typeof e.channelUrl === "string" && e.channelUrl.trim().length > 0);
}

const SECTION_CHECKS: Record<ProfileTabId, (input: ChannelProfileInput) => boolean> = {
  "overview": (input) =>
    hasText(input.overview?.channelDescription) || hasItems(input.overview?.coreTopics),

  "idea-guidance": (input) =>
    hasText(input.ideaGuidance?.topicsToLeanInto, input.ideaGuidance?.topicsToAvoid, input.ideaGuidance?.idealVideo)
    || hasItems(input.ideaGuidance?.formatPreferences),

  "script-guidance": (input) =>
    hasText(input.scriptGuidance?.tone, input.scriptGuidance?.structurePreference, input.scriptGuidance?.styleNotes),

  "tag-guidance": (input) =>
    hasItems(input.tagGuidance?.primaryKeywords) || hasItems(input.tagGuidance?.nicheTerms),

  "description-guidance": (input) =>
    hasText(input.descriptionGuidance?.descriptionFormat, input.descriptionGuidance?.standardLinks),

  "competitors": (input) =>
    hasCompetitorUrl(input.competitors?.closeToSize)
    || hasCompetitorUrl(input.competitors?.aspirational)
    || hasCompetitorUrl(input.competitors?.nicheHero),
};

export function getProfileCompletion(
  input: ChannelProfileInput,
  channelId: string,
): ProfileSectionCompletion[] {
  return PROFILE_TABS.map((tab) => ({
    sectionId: tab.id,
    label: tab.label,
    isComplete: SECTION_CHECKS[tab.id](input),
    href: `/channel-profile?channelId=${channelId}#${tab.id}`,
  }));
}

export function isProfileComplete(sections: ProfileSectionCompletion[]): boolean {
  return sections.length > 0 && sections.every((s) => s.isComplete);
}
