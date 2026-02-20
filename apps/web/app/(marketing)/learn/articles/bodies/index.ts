/**
 * Body components for learn articles.
 *
 * This barrel ONLY re-exports leaf modules. Shared types live in _shared.ts.
 * Leaf modules must NEVER import from this file.
 *
 * HOW TO ADD A NEW SEO PAGE:
 * 1. Add the article config in articles.ts (LEARN_ARTICLES object)
 * 2. Create a body component in this folder: {slug}.tsx
 * 3. Add a dynamic import entry in ../registry.ts
 * 4. Run `bun run build` to verify - sitemap auto-includes new articles
 */

// Re-export shared types for external consumers
export type { StyleModule, BodyProps, ArticleMeta, TocEntry } from "./_shared";

// Re-export leaf modules
export { Body as YouTubeSEOBody } from "./youtube-seo";
export { Body as HowMuchDoesYouTubePayBody } from "./how-much-does-youtube-pay";
export { Body as FreeYouTubeSubscribersBody } from "./free-youtube-subscribers";
export { Body as YouTubeChannelAuditBody } from "./youtube-channel-audit";
export { Body as YouTubeCompetitorAnalysisBody } from "./youtube-competitor-analysis";
export { Body as YouTubeMonetizationRequirementsBody } from "./youtube-monetization-requirements";
export { Body as YouTubeRetentionAnalysisBody } from "./youtube-retention-analysis";
export { Body as YouTubeThumbnailBestPracticesBody } from "./youtube-thumbnail-best-practices";
export { Body as YouTubeVideoIdeasBody } from "./youtube-video-ideas";
export { Body as HowToGetMoreSubscribersBody } from "./how-to-get-more-subscribers";
export { Body as HowToMakeAYouTubeChannelBody } from "./how-to-make-a-youtube-channel";
export { Body as HowToPromoteYouTubeVideosBody } from "./how-to-promote-youtube-videos";
export { Body as HowToSeeYourSubscribersBody } from "./how-to-see-your-subscribers-on-youtube";
export { Body as HowToGoLiveBody } from "./how-to-go-live-on-youtube";
export { Body as BuyYouTubeSubscribersBody } from "./buy-youtube-subscribers";
export { Body as BuyYouTubeViewsBody } from "./buy-youtube-views";
export { Body as YouTubeAnalyticsToolsBody } from "./youtube-analytics-tools";
export { Body as HowToBeAYouTuberBody } from "./how-to-be-a-youtuber";
export { Body as YouTubeTagGeneratorBody } from "./youtube-tag-generator";
export { Body as YouTubeShortsLengthBody } from "./youtube-shorts-length";
export { Body as YouTubeShortsMonetizationBody } from "./youtube-shorts-monetization";
export { Body as YouTubeShortsStrategyBody } from "./youtube-shorts-strategy";
export { Body as YouTubeAlgorithmBody } from "./youtube-algorithm";
