import { BRAND } from "@/lib/brand";

/**
 * Learn articles metadata - Single source of truth for all article data
 * Used for navigation, sitemap, schema generation, and article pages
 */
export const LEARN_ARTICLES = {
  "youtube-channel-audit": {
    slug: "youtube-channel-audit",
    title: "YouTube Channel Audit: How to Analyze Your Channel (2025 Guide)",
    shortTitle: "Channel Audit",
    navLabel: "Channel Audit",
    description:
      "Learn how to perform a comprehensive YouTube channel audit. Identify underperforming content, analyze growth patterns, and get actionable insights to improve your channel.",
    metaDescription:
      "Learn how to audit your YouTube channel in 2025. Step-by-step guide to analyze performance, find growth opportunities, and fix issues holding your channel back.",
    datePublished: "2024-01-15",
    dateModified: "2025-01-15",
    readingTime: "8 min read",
    category: "Analytics",
    keywords: ["youtube channel audit", "channel analysis", "youtube analytics", "channel performance"],
    toc: [
      { id: "what-is-audit", title: "What is a Channel Audit?" },
      { id: "key-areas", title: "Key Areas to Analyze" },
      { id: "how-to-perform", title: "How to Perform an Audit" },
      { id: "common-issues", title: "Common Issues Found" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "How often should I audit my channel?",
        answer: "A comprehensive audit every 3-6 months is ideal. For active channels, monthly check-ins on key metrics help catch issues early.",
      },
      {
        question: "What metrics matter most in a channel audit?",
        answer: "Focus on audience retention (especially the first 30 seconds), subscriber conversion rate per video, and click-through rate. These directly impact how YouTube promotes your content.",
      },
      {
        question: "Can I audit my channel without special tools?",
        answer: "Yes, YouTube Studio provides the raw data. However, identifying patterns across many videos and getting actionable insights is much faster with dedicated tools that automate the analysis.",
      },
    ],
  },
  "youtube-retention-analysis": {
    slug: "youtube-retention-analysis",
    title: "YouTube Retention Analysis: How to Keep Viewers Watching (2025)",
    shortTitle: "Retention Analysis",
    navLabel: "Retention",
    description:
      "Master YouTube audience retention analysis. Learn to identify drop-off points, understand viewer behavior, and improve watch time with proven strategies.",
    metaDescription:
      "Master YouTube retention in 2025. Learn to read retention curves, identify drop-off points, and apply proven fixes to keep viewers watching longer.",
    datePublished: "2024-01-15",
    dateModified: "2025-01-15",
    readingTime: "7 min read",
    category: "Analytics",
    keywords: ["youtube retention", "audience retention", "watch time", "viewer drop-off"],
    toc: [
      { id: "why-retention-matters", title: "Why Retention Matters" },
      { id: "reading-curves", title: "Reading Retention Curves" },
      { id: "drop-off-patterns", title: "Common Drop-Off Patterns" },
      { id: "improvement-strategies", title: "Strategies to Improve" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "What's a good audience retention rate on YouTube?",
        answer: "It varies by video length and niche, but 50%+ average view duration is generally good. For longer videos (15+ min), 40%+ is solid. Focus on improving your own baseline rather than comparing to others.",
      },
      {
        question: "How do I find where viewers drop off?",
        answer: "In YouTube Studio, go to Analytics → Engagement → Audience Retention. The graph shows exactly where viewers leave. Look for steep drops and investigate what's happening at those timestamps.",
      },
      {
        question: "Does video length affect retention?",
        answer: "Yes. Longer videos typically have lower percentage retention but can still have high absolute watch time. Make your video as long as it needs to be—no longer. Cut filler content ruthlessly.",
      },
    ],
  },
  "how-to-get-more-subscribers": {
    slug: "how-to-get-more-subscribers",
    title: "How to Get More YouTube Subscribers: Proven Strategies (2025)",
    shortTitle: "Get More Subscribers",
    navLabel: "Subscribers",
    description:
      "Learn proven strategies to get more YouTube subscribers. Discover which content converts viewers into subscribers and how to optimize your channel for growth.",
    metaDescription:
      "Get more YouTube subscribers in 2025 with data-driven strategies. Learn which videos convert viewers to subscribers and how to optimize your channel for growth.",
    datePublished: "2024-01-15",
    dateModified: "2025-01-15",
    readingTime: "9 min read",
    category: "Growth",
    keywords: ["get more subscribers", "youtube subscribers", "subscriber growth", "grow youtube channel"],
    toc: [
      { id: "why-subscribers-matter", title: "Why Subscribers Matter" },
      { id: "what-converts", title: "What Converts Viewers" },
      { id: "growth-strategies", title: "Proven Growth Strategies" },
      { id: "subscriber-drivers", title: "Finding Subscriber Drivers" },
      { id: "mistakes", title: "Mistakes to Avoid" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "What's a good subscriber-to-view ratio?",
        answer: "On average, 1-3% of views convert to subscribers. Higher rates indicate content that resonates strongly. If you're below 1%, focus on creating content that demonstrates ongoing value.",
      },
      {
        question: "How long does it take to get 1,000 subscribers?",
        answer: "It varies widely based on niche, content quality, and consistency. Some channels reach 1K in months, others take years. Focus on creating valuable content consistently—subscriber growth follows.",
      },
      {
        question: "Should I buy subscribers?",
        answer: "Never. Bought subscribers don't watch your content, which tanks your engagement metrics. YouTube may also penalize or ban channels for artificial inflation. Build real subscribers with real content.",
      },
    ],
  },
  "youtube-competitor-analysis": {
    slug: "youtube-competitor-analysis",
    title: "YouTube Competitor Analysis: Find What Works in Your Niche (2025)",
    shortTitle: "Competitor Analysis",
    navLabel: "Competitors",
    description:
      "Learn how to analyze YouTube competitors effectively. Find trending topics, discover outlier videos, and understand what content strategies drive growth in your niche.",
    metaDescription:
      "Master YouTube competitor analysis in 2025. Find outlier videos, trending topics, and proven strategies from successful channels in your niche.",
    datePublished: "2024-01-15",
    dateModified: "2025-01-15",
    readingTime: "6 min read",
    category: "Research",
    keywords: ["youtube competitor analysis", "competitor research", "niche analysis", "outlier videos"],
    toc: [
      { id: "why-competitor-analysis", title: "Why It Matters" },
      { id: "what-to-analyze", title: "What to Analyze" },
      { id: "finding-outliers", title: "Finding Outlier Videos" },
      { id: "mistakes", title: "Common Mistakes" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "How do I find competitor channels to analyze?",
        answer: "Search for your main topics on YouTube and note which channels appear consistently. Look at your 'suggested videos' sidebar—these are channels YouTube considers similar. Also check channels your audience follows.",
      },
      {
        question: "What are outlier videos and why do they matter?",
        answer: "Outlier videos perform significantly better than a channel's average (usually 2x+). They indicate topics or formats that resonate strongly with audiences. Studying outliers helps you identify proven opportunities.",
      },
      {
        question: "How many competitors should I track?",
        answer: "Start with 5-10 channels of varying sizes in your niche. Include some at your level and some aspirational channels. Quality of analysis matters more than quantity.",
      },
    ],
  },
  "youtube-video-ideas": {
    slug: "youtube-video-ideas",
    title: "YouTube Video Ideas: Data-Driven Content Planning (2025 Guide)",
    shortTitle: "Video Ideas",
    navLabel: "Video Ideas",
    description:
      "Learn proven methods to generate YouTube video ideas that get views. Discover data-driven approaches to find topics your audience actually wants to watch.",
    metaDescription:
      "Never run out of YouTube video ideas. Learn data-driven methods to generate content topics that your audience wants to watch and the algorithm promotes.",
    datePublished: "2024-01-15",
    dateModified: "2025-01-15",
    readingTime: "7 min read",
    category: "Content",
    keywords: ["youtube video ideas", "content ideas", "video topics", "content planning"],
    toc: [
      { id: "why-ideas-fail", title: "Why Most Ideas Fail" },
      { id: "idea-sources", title: "5 Data-Driven Sources" },
      { id: "validation", title: "Validating Ideas" },
      { id: "idea-to-video", title: "From Idea to Video" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "How often should I generate new video ideas?",
        answer: "Build a backlog of 10-20 validated ideas so you always have options. Spend 1-2 hours weekly on idea research and validation. This prevents creative blocks and rushed content decisions.",
      },
      {
        question: "Should I follow trends or create evergreen content?",
        answer: "Both have value. Trends can spike your channel visibility quickly, while evergreen content provides steady long-term views. A healthy mix of 30% trendy and 70% evergreen often works well.",
      },
      {
        question: "How do I know if an idea is too competitive?",
        answer: "Search for the topic and check the view counts on recent videos from channels your size. If similar-sized channels are getting views, you can compete. If only mega-channels rank, find a more specific angle.",
      },
    ],
  },
} as const;

