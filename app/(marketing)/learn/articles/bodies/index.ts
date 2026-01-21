/**
 * Body components for learn articles.
 * Each component renders the main article content (sections between TOC and FAQ).
 * These are server components - no "use client" directive.
 *
 * HOW TO ADD A NEW SEO PAGE:
 * 1. Add the article config in articles.ts (LEARN_ARTICLES object)
 * 2. Create a body component in this folder: {slug}.tsx
 * 3. Import the Body component below
 * 4. Add the mapping to BODY_COMPONENTS
 * 5. Run `bun run build` to verify - sitemap auto-includes new articles
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

// Original articles
import { Body as YouTubeSEOBody } from "./youtube-seo";
import { Body as HowMuchDoesYouTubePayBody } from "./how-much-does-youtube-pay";
import { Body as FreeYouTubeSubscribersBody } from "./free-youtube-subscribers";
import { Body as YouTubeChannelAuditBody } from "./youtube-channel-audit";
import { Body as YouTubeCompetitorAnalysisBody } from "./youtube-competitor-analysis";
import { Body as YouTubeMonetizationRequirementsBody } from "./youtube-monetization-requirements";
import { Body as YouTubeRetentionAnalysisBody } from "./youtube-retention-analysis";
import { Body as HowToIncreaseAudienceRetentionBody } from "./how-to-increase-audience-retention";
import { Body as YouTubeThumbnailBestPracticesBody } from "./youtube-thumbnail-best-practices";
import { Body as YouTubeVideoIdeasBody } from "./youtube-video-ideas";
import { Body as HowToFindVideoIdeasBody } from "./how-to-find-video-ideas";
import { Body as FindVideoInspirationBody } from "./find-video-inspiration";
import { Body as HowToGetMoreSubscribersBody } from "./how-to-get-more-subscribers";
import { Body as HowToMakeAYouTubeChannelBody } from "./how-to-make-a-youtube-channel";

// New SEO articles (2026-01)
import { Body as HowToPromoteYouTubeVideosBody } from "./how-to-promote-youtube-videos";
import { Body as HowToSeeYourSubscribersBody } from "./how-to-see-your-subscribers-on-youtube";
import { Body as HowToGoLiveBody } from "./how-to-go-live-on-youtube";
import { Body as BuyYouTubeSubscribersBody } from "./buy-youtube-subscribers";
import { Body as BuyYouTubeViewsBody } from "./buy-youtube-views";
import { Body as YouTubeAnalyticsToolsBody } from "./youtube-analytics-tools";
import { Body as FindSimilarChannelsBody } from "./find-similar-youtube-channels";
import { Body as HowToBeAYouTuberBody } from "./how-to-be-a-youtuber";
import { Body as YouTubeTagGeneratorBody } from "./youtube-tag-generator";
import { Body as YouTubeShortsLengthBody } from "./youtube-shorts-length";
import { Body as YouTubeShortsMonetizationBody } from "./youtube-shorts-monetization";
import { Body as YouTubeAlgorithmBody } from "./youtube-algorithm";

// Map of slug to body component
export const BODY_COMPONENTS: Record<string, React.ComponentType<BodyProps>> = {
  // Original articles
  "youtube-seo": YouTubeSEOBody,
  "how-much-does-youtube-pay": HowMuchDoesYouTubePayBody,
  "free-youtube-subscribers": FreeYouTubeSubscribersBody,
  "youtube-channel-audit": YouTubeChannelAuditBody,
  "youtube-competitor-analysis": YouTubeCompetitorAnalysisBody,
  "youtube-monetization-requirements": YouTubeMonetizationRequirementsBody,
  "youtube-retention-analysis": YouTubeRetentionAnalysisBody,
  "how-to-increase-audience-retention": HowToIncreaseAudienceRetentionBody,
  "youtube-thumbnail-best-practices": YouTubeThumbnailBestPracticesBody,
  "youtube-video-ideas": YouTubeVideoIdeasBody,
  "how-to-find-video-ideas": HowToFindVideoIdeasBody,
  "find-video-inspiration": FindVideoInspirationBody,
  "how-to-get-more-subscribers": HowToGetMoreSubscribersBody,
  "how-to-make-a-youtube-channel": HowToMakeAYouTubeChannelBody,

  // New SEO articles (2026-01)
  "how-to-promote-youtube-videos": HowToPromoteYouTubeVideosBody,
  "how-to-see-your-subscribers-on-youtube": HowToSeeYourSubscribersBody,
  "how-to-go-live-on-youtube": HowToGoLiveBody,
  "buy-youtube-subscribers": BuyYouTubeSubscribersBody,
  "buy-youtube-views": BuyYouTubeViewsBody,
  "youtube-analytics-tools": YouTubeAnalyticsToolsBody,
  "find-similar-youtube-channels": FindSimilarChannelsBody,
  "how-to-be-a-youtuber": HowToBeAYouTuberBody,
  "youtube-tag-generator": YouTubeTagGeneratorBody,
  "youtube-shorts-length": YouTubeShortsLengthBody,
  "youtube-shorts-monetization": YouTubeShortsMonetizationBody,
  "youtube-algorithm": YouTubeAlgorithmBody,
};
