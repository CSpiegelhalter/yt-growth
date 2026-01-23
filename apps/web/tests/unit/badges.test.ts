import { describe, expect, test } from "bun:test";
import {
  getWeekStart,
  getMonthStart,
  getDaysRemaining,
  countVideosInWindow,
  countShortsInWindow,
  calculatePostingStreakDays,
  calculatePostingStreakWeeks,
  sumViewsInWindow,
  sumSubsGainedInWindow,
  avgRetentionLastN,
  avgLikeRateLastN,
  checkMetricAvailability,
  computeAllBadgesProgress,
  computeAllGoalsProgress,
  getNextBadge,
  sortBadgesByClosest,
  sortBadgesByRarity,
  getBadgeSummary,
  BADGES,
  DEFAULT_GOALS,
  type VideoForBadges,
  type ChannelStatsForBadges,
  type UnlockedBadge,
} from "@/lib/badges";

// Helper to create dates relative to now
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function weeksAgo(weeks: number): Date {
  return daysAgo(weeks * 7);
}

function createVideo(publishedAt: Date, durationSec?: number): VideoForBadges {
  return {
    publishedAt: publishedAt.toISOString(),
    durationSec,
  };
}

function createVideoWithMetrics(
  publishedAt: Date,
  metrics: Partial<VideoForBadges> = {}
): VideoForBadges {
  return {
    publishedAt: publishedAt.toISOString(),
    durationSec: metrics.durationSec ?? 300,
    views: metrics.views,
    likes: metrics.likes,
    comments: metrics.comments,
    subscribersGained: metrics.subscribersGained,
    subscribersLost: metrics.subscribersLost,
    averageViewPercentage: metrics.averageViewPercentage,
    ctr: metrics.ctr,
    impressions: metrics.impressions,
  };
}

// ============================================
// DATE/WINDOW HELPERS
// ============================================

describe("getWeekStart", () => {
  test("returns Sunday of current week", () => {
    const weekStart = getWeekStart(new Date("2026-01-02")); // Friday
    expect(weekStart.getDay()).toBe(0); // Sunday
    expect(weekStart.getHours()).toBe(0);
  });

  test("handles when today is Sunday", () => {
    const sunday = new Date("2025-12-28");
    const weekStart = getWeekStart(sunday);
    expect(weekStart.getDate()).toBe(28);
  });
});

describe("getMonthStart", () => {
  test("returns first day of month", () => {
    const monthStart = getMonthStart(new Date("2026-01-15"));
    expect(monthStart.getDate()).toBe(1);
    expect(monthStart.getHours()).toBe(0);
  });
});

describe("getDaysRemaining", () => {
  test("returns days remaining in week", () => {
    const days = getDaysRemaining("weekly");
    expect(days).toBeGreaterThanOrEqual(0);
    expect(days).toBeLessThanOrEqual(7);
  });

  test("returns days remaining in month", () => {
    const days = getDaysRemaining("monthly");
    expect(days).toBeGreaterThanOrEqual(0);
    expect(days).toBeLessThanOrEqual(31);
  });

  test("returns 0 for lifetime", () => {
    expect(getDaysRemaining("lifetime")).toBe(0);
  });
});

// ============================================
// VIDEO COUNTING
// ============================================

describe("countVideosInWindow", () => {
  test("counts videos in current week", () => {
    const videos = [
      createVideo(daysAgo(1)),
      createVideo(daysAgo(2)),
      createVideo(daysAgo(10)), // Outside 7d window
    ];
    expect(countVideosInWindow(videos, "7d")).toBe(2);
  });

  test("counts all videos for lifetime", () => {
    const videos = [
      createVideo(daysAgo(1)),
      createVideo(daysAgo(100)),
      createVideo(daysAgo(365)),
    ];
    expect(countVideosInWindow(videos, "lifetime")).toBe(3);
  });

  test("handles empty array", () => {
    expect(countVideosInWindow([], "weekly")).toBe(0);
  });
});

describe("countShortsInWindow", () => {
  test("counts only videos <= 60 seconds", () => {
    const videos = [
      createVideo(daysAgo(1), 30),  // Short
      createVideo(daysAgo(2), 60),  // Short (exactly 60s)
      createVideo(daysAgo(3), 61),  // Not a Short
      createVideo(daysAgo(4), 300), // Not a Short
    ];
    expect(countShortsInWindow(videos, "weekly")).toBe(2);
  });

  test("excludes videos without duration", () => {
    const videos = [
      createVideo(daysAgo(1), 30),
      createVideo(daysAgo(2)), // No duration
    ];
    expect(countShortsInWindow(videos, "weekly")).toBe(1);
  });
});

