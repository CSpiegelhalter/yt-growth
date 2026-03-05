"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiFetchJson } from "@/lib/client/api";
import type { CoreAnalysis } from "@/lib/features/video-insights/types";

type SummaryResponse = {
  summary: CoreAnalysis;
  cached?: boolean;
};

export function useVideoInsights(
  channelId: string,
  videoId: string | undefined,
) {
  const [summary, setSummary] = useState<CoreAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!videoId) {
      return;
    }

    const key = `${channelId}:${videoId}`;
    if (fetchedRef.current === key && summary) {
      return;
    }
    fetchedRef.current = key;

    setLoading(true);
    setSummaryLoading(true);
    setError(null);
    setSummary(null);

    const base = `/api/me/channels/${channelId}/videos/${videoId}/insights`;

    try {
      await apiFetchJson(`${base}/analytics?range=28d`);
    } catch {
      setError("Unable to generate video insights.");
      setLoading(false);
      setSummaryLoading(false);
      return;
    }

    // Analytics resolved — unblock the UI to show metric pills
    setLoading(false);

    try {
      const result = await apiFetchJson<SummaryResponse>(
        `${base}/summary?range=28d`,
      );
      setSummary(result.summary);
    } catch {
      setError("Unable to generate video summary.");
    } finally {
      setSummaryLoading(false);
    }
  }, [channelId, videoId, summary]);

  const retry = useCallback(() => {
    fetchedRef.current = null;
    void fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    void fetchInsights();
  }, [fetchInsights]);

  return { summary, loading, summaryLoading, error, retry };
}
