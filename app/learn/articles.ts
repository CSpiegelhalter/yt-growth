export const learnArticles = [
  { slug: "youtube-channel-audit", label: "Channel Audit" },
  { slug: "youtube-retention-analysis", label: "Retention" },
  { slug: "how-to-get-more-subscribers", label: "Subscribers" },
  { slug: "youtube-competitor-analysis", label: "Competitors" },
  { slug: "youtube-video-ideas", label: "Video Ideas" },
] as const;

export type LearnArticle = (typeof learnArticles)[number];