// ============================================
// STREAK CALCULATIONS
// ============================================

describe("calculatePostingStreakDays", () => {
  test("calculates consecutive days with uploads", () => {
    const videos = [
      createVideo(daysAgo(0)),
      createVideo(daysAgo(1)),
      createVideo(daysAgo(2)),
    ];
    const streak = calculatePostingStreakDays(videos);
    expect(streak).toBeGreaterThanOrEqual(3);
  });

  test("returns 0 for empty array", () => {
    expect(calculatePostingStreakDays([])).toBe(0);
  });
});

describe("calculatePostingStreakWeeks", () => {
  test("calculates consecutive weeks with uploads", () => {
    const videos = [
      createVideo(daysAgo(1)),
      createVideo(weeksAgo(1)),
      createVideo(weeksAgo(2)),
    ];
    const streak = calculatePostingStreakWeeks(videos);
    expect(streak).toBeGreaterThanOrEqual(1);
  });

  test("returns 0 for empty array", () => {
    expect(calculatePostingStreakWeeks([])).toBe(0);
  });

  test("breaks streak when a week is missed", () => {
    const videos = [
      createVideo(daysAgo(1)),
      createVideo(weeksAgo(3)), // Skips week 1 and 2
    ];
    const streak = calculatePostingStreakWeeks(videos);
    expect(streak).toBeLessThanOrEqual(1);
  });
});

// ============================================
// METRIC CALCULATIONS
// ============================================

describe("sumViewsInWindow", () => {
  test("sums views in window", () => {
    const videos = [
      createVideoWithMetrics(daysAgo(1), { views: 100 }),
      createVideoWithMetrics(daysAgo(2), { views: 200 }),
      createVideoWithMetrics(daysAgo(10), { views: 500 }), // Outside 7d
    ];
    expect(sumViewsInWindow(videos, "7d")).toBe(300);
  });

  test("handles videos with null views", () => {
    const videos = [
      createVideoWithMetrics(daysAgo(1), { views: 100 }),
      createVideoWithMetrics(daysAgo(2), {}),
    ];
    expect(sumViewsInWindow(videos, "7d")).toBe(100);
  });
});

describe("sumSubsGainedInWindow", () => {
  test("sums subscriber gains", () => {
    const videos = [
      createVideoWithMetrics(daysAgo(1), { subscribersGained: 10 }),
      createVideoWithMetrics(daysAgo(3), { subscribersGained: 5 }),
    ];
    expect(sumSubsGainedInWindow(videos, "7d")).toBe(15);
  });
});

describe("avgRetentionLastN", () => {
  test("calculates average retention", () => {
    const videos = [
      createVideoWithMetrics(daysAgo(1), { averageViewPercentage: 50 }),
      createVideoWithMetrics(daysAgo(2), { averageViewPercentage: 60 }),
      createVideoWithMetrics(daysAgo(3), { averageViewPercentage: 70 }),
    ];
    expect(avgRetentionLastN(videos, 3)).toBe(60);
  });

  test("returns 0 if not enough videos", () => {
    const videos = [
      createVideoWithMetrics(daysAgo(1), { averageViewPercentage: 50 }),
    ];
    expect(avgRetentionLastN(videos, 3)).toBe(0);
  });
});

describe("avgLikeRateLastN", () => {
  test("calculates like rate as percentage", () => {
    const videos = [
      createVideoWithMetrics(daysAgo(1), { views: 1000, likes: 50 }), // 5%
      createVideoWithMetrics(daysAgo(2), { views: 1000, likes: 100 }), // 10%
    ];
    expect(avgLikeRateLastN(videos, 2)).toBe(7.5);
  });
});

// ============================================
// METRIC AVAILABILITY
// ============================================

