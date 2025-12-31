"use client";

import { useMemo } from "react";
import s from "./ChannelGoals.module.css";

type Video = {
  publishedAt: string | null;
};

type Props = {
  videos: Video[];
  channelTitle?: string;
  /** Total video count on YouTube (from channel stats) */
  totalVideoCount?: number | null;
};

type Milestone = {
  id: string;
  label: string;
  description: string;
  current: number;
  target: number;
  icon: "video" | "calendar" | "streak" | "trophy";
  unlocked: boolean;
  category: "videos" | "streak";
};

/**
 * ChannelGoals - Gamified progress milestones for channel growth
 * Shows ONE milestone at a time per category - once reached, shows the next
 */
export default function ChannelGoals({ videos, channelTitle, totalVideoCount }: Props) {
  const { currentMilestone, nextMilestone, totalUnlocked, totalMilestones } = useMemo(() => {
    // Use totalVideoCount from YouTube if available, otherwise fall back to loaded videos count
    const videoCount = totalVideoCount ?? videos.length;
    const { weeklyStreak } = analyzePostingSchedule(videos);

    // Video count milestones (progressive)
    const videoMilestones: Milestone[] = [
      {
        id: "videos-25",
        label: "Getting Started",
        description: "Upload 25 videos",
        current: Math.min(videoCount, 25),
        target: 25,
        icon: "video",
        unlocked: videoCount >= 25,
        category: "videos",
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
      },
    ];

    // Streak milestones (progressive)
    const streakMilestones: Milestone[] = [
      {
        id: "consistency",
        label: "Consistent Creator",
        description: "Post weekly for 4+ weeks",
        current: Math.min(weeklyStreak, 4),
        target: 4,
        icon: "calendar",
        unlocked: weeklyStreak >= 4,
        category: "streak",
      },
      {
        id: "streak-8",
        label: "On a Roll",
        description: "8 week posting streak",
        current: Math.min(weeklyStreak, 8),
        target: 8,
        icon: "streak",
        unlocked: weeklyStreak >= 8,
        category: "streak",
      },
    ];

    // Find the NEXT milestone to show for each category (first unlocked one, or first unachieved)
    const getActiveMilestone = (milestones: Milestone[]): Milestone | null => {
      // Find first unachieved milestone
      const nextUnachieved = milestones.find((m) => !m.unlocked);
      if (nextUnachieved) return nextUnachieved;
      // All achieved - show the last one as "complete"
      return milestones[milestones.length - 1] ?? null;
    };

    const activeVideoMilestone = getActiveMilestone(videoMilestones);
    const activeStreakMilestone = getActiveMilestone(streakMilestones);

    // Count total unlocked
    const allMilestones = [...videoMilestones, ...streakMilestones];
    const unlocked = allMilestones.filter((m) => m.unlocked).length;

    // Determine which to show as "current" (closest to completion)
    const currentActive = [activeVideoMilestone, activeStreakMilestone]
      .filter(Boolean)
      .filter((m) => !m!.unlocked)
      .sort((a, b) => {
        const aProgress = a!.current / a!.target;
        const bProgress = b!.current / b!.target;
        return bProgress - aProgress; // Higher progress first
      })[0];

    return {
      currentMilestone: activeVideoMilestone, // Always show video milestone
      nextMilestone: activeStreakMilestone, // And streak milestone if available
      totalUnlocked: unlocked,
      totalMilestones: allMilestones.length,
    };
  }, [videos, totalVideoCount]);

  if (videos.length === 0) return null;

  // Determine what to show based on progress
  const milestonesToShow: Milestone[] = [];
  if (currentMilestone) milestonesToShow.push(currentMilestone);
  if (nextMilestone && nextMilestone.id !== currentMilestone?.id) {
    milestonesToShow.push(nextMilestone);
  }

  if (milestonesToShow.length === 0) return null;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h2 className={s.title}>Your Progress</h2>
          <span className={s.progress}>
            {totalUnlocked}/{totalMilestones} milestones
          </span>
        </div>
      </div>

      <div className={s.milestones}>
        {milestonesToShow.map((milestone) => (
          <MilestoneCard key={milestone.id} milestone={milestone} />
        ))}
      </div>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const percentage = Math.round((milestone.current / milestone.target) * 100);

  return (
    <div className={`${s.card} ${milestone.unlocked ? s.unlocked : ""}`}>
      <div className={s.cardIcon}>
        <MilestoneIcon type={milestone.icon} unlocked={milestone.unlocked} />
      </div>
      <div className={s.cardContent}>
        <div className={s.cardHeader}>
          <h3 className={s.cardTitle}>{milestone.label}</h3>
          {milestone.unlocked && (
            <span className={s.checkmark}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
          )}
        </div>
        <p className={s.cardDesc}>{milestone.description}</p>
        <div className={s.progressWrap}>
          <div className={s.progressBar}>
            <div
              className={s.progressFill}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={s.progressText}>
            {milestone.current}/{milestone.target}
          </span>
        </div>
      </div>
    </div>
  );
}

function MilestoneIcon({ type, unlocked }: { type: string; unlocked: boolean }) {
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
      return (
        <svg {...props}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
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
    default:
      return null;
  }
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

  // Sort videos by date (newest first)
  const sorted = [...videos]
    .filter((v) => v.publishedAt)
    .map((v) => new Date(v.publishedAt!))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sorted.length === 0) {
    return { weeklyStreak: 0, postsPerMonth: 0, isConsistent: false };
  }

  // Calculate weekly streak (how many consecutive weeks have at least 1 video)
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

  // Calculate posts per month (last 30 days)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const postsPerMonth = sorted.filter((d) => d >= thirtyDaysAgo).length;

  // Consider consistent if posting at least weekly
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

