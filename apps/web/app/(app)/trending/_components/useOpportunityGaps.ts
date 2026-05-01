"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";

import type { CappedBy, OpportunitiesResponse, OpportunityGap } from "../types";

const PAGE_SIZE = 10;

const fetcher = (url: string): Promise<OpportunitiesResponse> =>
  fetch(url).then((r) => r.json());

function getKey(idx: number, prev: OpportunitiesResponse | null) {
  if (prev && prev.meta?.hasMore === false) {
    return null;
  }
  return `/api/trending/opportunities?offset=${idx * PAGE_SIZE}&limit=${PAGE_SIZE}`;
}

/**
 * Tracks how many new opportunities appeared in page 0 since the last fetch
 * (cron refresh surfaces fresh gaps at the top). Diffed in an effect so
 * we don't mutate refs during render.
 */
function useNewOpportunityCount(page0: OpportunityGap[] | undefined) {
  const prevRef = useRef<OpportunityGap[] | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!page0) {
      return;
    }
    const prev = prevRef.current;
    if (prev && prev !== page0) {
      const prevKeywords = new Set(prev.map((g) => g.keyword));
      const fresh = page0.filter((g) => !prevKeywords.has(g.keyword)).length;
      setCount(fresh);
    }
    prevRef.current = page0;
  }, [page0]);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return { count, reset };
}

type DerivedMeta = {
  meta: OpportunitiesResponse["meta"] | null;
  hasMore: boolean;
  cappedBy: CappedBy;
};

function deriveMeta(data: OpportunitiesResponse[] | undefined): DerivedMeta {
  const lastPage = data?.at(-1);
  return {
    meta: lastPage?.meta ?? data?.[0]?.meta ?? null,
    hasMore: !!lastPage?.meta?.hasMore,
    cappedBy: lastPage?.meta?.cappedBy ?? null,
  };
}

export function useOpportunityGaps() {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<OpportunitiesResponse>(getKey, fetcher, {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
      dedupingInterval: 60_000,
      revalidateOnReconnect: true,
    });

  const opportunities = useMemo<OpportunityGap[]>(
    () => data?.flatMap((p) => p.opportunities ?? []) ?? [],
    [data],
  );

  const { meta, hasMore, cappedBy } = deriveMeta(data);
  const isLoadingMore =
    isValidating && !!data && data.length > 0 && data.length < size;

  // Teasers ride along on the page that flips cappedBy → "tier"; that's
  // typically the last fetched page. Use that page's teasers (if any).
  const teasers = data?.at(-1)?.teasers ?? [];

  const { count: newCount, reset: resetNewCount } = useNewOpportunityCount(
    data?.[0]?.opportunities,
  );

  const dismissNewBadge = useCallback(() => {
    resetNewCount();
    void mutate();
  }, [mutate, resetNewCount]);

  const loadMore = useCallback(() => {
    void setSize((s) => s + 1);
  }, [setSize]);

  return {
    opportunities,
    teasers,
    meta,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    cappedBy,
    loadMore,
    newCount,
    dismissNewBadge,
  };
}