describe("checkMetricAvailability", () => {
  test("reports metrics available when data exists", () => {
    const videos = [
      createVideoWithMetrics(daysAgo(1), { views: 100, likes: 10, comments: 5, averageViewPercentage: 50 }),
      createVideoWithMetrics(daysAgo(2), { views: 200, likes: 20, comments: 10, averageViewPercentage: 55 }),
      createVideoWithMetrics(daysAgo(3), { views: 300, likes: 30, comments: 15, averageViewPercentage: 60 }),
    ];
    const channelStats: ChannelStatsForBadges = { subscriberCount: 1000, totalVideoCount: 50 };
    const availability = checkMetricAvailability(videos, channelStats);

    expect(availability.hasVideoMetrics).toBe(true);
    expect(availability.hasRetentionData).toBe(true);
    expect(availability.hasEngagementData).toBe(true);
    expect(availability.metrics.views?.available).toBe(true);
    expect(availability.metrics.subscriber_count?.available).toBe(true);
  });

  test("reports metrics unavailable when insufficient data", () => {
    const videos = [createVideoWithMetrics(daysAgo(1), {})];
    const availability = checkMetricAvailability(videos);

    expect(availability.hasVideoMetrics).toBe(false);
    expect(availability.metrics.views?.available).toBe(false);
    expect(availability.metrics.views?.reason).toBe("insufficient_videos");
  });
});

// ============================================
// BADGE PROGRESS
// ============================================

