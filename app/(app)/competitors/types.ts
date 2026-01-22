/**
 * Types for Competitor Search and Niche Discovery
 */

// ============================================
// DISCOVERY TYPES - Comprehensive Niche Finder
// ============================================

/** Channel size categories based on subscriber count */
export type ChannelSize = "micro" | "small" | "medium" | "large" | "any";

/** Channel age categories */
export type ChannelAge = "new" | "growing" | "established" | "any";

/** Discovery sorting options */
export type DiscoverySort = 
  | "velocity"      // Fastest growing right now
  | "breakout"      // Videos outperforming their channel
  | "recent"        // Most recently posted
  | "engagement"    // Highest engagement rate
  | "opportunity";  // Best opportunity score (low competition, high demand)

/** Content categories to explore */
export type ContentCategory =
  | "all"
  | "howto"
  | "entertainment"
  | "education"
  | "gaming"
  | "tech"
  | "lifestyle"
  | "business"
  | "creative"
  | "sports"
  | "news";

export type DiscoveryFilters = {
  /** Channel subscriber range */
  channelSize: ChannelSize;
  /** Channel age */
  channelAge: ChannelAge;
  /** Video content type */
  contentType: "both" | "shorts" | "long";
  /** Time window for posted videos */
  timeWindow: "24h" | "7d" | "30d" | "90d";
  /** Minimum views per day threshold */
  minViewsPerDay: number;
  /** Content category to explore */
  category: ContentCategory;
  /** How to sort results */
  sortBy: DiscoverySort;
};

export const DEFAULT_DISCOVERY_FILTERS: DiscoveryFilters = {
  channelSize: "any",
  channelAge: "any",
  contentType: "both",
  timeWindow: "30d",
  minViewsPerDay: 50,
  category: "all",
  sortBy: "velocity",
};

/** Labels for UI display */
export const CHANNEL_SIZE_LABELS: Record<ChannelSize, { label: string; desc: string; range: string }> = {
  micro: { label: "Micro", desc: "Under 1K subs", range: "< 1K" },
  small: { label: "Small", desc: "1K - 10K subs", range: "1K-10K" },
  medium: { label: "Medium", desc: "10K - 100K subs", range: "10K-100K" },
  large: { label: "Large", desc: "100K+ subs", range: "100K+" },
  any: { label: "Any Size", desc: "All channels", range: "All" },
};

export const CHANNEL_AGE_LABELS: Record<ChannelAge, { label: string; desc: string }> = {
  new: { label: "New", desc: "Created in last year" },
  growing: { label: "Growing", desc: "1-3 years old" },
  established: { label: "Established", desc: "3+ years old" },
  any: { label: "Any Age", desc: "All channels" },
};

export const SORT_OPTIONS: Record<DiscoverySort, { label: string; desc: string }> = {
  velocity: { label: "Fastest Growing", desc: "Highest views/day" },
  breakout: { label: "Breakout Videos", desc: "Outperforming channel average" },
  recent: { label: "Most Recent", desc: "Newest uploads first" },
  engagement: { label: "High Engagement", desc: "Best like/comment ratio" },
  opportunity: { label: "Best Opportunity", desc: "Low competition, high demand" },
};

export const CATEGORY_OPTIONS: Record<ContentCategory, { label: string; queries: string[] }> = {
  all: { label: "All Categories", queries: [] },
  howto: { 
    label: "How-To & DIY", 
    queries: ["how to", "tutorial", "DIY", "step by step", "beginner guide", "tips and tricks"]
  },
  entertainment: { 
    label: "Entertainment", 
    queries: ["funny", "comedy", "reaction", "challenge", "prank", "vlog", "storytime"]
  },
  education: { 
    label: "Education", 
    queries: ["explained", "learn", "course", "lesson", "study", "science", "history"]
  },
  gaming: { 
    label: "Gaming", 
    queries: ["gameplay", "walkthrough", "lets play", "gaming", "speedrun", "esports"]
  },
  tech: { 
    label: "Tech & Reviews", 
    queries: ["review", "unboxing", "tech", "gadget", "setup", "comparison", "best"]
  },
  lifestyle: { 
    label: "Lifestyle", 
    queries: ["routine", "day in life", "haul", "travel", "fitness", "cooking", "home"]
  },
  business: { 
    label: "Business & Finance", 
    queries: ["make money", "side hustle", "investing", "business", "entrepreneur", "passive income"]
  },
  creative: { 
    label: "Creative & Art", 
    queries: ["art", "drawing", "music", "photography", "design", "creative", "timelapse"]
  },
  sports: { 
    label: "Sports & Fitness", 
    queries: ["workout", "training", "sports", "highlights", "fitness", "gym"]
  },
  news: { 
    label: "News & Commentary", 
    queries: ["news", "update", "analysis", "breakdown", "opinion", "discussion"]
  },
};

export type NicheSampleVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  channelId: string;
  channelTitle: string;
  channelSubscribers?: number;
  viewCount: number;
  viewsPerDay: number;
  publishedAt: string;
  durationSec?: number;
  /** How much this video outperforms the channel average */
  breakoutMultiplier?: number;
};

export type DiscoveredNiche = {
  id: string;
  /** Human-readable niche name */
  nicheLabel: string;
  /** Why this niche is worth exploring */
  rationaleBullets: string[];
  /** Sample winning videos in this niche */
  sampleVideos: NicheSampleVideo[];
  /** Aggregated metrics */
  metrics: {
    medianViewsPerDay: number;
    totalVideos: number;
    uniqueChannels: number;
    avgDaysOld: number;
    /** Avg channel size of creators in this niche */
    avgChannelSize?: number;
    /** Competition score 0-100 (lower = easier) */
    competitionScore?: number;
    /** Growth trend: rising, stable, declining */
    trend?: "rising" | "stable" | "declining";
  };
  /** Query terms for bridging to search */
  queryTerms: string[];
  /** Tags/keywords associated with this niche */
  tags: string[];
  savedAt?: string;
};

export type DiscoveryResponse = {
  niches: DiscoveredNiche[];
  totalFound: number;
  filters: DiscoveryFilters;
  generatedAt: string;
  /** Cursor for pagination */
  nextCursor?: string;
  hasMore: boolean;
};

// ============================================
// SEARCH FILTER STATE
// ============================================

export type ContentType = "shorts" | "long" | "both";
export type DateRange = "7d" | "30d" | "90d" | "365d";
export type SortBy = "viewsPerDay" | "totalViews" | "newest" | "engagement";

export type FilterState = {
  contentType: ContentType;
  dateRange: DateRange;
  minViewsPerDay: number;
  sortBy: SortBy;
};

export const DEFAULT_FILTER_STATE: FilterState = {
  contentType: "both",
  dateRange: "90d",
  minViewsPerDay: 10,
  sortBy: "viewsPerDay",
};
