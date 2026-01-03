"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/ui";
import BadgeArt from "@/components/badges/BadgeArt";
import BadgeDetailModal from "@/components/badges/BadgeDetailModal";
import s from "./style.module.css";
import type { Me, Channel } from "@/types/api";
import type {
  BadgeWithProgress,
  GoalWithProgress,
  BadgesApiResponse,
  BadgeCategory,
  BadgeRarity,
  BadgeSortKey,
} from "@/lib/badges";
import {
  BADGE_CATEGORIES,
  BADGE_RARITIES,
  sortBadgesByClosest,
  sortBadgesByRecent,
  sortBadgesByRarity,
} from "@/lib/badges";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";

type Props = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
};

export default function GoalsClient({
  initialMe,
  initialChannels,
  initialActiveChannelId,
}: Props) {
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    urlChannelId ?? initialActiveChannelId
  );

  useSyncActiveChannelIdToLocalStorage(activeChannelId);

  const [data, setData] = useState<BadgesApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<BadgeCategory | "all">("all");
  const [rarityFilter, setRarityFilter] = useState<BadgeRarity | "all">("all");
  const [sortKey, setSortKey] = useState<BadgeSortKey>("closest");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProgress | null>(null);

  const activeChannel = initialChannels.find((c) => c.channel_id === activeChannelId);

  // Fetch badges data
  const fetchBadges = useCallback(async () => {
    if (!activeChannelId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/me/badges?channelId=${activeChannelId}`);
      if (!res.ok) throw new Error("Failed to load badges");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load badges");
    } finally {
      setLoading(false);
    }
  }, [activeChannelId]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Filter and sort badges
  const filteredBadges = useMemo(() => {
    if (!data?.badges) return [];

    let badges = [...data.badges];

    // Category filter
    if (categoryFilter !== "all") {
      badges = badges.filter((b) => b.category === categoryFilter);
    }

    // Rarity filter
    if (rarityFilter !== "all") {
      badges = badges.filter((b) => b.rarity === rarityFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      badges = badges.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortKey) {
      case "closest":
        return sortBadgesByClosest(badges);
      case "recent":
        return sortBadgesByRecent(badges);
      case "rarity":
        return sortBadgesByRarity(badges);
      case "alphabetical":
        return badges.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return badges;
    }
  }, [data?.badges, categoryFilter, rarityFilter, sortKey, searchQuery]);

  // Group goals by category
  const goalsByCategory = useMemo(() => {
    if (!data?.goals) return {};
    const grouped: Record<string, GoalWithProgress[]> = {};
    for (const goal of data.goals) {
      if (!grouped[goal.category]) grouped[goal.category] = [];
      grouped[goal.category].push(goal);
    }
    return grouped;
  }, [data?.goals]);

  // Mark badge as seen when modal opens
  const handleBadgeClick = useCallback(
    async (badge: BadgeWithProgress) => {
      setSelectedBadge(badge);

      // Mark as seen if newly unlocked
      if (badge.unlocked && !badge.seen && activeChannelId) {
        try {
          await fetch("/api/me/badges", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              badgeIds: [badge.id],
              channelId: activeChannelId,
            }),
          });
          // Update local state
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  badges: prev.badges.map((b) =>
                    b.id === badge.id ? { ...b, seen: true } : b
                  ),
                }
              : prev
          );
        } catch {
          // Ignore error
        }
      }
    },
    [activeChannelId]
  );

  // Count new badges
  const newBadgeCount = useMemo(() => {
    if (!data?.badges) return 0;
    return data.badges.filter((b) => b.unlocked && !b.seen).length;
  }, [data?.badges]);

  // No channel connected
  if (!activeChannelId || !activeChannel) {
    return (
      <PageContainer>
        <PageHeader
          title="Badge Collection"
          subtitle="Collect badges as you grow your channel."
        />
        <div className={s.noChannel}>
          <div className={s.noChannelIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M18 2H6v7a6 6 0 1012 0V2z" />
            </svg>
          </div>
          <h2 className={s.noChannelTitle}>Connect Your Channel</h2>
          <p className={s.noChannelDesc}>
            Link your YouTube channel to start collecting badges and tracking your growth.
          </p>
          <a href="/api/integrations/google/start" className={s.connectBtn}>
            Connect YouTube Channel
          </a>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Badge Collection"
        subtitle={
          activeChannel ? (
            <>Collecting badges for <strong>{activeChannel.title}</strong></>
          ) : (
            "Collect badges as you grow your channel."
          )
        }
      />

      {error && (
        <div className={s.errorBanner} onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {loading && <div className={s.loading}>Loading badges...</div>}

      {/* Header Summary */}
      {!loading && data && (
        <section className={s.summarySection}>
          <div className={s.summaryGrid}>
            {/* Badges Collected */}
            <div className={s.summaryCard}>
              <div className={s.summaryIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M18 2H6v7a6 6 0 1012 0V2z" />
                </svg>
              </div>
              <div className={s.summaryValue}>
                {data.summary.unlockedCount}
                <span className={s.summaryTotal}>/ {data.summary.totalBadges}</span>
              </div>
              <div className={s.summaryLabel}>Badges Collected</div>
            </div>

            {/* Weekly Streak */}
            <div className={s.summaryCard}>
              <div className={`${s.summaryIcon} ${s.streakIcon}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
                </svg>
              </div>
              <div className={s.summaryValue}>{data.summary.weeklyStreak}</div>
              <div className={s.summaryLabel}>Week Streak</div>
            </div>

            {/* Next Badge */}
            {data.summary.nextBadge && (
              <div
                className={`${s.summaryCard} ${s.nextBadgeCard}`}
                onClick={() => handleBadgeClick(data.summary.nextBadge!)}
              >
                <div className={s.nextBadgePreview}>
                  <BadgeArt
                    badgeId={data.summary.nextBadge.id}
                    icon={data.summary.nextBadge.icon}
                    rarity={data.summary.nextBadge.rarity}
                    unlocked={false}
                    size="sm"
                  />
                </div>
                <div className={s.nextBadgeInfo}>
                  <div className={s.nextBadgeLabel}>Next Badge</div>
                  <div className={s.nextBadgeName}>{data.summary.nextBadge.name}</div>
                  <div className={s.nextBadgeProgress}>
                    {data.summary.nextBadge.progress.percent}% complete
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Badge Gallery */}
      {!loading && data && (
        <section className={s.gallerySection}>
          <div className={s.galleryHeader}>
            <h2 className={s.sectionTitle}>
              Badge Gallery
              {newBadgeCount > 0 && (
                <span className={s.newCount}>{newBadgeCount} new</span>
              )}
            </h2>
          </div>

          {/* Filters */}
          <div className={s.filtersRow}>
            {/* Category */}
            <div className={s.filterGroup}>
              <label className={s.filterLabel}>Category</label>
              <select
                className={s.filterSelect}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as BadgeCategory | "all")}
              >
                {BADGE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rarity */}
            <div className={s.filterGroup}>
              <label className={s.filterLabel}>Rarity</label>
              <select
                className={s.filterSelect}
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value as BadgeRarity | "all")}
              >
                {BADGE_RARITIES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className={s.filterGroup}>
              <label className={s.filterLabel}>Sort</label>
              <select
                className={s.filterSelect}
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as BadgeSortKey)}
              >
                <option value="closest">Closest to Unlock</option>
                <option value="recent">Recently Unlocked</option>
                <option value="rarity">By Rarity</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>

            {/* Search */}
            <div className={`${s.filterGroup} ${s.searchGroup}`}>
              <label className={s.filterLabel}>Search</label>
              <input
                type="text"
                className={s.searchInput}
                placeholder="Search badges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Badge Grid */}
          <div className={s.badgeGrid} role="list">
            {filteredBadges.map((badge) => (
              <button
                key={badge.id}
                className={`${s.badgeCard} ${badge.unlocked ? s.unlocked : ""} ${
                  badge.progress.lockedReason ? s.locked : ""
                }`}
                onClick={() => handleBadgeClick(badge)}
                aria-label={`${badge.name} badge - ${
                  badge.unlocked
                    ? "Unlocked"
                    : badge.progress.lockedReason || `${badge.progress.percent}% complete`
                }`}
              >
                <div className={s.badgeArtWrap}>
                  <BadgeArt
                    badgeId={badge.id}
                    icon={badge.icon}
                    rarity={badge.rarity}
                    unlocked={badge.unlocked}
                    size="md"
                  />
                  {badge.unlocked && !badge.seen && (
                    <span className={s.newPill}>NEW</span>
                  )}
                </div>
                <div className={s.badgeName}>{badge.name}</div>
                <div className={s.badgeRarity} data-rarity={badge.rarity}>
                  {badge.rarity}
                </div>
                {!badge.unlocked && !badge.progress.lockedReason && (
                  <div className={s.badgeProgressBar}>
                    <div
                      className={s.badgeProgressFill}
                      style={{ width: `${badge.progress.percent}%` }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>

          {filteredBadges.length === 0 && (
            <div className={s.noResults}>
              <p>No badges match your filters</p>
              <button
                className={s.resetBtn}
                onClick={() => {
                  setCategoryFilter("all");
                  setRarityFilter("all");
                  setSearchQuery("");
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </section>
      )}

      {/* Goals Section */}
      {!loading && data && (
        <section className={s.goalsSection}>
          <h2 className={s.sectionTitle}>What to Do Next</h2>

          {Object.entries(goalsByCategory).map(([category, goals]) => (
            <div key={category} className={s.goalCategory}>
              <h3 className={s.goalCategoryTitle}>
                {BADGE_CATEGORIES.find((c) => c.id === category)?.label || category}
              </h3>
              <div className={s.goalsList}>
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`${s.goalCard} ${
                      goal.status === "completed" ? s.completed : ""
                    } ${goal.status === "locked" ? s.goalLocked : ""}`}
                  >
                    <div className={s.goalInfo}>
                      <h4 className={s.goalTitle}>{goal.title}</h4>
                      <p className={s.goalDesc}>{goal.whyItMatters}</p>
                      {goal.badgeIds.length > 0 && (
                        <div className={s.goalBadges}>
                          {goal.badgeIds.slice(0, 2).map((badgeId) => {
                            const badge = data.badges.find((b) => b.id === badgeId);
                            return badge ? (
                              <span
                                key={badgeId}
                                className={s.goalBadgeChip}
                                data-rarity={badge.rarity}
                              >
                                {badge.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <div className={s.goalProgress}>
                      {goal.status === "completed" ? (
                        <span className={s.completedBadge}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          Done
                        </span>
                      ) : goal.status === "locked" ? (
                        <span className={s.lockedBadge}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                          {goal.lockedReason || "Locked"}
                        </span>
                      ) : (
                        <div className={s.goalProgressWrap}>
                          <div className={s.goalProgressBar}>
                            <div
                              className={s.goalProgressFill}
                              style={{ width: `${goal.percentage}%` }}
                            />
                          </div>
                          <span className={s.goalProgressText}>
                            {goal.progressLabel} / {goal.targetLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Recent Activity */}
      {!loading && data && data.recentUnlocks.length > 0 && (
        <section className={s.recentSection}>
          <h2 className={s.sectionTitle}>Recent Unlocks</h2>
          <div className={s.recentList}>
            {data.recentUnlocks.slice(0, 5).map((unlock) => {
              const badge = data.badges.find((b) => b.id === unlock.badgeId);
              if (!badge) return null;
              return (
                <div
                  key={unlock.badgeId}
                  className={s.recentItem}
                  onClick={() => handleBadgeClick(badge)}
                >
                  <BadgeArt
                    badgeId={badge.id}
                    icon={badge.icon}
                    rarity={badge.rarity}
                    unlocked={true}
                    size="sm"
                  />
                  <div className={s.recentInfo}>
                    <span className={s.recentName}>{badge.name}</span>
                    <span className={s.recentDate}>
                      {new Date(unlock.unlockedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Badge Detail Modal */}
      <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </PageContainer>
  );
}
