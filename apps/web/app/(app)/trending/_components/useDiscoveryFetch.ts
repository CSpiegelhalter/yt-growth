"use client";

import { useRef, useState } from "react";

import type {
  DiscoveredNiche,
  DiscoveryFilters,
  DiscoveryListType,
  DiscoveryResponse,
} from "../types";

type FetchParams = {
  listType: DiscoveryListType;
  filters: DiscoveryFilters;
  queryText: string;
  append: boolean;
  cursor: string | null;
};

type UseDiscoveryFetchReturn = {
  niches: DiscoveredNiche[];
  setNiches: React.Dispatch<React.SetStateAction<DiscoveredNiche[]>>;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  totalFound: number;
  hasSearched: boolean;
  nextCursor: string | null;
  setNextCursor: (cursor: string | null) => void;
  fetchNiches: (params: FetchParams) => void;
};

export function useDiscoveryFetch(
  dismissedNiches: Set<string>,
): UseDiscoveryFetchReturn {
  const [niches, setNiches] = useState<DiscoveredNiche[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchNiches = (params: FetchParams) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    void (async () => {
      try {
        const response = await fetch("/api/competitors/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listType: params.listType,
            filters: params.filters,
            queryText: params.queryText.trim() || undefined,
            cursor: params.append ? params.cursor : null,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        const data: DiscoveryResponse = await response.json();
        const filtered = data.niches.filter(
          (n) => !dismissedNiches.has(n.id),
        );

        if (params.append) {
          setNiches((prev) => [...prev, ...filtered]);
        } else {
          setNiches(filtered);
        }
        setHasMore(data.hasMore);
        setTotalFound(data.totalFound);
        setNextCursor(data.nextCursor ?? null);
      } catch (error_) {
        if ((error_ as Error).name === "AbortError") {
          return;
        }
        setError(
          error_ instanceof Error
            ? error_.message
            : "Failed to discover niches",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return {
    niches,
    setNiches,
    isLoading,
    error,
    hasMore,
    totalFound,
    hasSearched,
    nextCursor,
    setNextCursor,
    fetchNiches,
  };
}
