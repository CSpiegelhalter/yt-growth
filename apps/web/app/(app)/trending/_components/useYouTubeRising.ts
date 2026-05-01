"use client";

import useSWR from "swr";

import type { YouTubeRisingResponse } from "../types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useYouTubeRising(category?: string) {
  const url = category
    ? `/api/trending/youtube-rising?category=${encodeURIComponent(category)}`
    : "/api/trending/youtube-rising";

  const { data, error, isLoading } = useSWR<YouTubeRisingResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    },
  );

  return {
    videos: data?.videos ?? [],
    meta: data?.meta ?? null,
    isLoading,
    error,
  };
}
