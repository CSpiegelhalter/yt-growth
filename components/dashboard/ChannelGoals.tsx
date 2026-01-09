"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import s from "./ChannelGoals.module.css";

type Video = {
  publishedAt: string | null;
};

type Props = {
  videos: Video[];
  channelTitle?: string;
  /** Total video count on YouTube (from channel stats) */
  totalVideoCount?: number | null;
  /** Subscriber count from YouTube */
  subscriberCount?: number | null;
};

type Milestone = {
  id: string;
  label: string;
  description: string;
  current: number;
  target: number;
  icon: "video" | "calendar" | "streak" | "trophy" | "users" | "fire";
  unlocked: boolean;
  category: "videos" | "streak" | "subscribers";
  /** 0-100 percentage complete */
  percentage: number;
};

/**
 * ChannelGoals - Gamified progress milestones for channel growth
 * Prioritizes showing goals closest to completion
 * Eye-catching "focus goal" with supporting milestones
 */
export default function ChannelGoals({ videos, channelTitle, totalVideoCount, subscriberCount }: Props) {
  void channelTitle;
  const searchParams = useSearchParams();
  const channelId = searchParams.get("channelId");

  const { focusGoal, nearbyGoals, totalUnlocked, totalMilestones, weeklyStreak } = useMemo(() => {
    const videoCount = totalVideoCount ?? videos.length;
    const { weeklyStreak } = analyzePostingSchedule(videos);
    const subs = subscriberCount ?? 0;

    // All available milestones
    const allMilestones: Milestone[] = [
      // Video milestones
      {
        id: "videos-10",
        label: "First 10",
        description: "Upload 10 videos",
        current: Math.min(videoCount, 10),
        target: 10,
        icon: "video",
        unlocked: videoCount >= 10,
        category: "videos",
        percentage: Math.min(100, Math.round((videoCount / 10) * 100)),
      },
      {
        id: "videos-25",
        label: "Getting Started",
        description: "Upload 25 videos",
        current: Math.min(videoCount, 25),
        target: 25,
        icon: "video",
        unlocked: videoCount >= 25,
        category: "videos",
        percentage: Math.min(100, Math.round((videoCount / 25) * 100)),
      },
      {
        id: "videos-50",
        label: "Building Momentum",
        description: "Upload 50 videos",
        current: Math.min(videoCount, 50),
        target: 50,
        icon: "video",
        unlocked: videoCount >= 50,
        category: "videos",
        percentage: Math.min(100, Math.round((videoCount / 50) * 100)),
      },
      {
        id: "videos-100",
        label: "Century Club",
        description: "Upload 100 videos",
        current: Math.min(videoCount, 100),
        target: 100,
        icon: "trophy",
        unlocked: videoCount >= 100,
        category: "videos",
        percentage: Math.min(100, Math.round((videoCount / 100) * 100)),
      },

      // Streak milestones
      {
        id: "streak-2",
        label: "Getting Consistent",
        description: "2 week posting streak",
        current: Math.min(weeklyStreak, 2),
        target: 2,
        icon: "fire",
        unlocked: weeklyStreak >= 2,
        category: "streak",
        percentage: Math.min(100, Math.round((weeklyStreak / 2) * 100)),
      },
      {
        id: "streak-4",
        label: "Consistent Creator",
        description: "4 week posting streak",
        current: Math.min(weeklyStreak, 4),
        target: 4,
        icon: "calendar",
        unlocked: weeklyStreak >= 4,
        category: "streak",
        percentage: Math.min(100, Math.round((weeklyStreak / 4) * 100)),
      },
      {
        id: "streak-8",
        label: "On Fire",
        description: "8 week posting streak",
        current: Math.min(weeklyStreak, 8),
        target: 8,
        icon: "streak",
        unlocked: weeklyStreak >= 8,
        category: "streak",
        percentage: Math.min(100, Math.round((weeklyStreak / 8) * 100)),
      },
      {
        id: "streak-12",
        label: "Unstoppable",
        description: "12 week posting streak",
        current: Math.min(weeklyStreak, 12),
        target: 12,
        icon: "trophy",
        unlocked: weeklyStreak >= 12,
        category: "streak",
        percentage: Math.min(100, Math.round((weeklyStreak / 12) * 100)),
      },

      // Subscriber milestones (only if we have sub count)
      ...(subs > 0
        ? [
            {
              id: "subs-100",
              label: "First 100",
              description: "Reach 100 subscribers",
              current: Math.min(subs, 100),
              target: 100,
              icon: "users" as const,
              unlocked: subs >= 100,
              category: "subscribers" as const,
              percentage: Math.min(100, Math.round((subs / 100) * 100)),
            },
            {
              id: "subs-500",
              label: "Growing Fast",
              description: "Reach 500 subscribers",
              current: Math.min(subs, 500),
              target: 500,
              icon: "users" as const,
              unlocked: subs >= 500,
              category: "subscribers" as const,
              percentage: Math.min(100, Math.round((subs / 500) * 100)),
            },
            {
              id: "subs-1000",
              label: "1K Club",
              description: "Reach 1,000 subscribers",
              current: Math.min(subs, 1000),
              target: 1000,
              icon: "trophy" as const,
              unlocked: subs >= 1000,
              category: "subscribers" as const,
              percentage: Math.min(100, Math.round((subs / 1000) * 100)),
            },
          ]
        : []),
    ];

    // Filter to show only relevant milestones (not yet unlocked OR recently unlocked)
    const inProgressMilestones = allMilestones.filter((m) => !m.unlocked);

    // Sort by percentage (closest to completion first)
    const sortedByProgress = [...inProgressMilestones].sort(
      (a, b) => b.percentage - a.percentage
    );

    // Find the best focus goal (highest progress, not yet complete)
    const focus = sortedByProgress[0] ?? null;

    // Get 2-3 other goals close to completion (different categories if possible)
    const nearby: Milestone[] = [];
    const usedCategories = new Set<string>();
    if (focus) usedCategories.add(focus.category);

    for (const m of sortedByProgress.slice(1)) {
      // Prefer different categories for variety
      if (!usedCategories.has(m.category) && nearby.length < 2) {
        nearby.push(m);
        usedCategories.add(m.category);
      } else if (nearby.length < 2 && m.percentage >= 20) {
        nearby.push(m);
      }
      if (nearby.length >= 2) break;
    }

    const unlocked = allMilestones.filter((m) => m.unlocked).length;

    return {
      focusGoal: focus,
      nearbyGoals: nearby,
      totalUnlocked: unlocked,
      totalMilestones: allMilestones.length,
      weeklyStreak,
    };
  }, [videos, totalVideoCount, subscriberCount]);

  if (videos.length === 0) return null;
  if (!focusGoal && nearbyGoals.length === 0) return null;

  const goalsHref = channelId ? `/goals?channelId=${channelId}` : "/goals";

  return (
    <Link
      href={goalsHref}
      className={s.container}
      aria-label="View all goals and achievements"
    >
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.titleWrap}>
            <h2 className={s.title}>Your Progress</h2>
            {weeklyStreak > 0 && (
              <span className={s.streakBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                {weeklyStreak} week streak
              </span>
            )}
          </div>
        </div>
        <div className={s.headerRight}>
          <span className={s.progressBadge}>
            {totalUnlocked}/{totalMilestones}
          </span>
          <span className={s.viewAll}>
            View all
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </div>
      </div>

      {/* Focus Goal - The closest to completion */}
      {focusGoal && (
        <div className={s.focusCard}>
          <div className={s.focusLabel}>
            <span className={s.focusLabelText}>Next milestone</span>
            <span className={s.focusPercentage}>{focusGoal.percentage}%</span>
          </div>
          <div className={s.focusContent}>
            <div className={s.focusIcon}>
              <MilestoneIcon type={focusGoal.icon} />
            </div>
            <div className={s.focusInfo}>
              <h3 className={s.focusTitle}>{focusGoal.label}</h3>
              <p className={s.focusDesc}>{focusGoal.description}</p>
            </div>
            <div className={s.focusProgress}>
              <span className={s.focusCount}>
                {formatNumber(focusGoal.current)}/{formatNumber(focusGoal.target)}
              </span>
            </div>
          </div>
          <div className={s.focusBar}>
            <div
              className={s.focusBarFill}
              style={{ width: `${focusGoal.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Nearby Goals - Others close to completion */}
      {nearbyGoals.length > 0 && (
        <div className={s.nearbyGoals}>
          {nearbyGoals.map((milestone) => (
            <div key={milestone.id} className={s.miniCard}>
              <div className={s.miniIcon}>
                <MilestoneIcon type={milestone.icon} />
              </div>
              <div className={s.miniInfo}>
                <span className={s.miniTitle}>{milestone.label}</span>
                <span className={s.miniProgress}>
                  {formatNumber(milestone.current)}/{formatNumber(milestone.target)}
                </span>
              </div>
              <div className={s.miniBar}>
                <div
                  className={s.miniBarFill}
                  style={{ width: `${milestone.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}

function MilestoneIcon({ type }: { type: string }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "video":
      return (
        <svg {...props}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M10 9l5 3-5 3V9z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "streak":
    case "fire":
      return (
        <svg {...props}>
          <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...props}>
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 1012 0V2z" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <path d="M20 8v6M23 11h-6" />
        </svg>
      );
    default:
      return null;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;
  }
  return num.toString();
}

/**
 * Analyze posting schedule to determine consistency
 */
function analyzePostingSchedule(videos: Video[]): {
  weeklyStreak: number;
  postsPerMonth: number;
  isConsistent: boolean;
} {
  if (videos.length === 0) {
    return { weeklyStreak: 0, postsPerMonth: 0, isConsistent: false };
  }

  const sorted = [...videos]
    .filter((v) => v.publishedAt)
    .map((v) => new Date(v.publishedAt!))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sorted.length === 0) {
    return { weeklyStreak: 0, postsPerMonth: 0, isConsistent: false };
  }

  const now = new Date();
  let weeklyStreak = 0;
  let currentWeekStart = getWeekStart(now);

  for (let i = 0; i < 52; i++) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const hasVideoThisWeek = sorted.some(
      (date) => date >= currentWeekStart && date < weekEnd
    );

    if (hasVideoThisWeek) {
      weeklyStreak++;
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    } else {
      break;
    }
  }

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const postsPerMonth = sorted.filter((d) => d >= thirtyDaysAgo).length;
  const isConsistent = weeklyStreak >= 4;

  return { weeklyStreak, postsPerMonth, isConsistent };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
