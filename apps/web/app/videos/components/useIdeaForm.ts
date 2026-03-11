"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { VideoIdea } from "@/lib/features/video-ideas/types";

type IdeaFormData = {
  summary: string;
  title?: string;
  script?: string;
  description?: string;
  tags?: string[];
  postDate?: string;
};

type SuggestState = {
  loading: boolean;
  error: string | null;
};

export function useIdeaForm(idea: VideoIdea | null, channelId: string) {
  const [summary, setSummary] = useState(idea?.summary ?? "");
  const [title, setTitle] = useState(idea?.title ?? "");
  const [script, setScript] = useState(idea?.script ?? "");
  const [description, setDescription] = useState(idea?.description ?? "");
  const [tagsStr, setTagsStr] = useState(idea?.tags?.join(", ") ?? "");
  const [postDate, setPostDate] = useState(idea?.postDate ?? "");

  const [suggestStates, setSuggestStates] = useState<Record<string, SuggestState>>({});

  // Reset form fields when the selected idea changes
  const prevIdeaId = useRef(idea?.id);
  useEffect(() => {
    if (idea?.id !== prevIdeaId.current) {
      prevIdeaId.current = idea?.id;
      setSummary(idea?.summary ?? "");
      setTitle(idea?.title ?? "");
      setScript(idea?.script ?? "");
      setDescription(idea?.description ?? "");
      setTagsStr(idea?.tags?.join(", ") ?? "");
      setPostDate(idea?.postDate ?? "");
      setSuggestStates({});
    }
  }, [idea]);

  const canSave = summary.trim().length > 0;

  function toFormData(): IdeaFormData {
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      summary: summary.trim(),
      title: title.trim() || undefined,
      script: script.trim() || undefined,
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      postDate: postDate || undefined,
    };
  }

  const suggestField = useCallback(async (field: string) => {
    setSuggestStates((prev) => ({ ...prev, [field]: { loading: true, error: null } }));
    try {
      const currentIdea = {
        summary: summary || undefined,
        title: title || undefined,
        script: script || undefined,
        description: description || undefined,
        tags: tagsStr.split(",").map((t) => t.trim()).filter(Boolean),
        postDate: postDate || undefined,
      };

      const res = await fetch(`/api/me/channels/${channelId}/ideas/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, currentIdea }),
      });

      if (!res.ok) {throw new Error("Failed to generate suggestion");}

      const data = await res.json() as { value: string };

      const setters: Record<string, (v: string) => void> = {
        title: setTitle,
        script: setScript,
        description: setDescription,
        tags: setTagsStr,
        postDate: setPostDate,
      };
      setters[field]?.(data.value);
      setSuggestStates((prev) => ({ ...prev, [field]: { loading: false, error: null } }));
    } catch (error_) {
      setSuggestStates((prev) => ({
        ...prev,
        [field]: { loading: false, error: error_ instanceof Error ? error_.message : "Failed" },
      }));
    }
  }, [channelId, summary, title, script, description, tagsStr, postDate]);

  function getSuggestState(field: string): SuggestState {
    return suggestStates[field] ?? { loading: false, error: null };
  }

  return {
    summary, setSummary,
    title, setTitle,
    script, setScript,
    description, setDescription,
    tagsStr, setTagsStr,
    postDate, setPostDate,
    canSave,
    toFormData,
    suggestField,
    getSuggestState,
  };
}
