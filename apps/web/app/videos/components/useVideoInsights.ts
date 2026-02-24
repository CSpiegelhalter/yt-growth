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
    setError(null);
    setSummary(null);

    try {
      const base = `/api/me/channels/${channelId}/videos/${videoId}/insights`;

      await apiFetchJson(`${base}/analytics?range=28d`);

      const result = await apiFetchJson<SummaryResponse>(
        `${base}/summary?range=28d`,
      );
      setSummary(result.summary);
    } catch {
      setError("Unable to generate video insights.");
    } finally {
      setLoading(false);
    }
  }, [channelId, videoId, summary]);

  const retry = useCallback(() => {
    fetchedRef.current = null;
    void fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    void fetchInsights();
  }, [fetchInsights]);

  return { summary, loading, error, retry };
}
