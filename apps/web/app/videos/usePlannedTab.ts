"use client";

import { useCallback, useState } from "react";

import type { VideoIdea } from "@/lib/features/video-ideas/types";

import { useVideoIdeas } from "./useVideoIdeas";

type SaveIdeaData = {
  summary: string;
  title?: string;
  script?: string;
  description?: string;
  tags?: string[];
  postDate?: string;
};

export function usePlannedTab(channelId: string | null) {
  const { ideas, loading: ideasLoading, error: ideasError, createIdea, updateIdea, refetch } = useVideoIdeas(channelId);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [isNewIdea, setIsNewIdea] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedIdea: VideoIdea | null = selectedIdeaId
    ? ideas.find((i) => i.id === selectedIdeaId) ?? null
    : null;

  function handleNewIdea() {
    setSelectedIdeaId(null);
    setIsNewIdea(true);
  }

  function handleSelectIdea(id: string) {
    setSelectedIdeaId(id);
    setIsNewIdea(false);
  }

  function handleDiscard() {
    setSelectedIdeaId(null);
    setIsNewIdea(false);
  }

  const handleSave = useCallback(async (data: SaveIdeaData) => {
    setSaving(true);
    try {
      if (isNewIdea) {
        const created = await createIdea(data);
        setIsNewIdea(false);
        setSelectedIdeaId(created.id);
      } else if (selectedIdeaId) {
        await updateIdea(selectedIdeaId, data);
      }
    } finally {
      setSaving(false);
    }
  }, [isNewIdea, selectedIdeaId, createIdea, updateIdea]);

  return {
    ideas,
    ideasLoading,
    ideasError,
    refetchIdeas: refetch,
    selectedIdeaId,
    isNewIdea,
    selectedIdea,
    saving,
    handleNewIdea,
    handleSelectIdea,
    handleDiscard,
    handleSave,
    hasSelection: isNewIdea || selectedIdeaId !== null,
  };
}
