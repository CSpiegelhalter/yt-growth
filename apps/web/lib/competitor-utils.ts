/**
 * Competitor Analysis Utilities
 *
 * Shared utilities for competitor video analysis that ensure:
 * - Consistent duration formatting
 * - Accurate number/quantifier detection
 * - Evidence-based title analysis (no overclaims)
 * - Honest confidence labels
 */

import { daysSince } from "@/lib/youtube/utils";

// ============================================
// DURATION FORMATTING
// ============================================

type DurationBucket = "Shorts" | "Short" | "Medium" | "Long" | "Very Long";

function parseDurationParts(seconds: number): { h: number; m: number; s: number } | null {
  if (seconds < 0 || !Number.isFinite(seconds)) {return null;}
  return {
    h: Math.floor(seconds / 3600),
    m: Math.floor((seconds % 3600) / 60),
    s: Math.floor(seconds % 60),
  };
}

/**
 * Format duration consistently across the app.
 * Never shows "0 minutes" - always uses seconds for short content.
 *
 * @example
 * formatDuration(10) => "10s"
 * formatDuration(65) => "1m 5s"
 * formatDuration(3661) => "1h 1m"
 */
export function formatDuration(seconds: number): string {
  const p = parseDurationParts(seconds);
  if (!p) {return "—";}
  const { h, m, s } = p;

  if (h > 0) {return m > 0 ? `${h}h ${m}m` : `${h}h`;}
  if (m > 0) {return s > 0 ? `${m}m ${s}s` : `${m}m`;}
  return `${s}s`;
}

/**
 * Format duration as a compact badge label (e.g., "10:05")
 */
