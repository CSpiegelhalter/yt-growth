"use client";

import { useCallback, useEffect, useState } from "react";

import type { VideoIdea } from "@/lib/features/video-ideas/types";

type UseVideoIdeasReturn = {
  ideas: VideoIdea[];
  loading: boolean;
  error: string | null;
  createIdea: (input: {
    summary: string;
    title?: string;
    script?: string;
    description?: string;
    tags?: string[];
    postDate?: string;
  }) => Promise<VideoIdea>;
  updateIdea: (id: string, input: {
    summary?: string;
    title?: string | null;
    script?: string | null;
    description?: string | null;
    tags?: string[];
    postDate?: string | null;
    status?: "draft" | "planned";
  }) => Promise<VideoIdea>;
  deleteIdea: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
};

export function useVideoIdeas(channelId: string | null): UseVideoIdeasReturn {
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    if (!channelId) {return;}
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/channels/${channelId}/ideas`);
      if (!res.ok) {throw new Error("Failed to fetch ideas");}
      const data = await res.json() as { ideas: VideoIdea[] };
      setIdeas(data.ideas);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to fetch ideas");
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    void fetchIdeas();
  }, [fetchIdeas]);

  const createIdeaFn = useCallback(async (input: {
    summary: string;
    title?: string;
    script?: string;
    description?: string;
    tags?: string[];
    postDate?: string;
  }): Promise<VideoIdea> => {
    const res = await fetch(`/api/me/channels/${channelId}/ideas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {throw new Error("Failed to create idea");}
    const data = await res.json() as { idea: VideoIdea };
    await fetchIdeas();
    return data.idea;
  }, [channelId, fetchIdeas]);

  const updateIdeaFn = useCallback(async (id: string, input: Record<string, unknown>): Promise<VideoIdea> => {
    const res = await fetch(`/api/me/channels/${channelId}/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {throw new Error("Failed to update idea");}
    const data = await res.json() as { idea: VideoIdea };
    await fetchIdeas();
    return data.idea;
  }, [channelId, fetchIdeas]);

  const deleteIdeaFn = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/me/channels/${channelId}/ideas/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {throw new Error("Failed to delete idea");}
    await fetchIdeas();
  }, [channelId, fetchIdeas]);

  return {
    ideas,
    loading,
    error,
    createIdea: createIdeaFn,
    updateIdea: updateIdeaFn as UseVideoIdeasReturn["updateIdea"],
    deleteIdea: deleteIdeaFn,
    refetch: fetchIdeas,
  };
}
