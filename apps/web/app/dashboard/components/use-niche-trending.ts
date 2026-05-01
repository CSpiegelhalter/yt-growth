"use client";

import { useEffect, useState } from "react";

import { getYouTubeCategoryForNiche } from "@/lib/shared/niche-categories";

import type { RisingVideo } from "../../(app)/trending/types";

type State = {
  videos: RisingVideo[];
  isLoading: boolean;
};

const INITIAL: State = { videos: [], isLoading: false };

/**
 * Fetches the top rising YouTube videos filtered to the given niche's
 * YouTube category. Returns an empty list if the niche has no mapping
 * or the API returns nothing — never fabricates entries.
 */
export function useNicheTrending(niche: string | null, limit = 5): State {
  const [state, setState] = useState<State>(INITIAL);

  useEffect(() => {
    if (!niche) {
      setState(INITIAL);
      return;
    }
    const categoryId = getYouTubeCategoryForNiche(niche);
    if (!categoryId) {
      setState(INITIAL);
      return;
    }
    let cancelled = false;
    setState({ videos: [], isLoading: true });

    const run = async () => {
      try {
        const res = await fetch(
          `/api/trending/youtube-rising?category=${encodeURIComponent(categoryId)}`,
        );
        const data = res.ok
          ? ((await res.json()) as { videos?: RisingVideo[] })
          : { videos: [] };
        if (cancelled) {return;}
        const videos = Array.isArray(data.videos) ? data.videos.slice(0, limit) : [];
        setState({ videos, isLoading: false });
      } catch {
        if (cancelled) {return;}
        setState({ videos: [], isLoading: false });
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [niche, limit]);

  return state;
}