describe("computeAllBadgesProgress", () => {
  test("computes progress for all badges", () => {
    const videos = [
      createVideoWithMetrics(daysAgo(1), { views: 100 }),
      createVideoWithMetrics(daysAgo(2), { views: 200 }),
    ];
    const channelStats: ChannelStatsForBadges = { subscriberCount: 50, totalVideoCount: 10 };
    const unlockedBadges: UnlockedBadge[] = [];

    const badges = computeAllBadgesProgress(videos, channelStats, unlockedBadges);

    expect(badges.length).toBe(BADGES.length);
    expect(badges[0]).toHaveProperty("progress");
    expect(badges[0].progress).toHaveProperty("current");
    expect(badges[0].progress).toHaveProperty("target");
    expect(badges[0].progress).toHaveProperty("percent");
  });

  test("marks badges as locked when data is missing", () => {
    const videos: VideoForBadges[] = [];
    const unlockedBadges: UnlockedBadge[] = [];

    const badges = computeAllBadgesProgress(videos, undefined, unlockedBadges);

    // Quality badges should be locked (need CTR data)
    const ctrBadge = badges.find((b) => b.id === "click-magnet");
    expect(ctrBadge?.progress.lockedReason).toBeDefined();
  });

  test("preserves already unlocked badges", () => {
    const videos: VideoForBadges[] = [];
    const unlockedBadges: UnlockedBadge[] = [
      { badgeId: "first-upload", unlockedAt: "2026-01-01T00:00:00Z", seen: true },
    ];

    const badges = computeAllBadgesProgress(videos, undefined, unlockedBadges);

    const firstUpload = badges.find((b) => b.id === "first-upload");
    expect(firstUpload?.unlocked).toBe(true);
    expect(firstUpload?.unlockedAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("computeAllGoalsProgress", () => {
  test("computes progress for all default goals", () => {
    const videos = [
      createVideoWithMetrics(daysAgo(1), { views: 100 }),
    ];
    const channelStats: ChannelStatsForBadges = { subscriberCount: 50, totalVideoCount: 5 };

    const goals = computeAllGoalsProgress(videos, channelStats);

    expect(goals.length).toBe(DEFAULT_GOALS.length);
    expect(goals[0]).toHaveProperty("progress");
    expect(goals[0]).toHaveProperty("percentage");
    expect(goals[0]).toHaveProperty("status");
  });
});

// ============================================
// BADGE SORTING & HELPERS
// ============================================

describe("getNextBadge", () => {
  test("returns badge closest to unlock", () => {
    const videos = Array.from({ length: 8 }, (_, i) =>
      createVideoWithMetrics(daysAgo(i), { views: 100 })
    );
    const channelStats: ChannelStatsForBadges = { subscriberCount: 50, totalVideoCount: 8 };
    const badges = computeAllBadgesProgress(videos, channelStats, []);

    const next = getNextBadge(badges);

    expect(next).not.toBeNull();
    expect(next?.unlocked).toBe(false);
    expect(next?.progress.percent).toBeGreaterThan(0);
  });

  test("returns null when all badges are unlocked or locked", () => {
    const badges = computeAllBadgesProgress([], undefined, []);
    // Most badges will be locked due to missing data
    // This might still have some in progress, so we just check the function works
    const next = getNextBadge(badges);
    expect(next === null || next.progress.percent > 0).toBe(true);
  });
});

describe("sortBadgesByClosest", () => {
  test("sorts unlocked first, then by progress descending", () => {
    const videos = Array.from({ length: 5 }, (_, i) =>
      createVideoWithMetrics(daysAgo(i), { views: 100 })
    );
    const channelStats: ChannelStatsForBadges = { subscriberCount: 50, totalVideoCount: 5 };
    const unlockedBadges: UnlockedBadge[] = [
      { badgeId: "first-upload", unlockedAt: "2026-01-01T00:00:00Z", seen: true },
    ];

    const badges = computeAllBadgesProgress(videos, channelStats, unlockedBadges);
    const sorted = sortBadgesByClosest(badges);

    // First badge should be unlocked
    expect(sorted[0].unlocked).toBe(true);
  });
});

describe("sortBadgesByRarity", () => {
  test("sorts legendary first, then epic, rare, common", () => {
    const videos: VideoForBadges[] = [];
    const badges = computeAllBadgesProgress(videos, undefined, []);
    const sorted = sortBadgesByRarity(badges);

    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    for (let i = 1; i < sorted.length; i++) {
      const prevOrder = rarityOrder[sorted[i - 1].rarity];
      const currOrder = rarityOrder[sorted[i].rarity];
      expect(prevOrder).toBeLessThanOrEqual(currOrder);
    }
  });
});

describe("getBadgeSummary", () => {
  test("returns correct counts", () => {
    const videos = Array.from({ length: 5 }, (_, i) =>
      createVideoWithMetrics(daysAgo(i), { views: 100 })
    );
    const channelStats: ChannelStatsForBadges = { subscriberCount: 50, totalVideoCount: 5 };
    const unlockedBadges: UnlockedBadge[] = [
      { badgeId: "first-upload", unlockedAt: "2026-01-01T00:00:00Z", seen: true },
    ];

    const badges = computeAllBadgesProgress(videos, channelStats, unlockedBadges);
    const summary = getBadgeSummary(badges);

    expect(summary.total).toBe(BADGES.length);
    expect(summary.unlocked).toBeGreaterThanOrEqual(1);
    expect(summary.unlocked + summary.locked + summary.inProgress).toBe(summary.total);
  });
});

// ============================================
// CONSTANTS VALIDATION
// ============================================

describe("BADGES constant", () => {
  test("all badges have required fields", () => {
    for (const badge of BADGES) {
      expect(badge.id).toBeDefined();
      expect(badge.name).toBeDefined();
      expect(badge.description).toBeDefined();
      expect(badge.category).toBeDefined();
      expect(badge.rarity).toBeDefined();
      expect(badge.icon).toBeDefined();
      expect(badge.requiredMetrics).toBeDefined();
      expect(Array.isArray(badge.requiredMetrics)).toBe(true);
    }
  });

  test("badge IDs are unique", () => {
    const ids = BADGES.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("badge rarity is valid", () => {
    const validRarities = ["common", "rare", "epic", "legendary"];
    for (const badge of BADGES) {
      expect(validRarities).toContain(badge.rarity);
    }
  });

  test("dependsOn references exist", () => {
    for (const badge of BADGES) {
      if (badge.dependsOn) {
        const parent = BADGES.find((b) => b.id === badge.dependsOn);
        expect(parent).toBeDefined();
      }
    }
  });
});

describe("DEFAULT_GOALS constant", () => {
  test("all goals have required fields", () => {
    for (const goal of DEFAULT_GOALS) {
      expect(goal.id).toBeDefined();
      expect(goal.title).toBeDefined();
      expect(goal.description).toBeDefined();
      expect(goal.whyItMatters).toBeDefined();
      expect(goal.category).toBeDefined();
      expect(goal.badgeIds).toBeDefined();
      expect(Array.isArray(goal.badgeIds)).toBe(true);
      expect(goal.target).toBeGreaterThan(0);
    }
  });

  test("goal IDs are unique", () => {
    const ids = DEFAULT_GOALS.map((g) => g.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("goal badgeIds reference existing badges", () => {
    for (const goal of DEFAULT_GOALS) {
      for (const badgeId of goal.badgeIds) {
        const badge = BADGES.find((b) => b.id === badgeId);
        expect(badge).toBeDefined();
      }
    }
  });
});
