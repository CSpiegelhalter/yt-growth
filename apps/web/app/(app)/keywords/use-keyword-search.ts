"use client";

import { useRef, useState } from "react";

import type { useToast } from "@/components/ui/Toast";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";

import type {
  KeywordResearchResponse,
  KeywordTrendsResponse,
  YoutubeSerpResponse,
} from "./schemas";
import {
  GoogleTrendsResponseSchema,
  parseRelatedKeywordRows,
  parseYouTubeRankingResults,
} from "./schemas";
import type { GoogleTrendsData, RelatedKeyword, YouTubeRanking } from "./types";
import { useKeywordTaskPolling, useTrendsTaskPolling } from "./use-task-polling";

export function useKeywordSearch(toast: ReturnType<typeof useToast>["toast"]) {
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);

  const [relatedKeywords, setRelatedKeywords] = useState<RelatedKeyword[]>([]);
  const [rankings, setRankings] = useState<YouTubeRanking[]>([]);
  const [trends, setTrends] = useState<GoogleTrendsData | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  const pendingRequestRef = useRef<{ keyword: string; database: string } | null>(null);

  function consumePendingRequest() {
    const pending = pendingRequestRef.current;
    pendingRequestRef.current = null;
    return pending;
  }

  const keywordPolling = useKeywordTaskPolling((rows) => {
    setRelatedKeywords(rows);
    setLoadingKeywords(false);
  });

  const trendsPolling = useTrendsTaskPolling((data) => {
    setTrends(data);
    setLoadingTrends(false);
  });

  function resetResults() {
    setRelatedKeywords([]);
    setRankings([]);
    setTrends(null);
    setError(null);
  }

  async function fetchRelatedKeywords(kws: string | string[], db: string) {
    const kwArr = Array.isArray(kws) ? kws : [kws];
    setLoadingKeywords(true);
    try {
      const data = await apiFetchJson<KeywordResearchResponse>("/api/keywords/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "related", phrases: kwArr, database: db }),
      });
      if (data.needsAuth) {
        pendingRequestRef.current = { keyword: kwArr[0], database: db };
        setShowAuthModal(true);
        setLoadingKeywords(false);
        return;
      }
      if (data.pending && data.taskId) {
        keywordPolling.start(data.taskId);
        return;
      }
      setLoadingKeywords(false);
      setRelatedKeywords(parseRelatedKeywordRows(data.rows));
    } catch (error_) {
      setLoadingKeywords(false);
      if (!isApiClientError(error_)) {
        setError({ title: "Search failed", message: "An unexpected error occurred" });
        return;
      }
      if (error_.code === "LIMIT_REACHED") {
        setShowPaywall(true);
        toast("You've reached your daily search limit", "info");
        return;
      }
      if (error_.status === 503) {
        setError({
          title: "Service temporarily unavailable",
          message: "The keyword research service is temporarily unavailable. Please try again in a few minutes.",
        });
        return;
      }
      setError({ title: "Search failed", message: error_.message });
    }
  }

  async function fetchTrends(kw: string, db: string) {
    setLoadingTrends(true);
    try {
      const data = await apiFetchJson<KeywordTrendsResponse>("/api/keywords/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, database: db }),
      });
      if (data.pending && data.taskId) {
        trendsPolling.start(data.taskId);
        return;
      }
      setLoadingTrends(false);
      const parsed = GoogleTrendsResponseSchema.safeParse(data);
      if (parsed.success) {setTrends(parsed.data);}
    } catch {
      setLoadingTrends(false);
    }
  }

  async function fetchRankings(kw: string, db: string) {
    setLoadingRankings(true);
    try {
      const data = await apiFetchJson<YoutubeSerpResponse>("/api/keywords/youtube-serp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, location: db, limit: 10 }),
      });
      setLoadingRankings(false);
      if (data.needsAuth) { setRankings([]); return; }
      if (data.results && Array.isArray(data.results)) {
        setRankings(parseYouTubeRankingResults(data.results));
      }
    } catch {
      setLoadingRankings(false);
      setRankings([]);
    }
  }

  const isLoading = loadingKeywords || loadingRankings || loadingTrends || keywordPolling.isPolling;
  const hasResults = relatedKeywords.length > 0 || rankings.length > 0;

  return {
    relatedKeywords, rankings, trends,
    loadingKeywords, loadingRankings, loadingTrends, isLoading, hasResults,
    showAuthModal, setShowAuthModal, showPaywall, setShowPaywall,
    error, setError,
    consumePendingRequest, resetResults,
    fetchRelatedKeywords, fetchRankings, fetchTrends,
  };
}
