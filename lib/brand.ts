/**
 * Central brand configuration for ChannelBoost
 * Use this everywhere to ensure consistent branding and avoid hardcoded strings.
 */

export const BRAND = {
  name: "ChannelBoost",
  /** Canonical domain with www prefix for SEO consistency */
  domain: "www.getchannelboost.com",
  /** Canonical origin URL - always use www for sitemap/robots/metadata */
  url: "https://www.getchannelboost.com",
  tagline: "YouTube Growth Analytics for Creators",
  description:
    "YouTube growth tool with channel audits, retention analysis, competitor insights, and AI-powered video ideas. Get more subscribers and views with data-driven content strategy.",
  shortDescription:
    "Data-driven video ideas, retention insights, and subscriber analysis to grow your YouTube channel faster.",
  twitterHandle: "@channelboost",
  ogImagePath: "/og/channelboost.png",
  themeColor: "#2563eb",
  email: "hello@getchannelboost.com",
} as const;

/**
 * Normalizes a URL input to a canonical origin.
 *
 * Rules:
 * - Forces https://
 * - Forces www for getchannelboost.com (apex → www)
 * - Strips trailing slashes, paths, query, hash, and ports
 * - Returns fallback for empty/invalid inputs
 *
 * @example
 * normalizeCanonicalOrigin("getchannelboost.com") // "https://www.getchannelboost.com"
 * normalizeCanonicalOrigin("https://getchannelboost.com/") // "https://www.getchannelboost.com"
 * normalizeCanonicalOrigin("http://www.getchannelboost.com") // "https://www.getchannelboost.com"
 * normalizeCanonicalOrigin("myproj.vercel.app") // "https://myproj.vercel.app" (preview)
 */
export function normalizeCanonicalOrigin(input?: string): string {
  const FALLBACK = "https://www.getchannelboost.com";

  const raw = (input ?? "").trim();
  if (!raw) return FALLBACK;

  // Ensure it has a scheme so URL() can parse it
  const withScheme =
    raw.startsWith("http://") || raw.startsWith("https://")
      ? raw
      : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return FALLBACK;
  }

  // Enforce https
  url.protocol = "https:";

  // Normalize hostname to lowercase
  const host = url.hostname.toLowerCase();

  // Force www for our root domain (apex → www)
  if (host === "getchannelboost.com") {
    url.hostname = "www.getchannelboost.com";
  }

  // Drop port (shouldn't be in canonical URLs)
  url.port = "";

  // Strip path/query/hash to get just the origin
  url.pathname = "";
  url.search = "";
  url.hash = "";

  // Remove trailing slash
  return url.toString().replace(/\/$/, "");
}

/**
 * Canonical origin URL for sitemap, robots.txt, and metadata.
 *
 * Uses env vars in priority order, normalized to ensure:
 * - Always https://
 * - Always www for getchannelboost.com
 * - Never ends with trailing slash
 *
 * To add new Learn pages: add them to app/(marketing)/learn/articles.ts
 * and they will automatically appear in the sitemap.
 */
export const CANONICAL_ORIGIN = normalizeCanonicalOrigin(
  process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL
);

/**
 * SEO-focused keywords and phrases
 */
export const SEO = {
  primary: [
    "youtube growth tool",
    "youtube analytics tool",
    "youtube channel audit",
    "youtube retention analysis",
    "youtube competitor analysis",
    "youtube video ideas generator",
  ],
  secondary: [
    "get more subscribers on youtube",
    "get more views on youtube",
    "improve youtube watch time",
    "youtube content strategy",
    "youtube trending videos in niche",
    "youtube outlier videos",
    "youtube video performance insights",
    "youtube creator dashboard",
  ],
} as const;

/**
 * Feature pillars for landing page and marketing
 */
export const FEATURES = {
  channelAudit: {
    title: "YouTube Channel Audit",
    description:
      "Get a comprehensive audit of your channel's performance with actionable insights to improve your content strategy.",
    keywords: [
      "youtube channel audit",
      "channel analysis",
      "performance review",
    ],
  },
  retentionAnalysis: {
    title: "Retention & Drop-Off Insights",
    description:
      "See exactly where viewers stop watching and get AI-powered recommendations to keep them engaged longer.",
    keywords: [
      "youtube retention analysis",
      "audience retention",
      "watch time optimization",
    ],
  },
  subscriberDrivers: {
    title: "Subscriber Drivers",
    description:
      "Discover which videos convert viewers into subscribers and learn the patterns that drive channel growth.",
    keywords: [
      "get more subscribers on youtube",
      "subscriber conversion",
      "channel growth",
    ],
  },
  competitorAnalysis: {
    title: "Competitor & Trending Videos",
    description:
      "Monitor what's working for similar channels. Find trending videos in your niche before they blow up.",
    keywords: [
      "youtube competitor analysis",
      "trending videos",
      "niche research",
    ],
  },
  ideaEngine: {
    title: "Video Ideas Engine",
    description:
      "Generate proven video ideas based on what's working in your niche. Get titles, hooks, and thumbnail concepts.",
    keywords: [
      "youtube video ideas generator",
      "content ideas",
      "video topic research",
    ],
  },
} as const;

/**
 * Structured data helpers
 */
export const STRUCTURED_DATA = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: BRAND.url,
    logo: `${BRAND.url}/logo.svg`,
    sameAs: [`https://twitter.com/${BRAND.twitterHandle.replace("@", "")}`],
    description: BRAND.description,
  },
  softwareApplication: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: BRAND.url,
    description: BRAND.description,
    offers: {
      "@type": "Offer",
      price: "19",
      priceCurrency: "USD",
      priceValidUntil: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      )
        .toISOString()
        .split("T")[0],
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
    },
  },
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: BRAND.url,
    description: BRAND.description,
  },
} as const;
