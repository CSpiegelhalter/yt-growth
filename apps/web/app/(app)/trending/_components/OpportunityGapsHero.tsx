"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import s from "../style.module.css";
import type { CappedBy, OpportunityGap } from "../types";
import { OpportunityGapCard } from "./OpportunityGapCard";

type Props = {
  opportunities: OpportunityGap[];
  teasers?: OpportunityGap[];
  newCount: number;
  onDismissNew: () => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  cappedBy: CappedBy;
  tier: string | undefined;
  updatedAt: string | undefined;
  loadMore: () => void;
};

type TeaserBlockProps = {
  teasers: OpportunityGap[];
  tier: string | undefined;
};

function TeaserBlock({ teasers, tier }: TeaserBlockProps) {
  const isGuest = tier === "guest";
  return (
    <div className={s.teaserBlock} aria-hidden>
      <div className={s.teaserGrid}>
        {teasers.map((gap, i) => (
          <OpportunityGapCard key={`teaser-${i}`} gap={gap} />
        ))}
      </div>
      <div className={s.teaserOverlay}>
        <p className={s.teaserOverlayTitle}>
          {isGuest ? "More gaps waiting for you" : "Unlock the full list"}
        </p>
        <p className={s.teaserOverlayBody}>
          {isGuest
            ? "Sign up free to see every opportunity gap, plus competitor overlap."
            : "Upgrade to PRO for the full set of opportunity gaps."}
        </p>
        <Link
          href={isGuest ? "/auth/signup" : "/pricing"}
          className={s.endOfListBtn}
        >
          {isGuest ? "Sign up free" : "Upgrade to PRO"}
        </Link>
      </div>
    </div>
  );
}

type EndOfListProps = {
  cappedBy: CappedBy;
  tier: string | undefined;
  teasers: OpportunityGap[];
  updatedAt: string | undefined;
};

function EndOfList({ cappedBy, tier, teasers, updatedAt }: EndOfListProps) {
  if (cappedBy === "tier" && teasers.length > 0) {
    return <TeaserBlock teasers={teasers} tier={tier} />;
  }
  // Fallback when teasers aren't available (e.g. dataset exhausted at the cap exactly).
  if (cappedBy === "tier" && tier === "guest") {
    return (
      <div className={s.endOfListCta}>
        <p className={s.endOfListTitle}>More gaps waiting for you.</p>
        <Link href="/auth/signup" className={s.endOfListBtn}>
          Sign up free
        </Link>
      </div>
    );
  }
  if (cappedBy === "tier" && tier === "FREE") {
    return (
      <div className={s.endOfListCta}>
        <p className={s.endOfListTitle}>Unlock the full list.</p>
        <Link href="/pricing" className={s.endOfListBtn}>
          Upgrade to PRO
        </Link>
      </div>
    );
  }
  if (cappedBy === "data") {
    return (
      <p className={s.endOfListNote}>
        That&apos;s all for now — refreshing every 4 hours
        {updatedAt ? ` (last updated ${formatUpdatedAt(updatedAt)})` : ""}.
      </p>
    );
  }
  return null;
}

function formatUpdatedAt(iso: string | undefined): string {
  if (!iso) {return "";}
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {return "";}
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OpportunityGapsHero({
  opportunities,
  teasers = [],
  newCount,
  onDismissNew,
  isLoading,
  isLoadingMore,
  hasMore,
  cappedBy,
  tier,
  updatedAt,
  loadMore,
}: Props) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const cats = new Set(opportunities.map((g) => g.category));
    return ["All", ...[...cats].sort()];
  }, [opportunities]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") {
      return opportunities;
    }
    return opportunities.filter((g) => g.category === activeCategory);
  }, [opportunities, activeCategory]);

  // IntersectionObserver auto-loads the next page when the sentinel
  // approaches the bottom of the contained scroll panel (root = panel,
  // not the viewport). Strict-mode double-fire is guarded by tracking
  // the last-triggered visible count.
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastTriggeredCountRef = useRef<number>(-1);

  useEffect(() => {
    if (!hasMore || isLoadingMore) {return;}
    const node = sentinelRef.current;
    const root = scrollRootRef.current;
    if (!node || !root) {return;}

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            lastTriggeredCountRef.current !== opportunities.length
          ) {
            lastTriggeredCountRef.current = opportunities.length;
            loadMore();
            break;
          }
        }
      },
      { root, rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore, opportunities.length]);

  const showSkeletons = isLoading && opportunities.length === 0;
  const showEmpty = !isLoading && filtered.length === 0;
  const showChips = categories.length > 2;

  return (
    <section className={s.gapsSection}>
      {/* Outer chrome — title + subtitle stay outside the scroll panel */}
      <div className={s.gapsOuterHeader}>
        <div className={s.gapsOuterHeaderRow}>
          <h2 className={s.gapsTitle}>Opportunity Gaps</h2>
          {newCount > 0 && (
            <button type="button" className={s.newBadge} onClick={onDismissNew}>
              {newCount} new
            </button>
          )}
        </div>
        <p className={s.gapsSubtitle}>
          High search volume + low competition = your best chance to rank.
        </p>
      </div>

      {/* Contained browse panel — fixed height, internal scroll */}
      <div className={s.gapsPanel}>
        <div ref={scrollRootRef} className={s.gapsPanelScroll}>
          {/* Sticky internal chrome — category chips pin to top of panel */}
          {showChips && (
            <div className={s.gapsStickyChrome}>
              <div className={s.categoryChips}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`${s.categoryChip} ${activeCategory === cat ? s.categoryChipActive : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={s.gapsPanelBody}>
            {showSkeletons ? (
              <div className={s.gapsGrid}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={s.gapCardSkeleton} />
                ))}
              </div>
            ) : showEmpty ? (
              <div className={s.gapsEmpty}>
                <p>No opportunity gaps found yet. Data refreshes every 4 hours.</p>
              </div>
            ) : (
              <>
                <div className={s.gapsGrid}>
                  {filtered.map((gap) => (
                    <OpportunityGapCard key={gap.keyword} gap={gap} />
                  ))}
                </div>

                {hasMore ? (
                  <div ref={sentinelRef} className={s.gapsSentinel}>
                    {isLoadingMore && (
                      <div className={s.gapsSpinner} aria-label="Loading more" />
                    )}
                  </div>
                ) : (
                  <EndOfList
                    cappedBy={cappedBy}
                    tier={tier}
                    teasers={teasers}
                    updatedAt={updatedAt}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