export function formatDurationBadge(seconds: number): string {
  const p = parseDurationParts(seconds);
  if (!p) {return "—";}
  const { h, m, s } = p;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Categorize duration into buckets for analysis
 */
export function getDurationBucket(seconds: number): DurationBucket {
  if (seconds < 60) {return "Shorts";}
  if (seconds < 240) {return "Short";} // < 4 min
  if (seconds < 1200) {return "Medium";} // 4-20 min
  if (seconds < 3600) {return "Long";} // 20-60 min
  return "Very Long"; // 60+ min
}

/**
 * Get a human-readable duration with bucket label
 */
function formatDurationWithBucket(seconds: number): {
  formatted: string;
  bucket: DurationBucket;
  bucketLabel: string;
} {
  const formatted = formatDuration(seconds);
  const bucket = getDurationBucket(seconds);

  const bucketLabels: Record<DurationBucket, string> = {
    Shorts: "YouTube Short",
    Short: "Short-form",
    Medium: "Standard length",
    Long: "Long-form",
    "Very Long": "Extended content",
  };

  return {
    formatted,
    bucket,
    bucketLabel: bucketLabels[bucket],
  };
}

// ============================================
// NUMBER/QUANTIFIER DETECTION
// ============================================

type NumberType =
  | "ranking" // #1, Ranked #5, Top 10
  | "list_count" // 5 tips, 10 ways, 7 mistakes
  | "episode" // Part 2, Episode 51, Day 30
  | "time_constraint" // 24 hours, 30 days, 1 hour
  | "quantity" // 1000 subscribers, $50,000
  | "version" // 2.0, v3
  | "proper_noun" // Black Ops 7, iPhone 15, GTA 6
  | "year" // 2024, 2025
  | "none";

type NumberAnalysis = {
  hasNumber: boolean;
  type: NumberType;
  value: string | null;
  isPerformanceDriver: boolean;
  explanation: string;
};

/**
 * Detect and classify numbers in titles.
 *
 * Key distinction: Numbers that are part of proper nouns (Black Ops 7, iPhone 15)
 * are NOT performance drivers - they're just product names.
 *
 * Performance drivers are:
 * - Rankings (#1, Top 10)
 * - List counts (5 tips, 10 ways)
 * - Time constraints (24 hours, 30 days)
 * - Episode/part numbers (for series)
 */
export function analyzeNumberInTitle(title: string): NumberAnalysis {
  // Common proper nouns with numbers that should NOT count as performance drivers
  const properNounPatterns = [
    // Video games
    /\b(gta|grand theft auto)\s*[456]\b/i,
    /\b(call of duty|cod|black ops|modern warfare|warzone)\s*\d+\b/i,
    /\b(battlefield|bf)\s*\d+\b/i,
    /\b(fifa|nba|madden|nfl|nhl|mlb|wwe)\s*2k?\d+\b/i,
    /\b(final fantasy|ff)\s*(x+v?i*|[0-9]+)\b/i,
    /\b(resident evil|re)\s*\d+\b/i,
    /\b(fallout|diablo|doom|quake|halo|forza|gran turismo|gt)\s*\d+\b/i,
    /\b(assassin'?s? creed|ac)\s*\d*\b/i,
    /\b(destiny|division|borderlands|far cry|watch dogs)\s*\d+\b/i,
    /\b(civilization|civ|sims|simcity)\s*\d+\b/i,
    // Tech products
    /\biphone\s*\d+\s*(pro|max|plus|mini)?\b/i,
    /\bipad\s*(pro|air|mini)?\s*\d*\b/i,
    /\bgalaxy\s*s?\d+\s*(ultra|plus|fe)?\b/i,
    /\bpixel\s*\d+\s*(pro|a)?\b/i,
    /\bplaystation\s*\d+\b/i,
    /\bps\s*[345]\b/i,
    /\bxbox\s*(series\s*[xs]|one|360)?\b/i,
    /\bnintendo\s*(switch|64|ds|3ds|wii)\b/i,
    /\bwindows\s*\d+\b/i,
    /\bandroid\s*\d+\b/i,
    /\bios\s*\d+\b/i,
    /\bmac\s*(os|book)?\s*(pro|air)?\s*\d*\b/i,
    /\bgpu|rtx|gtx|rx\s*\d+/i,
    /\bintel\s*(core\s*)?i[3579]\s*\d+/i,
    /\bryzen\s*\d+/i,
    // Software versions
    /\bv\d+(\.\d+)*\b/i,
    /\b\d+\.\d+(\.\d+)*\s*(update|patch|release)\b/i,
    // Car models
    /\b(model\s*[3sxy]|cybertruck)\b/i,
    /\b(bmw|audi|mercedes|porsche|ferrari|lamborghini)\s*[a-z]*\d+/i,
  ];

  // Check for proper noun numbers first
  for (const pattern of properNounPatterns) {
    const match = title.match(pattern);
    if (match) {
      return {
        hasNumber: true,
        type: "proper_noun",
        value: match[0],
        isPerformanceDriver: false,
        explanation: "Number is part of a product/game name, not a performance signal",
      };
    }
  }

  // Check for years (2020-2030)
  const yearMatch = title.match(/\b(202[0-9]|2030)\b/);
  if (yearMatch) {
    return {
      hasNumber: true,
      type: "year",
      value: yearMatch[1],
      isPerformanceDriver: true,
      explanation: "Year reference signals timeliness and relevance",
    };
  }

  // Ranking patterns (#1, Ranked #5, Top 10, Best 5)
  const rankingMatch = title.match(
    /(?:#\s*(\d+)|ranked?\s*#?\s*(\d+)|top\s*(\d+)|best\s*(\d+)|worst\s*(\d+)|number\s*(\d+))/i
  );
  if (rankingMatch) {
    const value = rankingMatch.slice(1).find((v) => v) ?? null;
    return {
      hasNumber: true,
      type: "ranking",
      value,
      isPerformanceDriver: true,
      explanation: "Ranking creates credibility and specificity",
    };
  }

  // List/count patterns (5 tips, 10 ways, 7 mistakes, 3 reasons)
  const listMatch = title.match(
    /\b(\d+)\s*(tips?|ways?|mistakes?|reasons?|things?|steps?|secrets?|rules?|ideas?|hacks?|tricks?|methods?|strategies?|lessons?|examples?|signs?)\b/i
  );
  if (listMatch) {
    return {
      hasNumber: true,
      type: "list_count",
      value: listMatch[1],
      isPerformanceDriver: true,
      explanation: "List count creates clear expectations and encourages full watch",
    };
  }

  // Episode/part patterns (Part 2, Episode 51, Day 30, Week 4)
  const episodeMatch = title.match(
    /\b(part|episode|ep|day|week|month|chapter|season|vol|volume)\s*#?\s*(\d+)/i
  );
  if (episodeMatch) {
    return {
      hasNumber: true,
      type: "episode",
      value: episodeMatch[2],
      isPerformanceDriver: true,
      explanation: "Episode/part number builds series continuity",
    };
  }

  // Time constraint patterns (24 hours, 30 days, under 5 minutes)
  const timeMatch = title.match(
    /\b(\d+)\s*(hours?|days?|weeks?|months?|years?|minutes?|mins?|seconds?|secs?)\b/i
  );
  if (timeMatch) {
    return {
      hasNumber: true,
      type: "time_constraint",
      value: `${timeMatch[1]} ${timeMatch[2]}`,
      isPerformanceDriver: true,
      explanation: "Time constraint creates urgency and clear scope",
    };
  }

  // Quantity patterns ($1000, 10K, 1M views)
  const quantityMatch = title.match(
    /\b(\$?\d+[kmb]?|\d{1,3}(?:,\d{3})+)\s*(subscribers?|subs?|views?|dollars?|followers?|downloads?)?\b/i
  );
  if (quantityMatch) {
    return {
      hasNumber: true,
      type: "quantity",
      value: quantityMatch[0],
      isPerformanceDriver: true,
      explanation: "Specific quantity adds credibility and concrete stakes",
    };
  }

  // Generic number that doesn't fit other patterns
  const genericMatch = title.match(/\b\d+\b/);
  if (genericMatch) {
    return {
      hasNumber: true,
      type: "none",
      value: genericMatch[0],
      isPerformanceDriver: false,
      explanation: "Number present but not in a pattern that typically drives performance",
    };
  }

  return {
    hasNumber: false,
    type: "none",
    value: null,
    isPerformanceDriver: false,
    explanation: "No numbers detected in title",
  };
}

// ============================================
// TITLE TRUNCATION ANALYSIS
// ============================================

type TruncationAnalysis = {
  totalChars: number;
  mobileLimit: number;
  desktopLimit: number;
  truncatesOnMobile: boolean;
  truncatesOnDesktop: boolean;
  mobileVisibleText: string;
  confidence: "Measured";
};

/**
 * Analyze title truncation across devices.
 * YouTube truncates titles at approximately:
 * - Mobile (feed): ~50-60 chars
 * - Desktop (feed): ~60-70 chars
 * - Search results: ~70-80 chars
 */
export function analyzeTitleTruncation(title: string): TruncationAnalysis {
  const totalChars = title.length;
  const mobileLimit = 55;
  const desktopLimit = 65;

  return {
    totalChars,
    mobileLimit,
    desktopLimit,
    truncatesOnMobile: totalChars > mobileLimit,
    truncatesOnDesktop: totalChars > desktopLimit,
    mobileVisibleText: title.slice(0, mobileLimit) + (totalChars > mobileLimit ? "..." : ""),
    confidence: "Measured",
  };
}

// ============================================
// CHAPTER DETECTION
// ============================================

/**
 * Detect if description contains chapter timestamps.
 * YouTube auto-generates chapters from timestamps in the format:
 * - 0:00 Intro
 * - 1:30 Topic 1
 * - 10:45 Topic 2
 */
export function detectChapters(description: string): {
  hasChapters: boolean;
  chapterCount: number;
  firstChapterTime: string | null;
  confidence: "Measured";
} {
  if (!description) {
    return { hasChapters: false, chapterCount: 0, firstChapterTime: null, confidence: "Measured" };
  }

  // Match timestamp patterns: 0:00, 1:30, 10:45, 1:00:00
  const timestampPattern = /^[\s\u00A0]*(\d{1,2}:\d{2}(?::\d{2})?)\s+.+$/gm;
  const matches = description.match(timestampPattern) || [];

  // Filter to only include timestamps that start at 0:00 or early (valid chapters)
  // and have at least 3 timestamps (meaningful chapter structure)
  const hasZeroStart = /^\s*0:00\s/.test(description);
  const isValidChapterList = matches.length >= 3 && hasZeroStart;

  const firstMatch = description.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);

  return {
    hasChapters: isValidChapterList,
    chapterCount: isValidChapterList ? matches.length : 0,
    firstChapterTime: firstMatch ? firstMatch[1] : null,
    confidence: "Measured",
  };
}

// ============================================
// EXTERNAL LINKS DETECTION
// ============================================

type ExternalLinkAnalysis = {
  hasLinks: boolean;
  linkCount: number;
  domains: string[];
  hasSocialLinks: boolean;
  hasAffiliateLinks: boolean;
  confidence: "Measured";
};

/**
 * Detect and categorize external links in description.
 */
export function analyzeExternalLinks(description: string): ExternalLinkAnalysis {
  if (!description) {
    return {
      hasLinks: false,
      linkCount: 0,
      domains: [],
      hasSocialLinks: false,
      hasAffiliateLinks: false,
      confidence: "Measured",
    };
  }

  // Match URLs
  const urlPattern = /https?:\/\/([^\s\/?#]+)[^\s]*/gi;
  const matches = [...description.matchAll(urlPattern)];

  const domains = [...new Set(matches.map((m) => m[1].toLowerCase().replace(/^www\./, "")))];

  const socialDomains = [
    "twitter.com",
    "x.com",
    "instagram.com",
    "facebook.com",
    "tiktok.com",
    "discord.gg",
    "discord.com",
    "twitch.tv",
    "linkedin.com",
    "threads.net",
    "bsky.app",
  ];

  const affiliateDomains = [
    "amzn.to",
    "amazon.com",
    "bit.ly",
    "geni.us",
    "kit.co",
    "linktr.ee",
    "shopmy.us",
    "rstyle.me",
  ];

  const hasSocialLinks = domains.some((d) =>
    socialDomains.some((sd) => d.includes(sd.replace("www.", "")))
  );

  const hasAffiliateLinks = domains.some((d) =>
    affiliateDomains.some((ad) => d.includes(ad.replace("www.", "")))
  );

  return {
    hasLinks: domains.length > 0,
    linkCount: matches.length,
    domains: domains.slice(0, 10),
    hasSocialLinks,
    hasAffiliateLinks,
    confidence: "Measured",
  };
}

// ============================================
// HASHTAG ANALYSIS
// ============================================

type HashtagAnalysis = {
  count: number;
  hashtags: string[];
  inTitle: string[];
  inDescription: string[];
  confidence: "Measured";
};

/**
 * Extract and analyze hashtags from title and description.
 */
export function analyzeHashtags(title: string, description: string): HashtagAnalysis {
  const hashtagPattern = /#[\p{L}\p{N}_-]+/gu;

  const titleHashtags = title.match(hashtagPattern) || [];
  const descHashtags = description?.match(hashtagPattern) || [];

  const allHashtags = [...new Set([...titleHashtags, ...descHashtags])];

  return {
    count: allHashtags.length,
    hashtags: allHashtags.slice(0, 30),
    inTitle: titleHashtags,
    inDescription: descHashtags,
    confidence: "Measured",
  };
}

// ============================================
// PUBLIC SIGNALS COMPUTATION
// ============================================

type CompetitorPublicSignals = {
  // Core metrics
  videoAgeDays: number;
  viewsPerDay: number;
  likeRate: number | null; // likes per 100 views
  commentsPer1k: number | null; // comments per 1000 views
  engagementRate: number | null;

  // Description analysis
  descriptionWordCount: number;
  hashtagCount: number;

  // Title analysis
  titleCharCount: number;
  truncationAnalysis: TruncationAnalysis;
  numberAnalysis: NumberAnalysis;

  // Content analysis
  externalLinks: ExternalLinkAnalysis;
  chapterDetection: ReturnType<typeof detectChapters>;

  // Duration
  durationFormatted: string;
  durationBucket: DurationBucket;

  // All signals are measured
  dataSource: "public_api";
};

/**
 * Compute all public signals for a competitor video.
 * These are deterministic computations from public data only.
 */
export function computePublicSignals(input: {
  title: string;
  description: string;
  publishedAt: string;
  durationSec: number;
  viewCount: number;
  likeCount?: number | null;
  commentCount?: number | null;
}): CompetitorPublicSignals {
  const videoAgeDays = daysSince(input.publishedAt);
  const viewsPerDay = Math.round(input.viewCount / videoAgeDays);

  // Like rate: likes per 100 views
  const likeRate =
    input.likeCount != null && input.viewCount > 0
      ? Math.round((input.likeCount / input.viewCount) * 10000) / 100
      : null;

  // Comments per 1000 views
  const commentsPer1k =
    input.commentCount != null && input.viewCount > 0
      ? Math.round((input.commentCount / input.viewCount) * 10000) / 10
      : null;

  // Engagement rate: (likes + comments) / views
  const engagementRate =
    input.likeCount != null && input.commentCount != null && input.viewCount > 0
      ? Math.round(((input.likeCount + input.commentCount) / input.viewCount) * 10000) / 100
      : null;

  // Description word count
  const descriptionWordCount = input.description
    ? input.description
        .replace(/https?:\/\/\S+/gi, "")
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  // Hashtags
  const hashtagAnalysis = analyzeHashtags(input.title, input.description);

  // Title analysis
  const titleCharCount = input.title.length;
  const truncationAnalysis = analyzeTitleTruncation(input.title);
  const numberAnalysis = analyzeNumberInTitle(input.title);

  // External links
  const externalLinks = analyzeExternalLinks(input.description);

  // Chapters
  const chapterDetection = detectChapters(input.description);

  // Duration
  const { formatted: durationFormatted, bucket: durationBucket } = formatDurationWithBucket(
    input.durationSec
  );

  return {
    videoAgeDays,
    viewsPerDay,
    likeRate,
    commentsPer1k,
    engagementRate,
    descriptionWordCount,
    hashtagCount: hashtagAnalysis.count,
    titleCharCount,
    truncationAnalysis,
    numberAnalysis,
    externalLinks,
    chapterDetection,
    durationFormatted,
    durationBucket,
    dataSource: "public_api",
  };
}

// ============================================
// ENGAGEMENT OUTLIER DETECTION
// ============================================

type EngagementOutlierResult = {
  /** The computed engagement score: (likes + comments) / views */
  engagementScore: number;
  /** Whether this video has exceptional engagement */
  isOutlier: boolean;
  /** Human-readable label for the engagement level */
  label: "Exceptional" | "High" | "Above Average" | "Average" | "Below Average";
  /** Tooltip explanation */
  explanation: string;
  /** How the outlier was computed */
  method: "channel_comparison" | "heuristic_threshold";
};

/**
 * Detect if a video has exceptional engagement (outlier detection).
 * 
 * Engagement score = (likes + comments) / max(views, 1)
 * 
 * Two modes:
 * 1. If we have channel's recent videos: compute median and flag outliers using IQR
 * 2. If single video only: use heuristic thresholds based on platform benchmarks
 * 
 * Platform benchmarks (approximate):
 * - Exceptional: engagement > 6% (6 engagements per 100 views)
 * - High: engagement 4-6%
 * - Above Average: engagement 2.5-4%
 * - Average: engagement 1-2.5%
 * - Below Average: engagement < 1%
 */
export function detectEngagementOutlier(input: {
  views: number;
  likes: number;
  comments: number;
  /** Optional: recent channel videos to compute relative outlier */
  channelVideos?: Array<{
    views: number;
    likes: number;
    comments: number;
  }>;
}): EngagementOutlierResult {
  const { views, likes, comments, channelVideos } = input;
  
  // Compute engagement score
  const safeViews = Math.max(views, 1);
  const engagementScore = (likes + comments) / safeViews;
  const engagementPct = engagementScore * 100;
  
  // Method 1: Channel comparison (if we have data)
  if (channelVideos && channelVideos.length >= 5) {
    const channelScores = channelVideos
      .map(v => (v.likes + v.comments) / Math.max(v.views, 1))
      .sort((a, b) => a - b);
    
    // Compute median and IQR
    const n = channelScores.length;
    const median = n % 2 === 0
      ? (channelScores[n / 2 - 1] + channelScores[n / 2]) / 2
      : channelScores[Math.floor(n / 2)];
    
    const q1Idx = Math.floor(n * 0.25);
    const q3Idx = Math.floor(n * 0.75);
    const q1 = channelScores[q1Idx];
    const q3 = channelScores[q3Idx];
    const iqr = q3 - q1;
    
    // Outlier thresholds (standard IQR rule, anchored to Q3)
    // Use strict ">" comparisons below so "at median" is never an outlier,
    // especially when IQR is 0 (many channels have flat engagement rates).
    const highThreshold = q3 + iqr * 1.0;
    const exceptionalThreshold = q3 + iqr * 1.5;
    
    const medianPct = (median * 100).toFixed(2);
    
    if (engagementScore > exceptionalThreshold) {
      return {
        engagementScore,
        isOutlier: true,
        label: "Exceptional",
        explanation: `Engagement is ${(engagementScore / median).toFixed(1)}x the channel median (${medianPct}%). This video is significantly outperforming.`,
        method: "channel_comparison",
      };
    }
    
    if (engagementScore > highThreshold) {
      return {
        engagementScore,
        isOutlier: true,
        label: "High",
        explanation: `Engagement is ${(engagementScore / median).toFixed(1)}x the channel median (${medianPct}%). Above average for this channel.`,
        method: "channel_comparison",
      };
    }
    
    if (engagementScore >= median) {
      return {
        engagementScore,
        isOutlier: false,
        label: "Above Average",
        explanation: `Engagement is at or above the channel median (${medianPct}%).`,
        method: "channel_comparison",
      };
    }
    
    if (engagementScore >= q1) {
      return {
        engagementScore,
        isOutlier: false,
        label: "Average",
        explanation: `Engagement is near the channel median (${medianPct}%).`,
        method: "channel_comparison",
      };
    }
    
    return {
      engagementScore,
      isOutlier: false,
      label: "Below Average",
      explanation: `Engagement is below the channel median (${medianPct}%).`,
      method: "channel_comparison",
    };
  }
  
  // Method 2: Heuristic threshold (single video)
  // Based on platform benchmarks:
  // - Avg YouTube like rate: ~2-4%
  // - Avg comments/1K: ~1-3
  // Combined engagement > 5-6% is strong
  
  if (engagementPct >= 6) {
    return {
      engagementScore,
      isOutlier: true,
      label: "Exceptional",
      explanation: `${engagementPct.toFixed(1)}% engagement rate. Top-tier performance - viewers are actively responding.`,
      method: "heuristic_threshold",
    };
  }
  
  if (engagementPct >= 4) {
    return {
      engagementScore,
      isOutlier: true,
      label: "High",
      explanation: `${engagementPct.toFixed(1)}% engagement rate. Strong audience response.`,
      method: "heuristic_threshold",
    };
  }
  
  if (engagementPct >= 2.5) {
    return {
      engagementScore,
      isOutlier: false,
      label: "Above Average",
      explanation: `${engagementPct.toFixed(1)}% engagement rate. Solid performance.`,
      method: "heuristic_threshold",
    };
  }
  
  if (engagementPct >= 1) {
    return {
      engagementScore,
      isOutlier: false,
      label: "Average",
      explanation: `${engagementPct.toFixed(1)}% engagement rate. Typical for YouTube.`,
      method: "heuristic_threshold",
    };
  }
  
  return {
    engagementScore,
    isOutlier: false,
    label: "Below Average",
    explanation: `${engagementPct.toFixed(1)}% engagement rate. Lower than typical.`,
    method: "heuristic_threshold",
  };
}
