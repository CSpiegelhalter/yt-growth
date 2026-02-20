/**
 * Article Registry — maps slug to a dynamic import for the body module.
 *
 * Why dynamic imports?
 *   - Avoids the barrel-file circular dependency (bodies/index <-> bodies/*.tsx)
 *   - Enables per-article code splitting
 *   - Each body module exports { Body } (named) and optionally { meta, toc }
 *
 * Usage:
 *   const loader = ARTICLE_REGISTRY["youtube-seo"];
 *   if (loader) {
 *     const mod = await loader();
 *     const BodyComponent = mod.Body;
 *   }
 */

import type { BodyProps, ArticleMeta, TocEntry } from "./bodies/_shared";

interface ArticleModule {
  Body: React.ComponentType<BodyProps>;
  meta?: ArticleMeta;
  toc?: readonly TocEntry[];
}

type ArticleLoader = () => Promise<ArticleModule>;

export const ARTICLE_REGISTRY: Record<string, ArticleLoader> = {
  "youtube-seo": () => import("./bodies/youtube-seo"),
  "how-much-does-youtube-pay": () => import("./bodies/how-much-does-youtube-pay"),
  "free-youtube-subscribers": () => import("./bodies/free-youtube-subscribers"),
  "youtube-channel-audit": () => import("./bodies/youtube-channel-audit"),
  "youtube-competitor-analysis": () => import("./bodies/youtube-competitor-analysis"),
  "youtube-monetization-requirements": () => import("./bodies/youtube-monetization-requirements"),
  "youtube-retention-analysis": () => import("./bodies/youtube-retention-analysis"),
  "youtube-thumbnail-best-practices": () => import("./bodies/youtube-thumbnail-best-practices"),
  "youtube-video-ideas": () => import("./bodies/youtube-video-ideas"),
  "how-to-get-more-subscribers": () => import("./bodies/how-to-get-more-subscribers"),
  "how-to-make-a-youtube-channel": () => import("./bodies/how-to-make-a-youtube-channel"),
  "how-to-promote-youtube-videos": () => import("./bodies/how-to-promote-youtube-videos"),
  "how-to-see-your-subscribers-on-youtube": () => import("./bodies/how-to-see-your-subscribers-on-youtube"),
  "how-to-go-live-on-youtube": () => import("./bodies/how-to-go-live-on-youtube"),
  "buy-youtube-subscribers": () => import("./bodies/buy-youtube-subscribers"),
  "buy-youtube-views": () => import("./bodies/buy-youtube-views"),
  "youtube-analytics-tools": () => import("./bodies/youtube-analytics-tools"),
  "how-to-be-a-youtuber": () => import("./bodies/how-to-be-a-youtuber"),
  "youtube-tag-generator": () => import("./bodies/youtube-tag-generator"),
  "youtube-shorts-length": () => import("./bodies/youtube-shorts-length"),
  "youtube-shorts-monetization": () => import("./bodies/youtube-shorts-monetization"),
  "youtube-shorts-strategy": () => import("./bodies/youtube-shorts-strategy"),
  "youtube-algorithm": () => import("./bodies/youtube-algorithm"),
};