// Array version for iteration (nav, sitemap)
export const learnArticles = Object.values(LEARN_ARTICLES).map((article) => ({
  slug: article.slug,
  label: article.navLabel,
  title: article.shortTitle,
  description: article.description,
  readingTime: article.readingTime,
  category: article.category,
}));

// Type exports
export type LearnArticleSlug = keyof typeof LEARN_ARTICLES;
export type LearnArticle = (typeof LEARN_ARTICLES)[LearnArticleSlug];

/**
 * Generate FAQPage JSON-LD schema from article FAQs
 */
export function generateFaqSchema(faqs: LearnArticle["faqs"]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Article JSON-LD schema
 */
export function generateLearnArticleSchema(article: LearnArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    url: `${BRAND.url}/learn/${article.slug}`,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      "@type": "Organization",
      name: `${BRAND.name} Team`,
      url: BRAND.url,
    },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: BRAND.url,
      logo: {
        "@type": "ImageObject",
        url: `${BRAND.url}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BRAND.url}/learn/${article.slug}`,
    },
    keywords: article.keywords.join(", "),
  };
}

/**
 * Get all other articles for cross-linking (excludes current)
 */
export function getRelatedArticles(currentSlug: string) {
  return learnArticles.filter((a) => a.slug !== currentSlug);
}
