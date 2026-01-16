/**
 * Body components for learn articles.
 * Each component renders the main article content (sections between TOC and FAQ).
 * These are server components - no "use client" directive.
 */

import type { LearnArticle } from "../../articles";

// CSS module type for styling - use Record for flexibility
export type StyleModule = Record<string, string>;

// Props for all body components
export interface BodyProps {
  s: StyleModule;
  article: LearnArticle;
}

// Lazy imports for each body component
// This enables tree-shaking and code splitting per article
import { Body as YouTubeSEOBody } from "./youtube-seo";
import { Body as HowMuchDoesYouTubePayBody } from "./how-much-does-youtube-pay";
import { Body as FreeYouTubeSubscribersBody } from "./free-youtube-subscribers";
import { Body as YouTubeChannelAuditBody } from "./youtube-channel-audit";
import { Body as YouTubeCompetitorAnalysisBody } from "./youtube-competitor-analysis";
import { Body as YouTubeMonetizationRequirementsBody } from "./youtube-monetization-requirements";
import { Body as YouTubeRetentionAnalysisBody } from "./youtube-retention-analysis";
import { Body as YouTubeVideoIdeasBody } from "./youtube-video-ideas";
import { Body as HowToGetMoreSubscribersBody } from "./how-to-get-more-subscribers";
import { Body as HowToMakeAYouTubeChannelBody } from "./how-to-make-a-youtube-channel";

// Map of slug to body component
export const BODY_COMPONENTS: Record<string, React.ComponentType<BodyProps>> = {
  "youtube-seo": YouTubeSEOBody,
  "how-much-does-youtube-pay": HowMuchDoesYouTubePayBody,
  "free-youtube-subscribers": FreeYouTubeSubscribersBody,
  "youtube-channel-audit": YouTubeChannelAuditBody,
  "youtube-competitor-analysis": YouTubeCompetitorAnalysisBody,
  "youtube-monetization-requirements": YouTubeMonetizationRequirementsBody,
  "youtube-retention-analysis": YouTubeRetentionAnalysisBody,
  "youtube-video-ideas": YouTubeVideoIdeasBody,
  "how-to-get-more-subscribers": HowToGetMoreSubscribersBody,
  "how-to-make-a-youtube-channel": HowToMakeAYouTubeChannelBody,
};
