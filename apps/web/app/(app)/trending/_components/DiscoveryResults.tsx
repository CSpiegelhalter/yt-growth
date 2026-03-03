"use client";

import { AlertCircleIcon, CompassIcon, SearchIcon } from "@/components/icons";

import s from "../style.module.css";
import type { DiscoveredNiche } from "../types";
import NicheDiscoveryCard from "./NicheDiscoveryCard";

type Props = {
  error: string | null;
  isLoading: boolean;
  hasSearched: boolean;
  visibleNiches: DiscoveredNiche[];
  totalFound: number;
  hasMore: boolean;
  savedNiches: Set<string>;
  onRetry: () => void;
  onSearchNiche: (niche: DiscoveredNiche) => void;
  onSave: (niche: DiscoveredNiche) => void;
  onDismiss: (niche: DiscoveredNiche) => void;
  onLoadMore: () => void;
  onClearAll: () => void;
};

export function DiscoveryResults({
  error,
  isLoading,
  hasSearched,
  visibleNiches,
  totalFound,
  hasMore,
  savedNiches,
  onRetry,
  onSearchNiche,
  onSave,
  onDismiss,
  onLoadMore,
  onClearAll,
}: Props) {
  if (error) {
    return (
      <div className={s.discoveryError}>
        <AlertCircleIcon size={20} />
        <p>{error}</p>
        <button type="button" onClick={onRetry} className={s.retryBtn}>
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && visibleNiches.length === 0) {
    return (
      <div className={s.discoveryLoading}>
        <span className={s.spinner} />
        <p>Finding niches...</p>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className={s.discoveryEmpty}>
        <div className={s.discoveryEmptyIcon}>
          <CompassIcon size={48} strokeWidth={1.5} />
        </div>
        <h3 className={s.discoveryEmptyTitle}>Discover Rising Niches</h3>
        <p className={s.discoveryEmptyDesc}>
          Use the filters to discover niches that match your channel goals.
          When you find something interesting, click &quot;Search this niche&quot; to
          explore competitors.
        </p>
      </div>
    );
  }

  if (visibleNiches.length === 0) {
    return (
      <div className={s.discoveryEmpty}>
        <div className={s.discoveryEmptyIcon}>
          <SearchIcon size={48} strokeWidth={1.5} />
        </div>
        <h3 className={s.discoveryEmptyTitle}>No Niches Found</h3>
        <p className={s.discoveryEmptyDesc}>
          Try broadening your filters — increase the time window, lower the
          minimum views/day, or select &quot;Any Size&quot; for channels.
        </p>
        <button
          type="button"
          className={s.resetFiltersBtnLarge}
          onClick={onClearAll}
        >
          Clear all
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={s.discoveryResultsHeader}>
        <p className={s.discoveryResultsCount}>
          Found <strong>{totalFound}</strong> niches
          {totalFound > visibleNiches.length &&
            ` (showing ${visibleNiches.length})`}
        </p>
      </div>

      <div className={s.nicheCardsGrid}>
        {visibleNiches.map((niche) => (
          <NicheDiscoveryCard
            key={niche.id}
            niche={niche}
            onSearchThisNiche={onSearchNiche}
            onSave={onSave}
            onDismiss={onDismiss}
            isSaved={savedNiches.has(niche.id)}
          />
        ))}
      </div>

      {hasMore && (
        <div className={s.discoveryLoadMore}>
          <button
            type="button"
            className={s.loadMoreButton}
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More Niches"}
          </button>
        </div>
      )}

      {isLoading && (
        <div className={s.discoveryLoadingMore}>
          <span className={s.spinnerSmall} />
          <p>Finding more niches...</p>
        </div>
      )}
    </>
  );
}
