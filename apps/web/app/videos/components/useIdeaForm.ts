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

export function useIdeaForm(idea: VideoIdea | null, channelId: string, onAutoSave?: (data: IdeaFormData) => Promise<void>) {
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
    if (idea?.id === prevIdeaId.current) {return;}
    prevIdeaId.current = idea?.id;
    resetFields(idea, setSummary, setTitle, setScript, setDescription, setTagsStr, setPostDate);
    setSuggestStates({});
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
    const fieldSetters: Record<string, (v: string) => void> = {
      title: setTitle,
      script: setScript,
      description: setDescription,
      tags: setTagsStr,
      postDate: setPostDate,
    };

    setSuggestStates((prev) => ({ ...prev, [field]: { loading: true, error: null } }));
    try {
      const data = await fetchSuggestion(channelId, field, {
        summary, title, script, description, tagsStr, postDate,
      });
      fieldSetters[field]?.(data.value);
      setSuggestStates((prev) => ({ ...prev, [field]: { loading: false, error: null } }));

      // Auto-save with the new value merged in
      if (onAutoSave) {
        const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
        const updatedData: IdeaFormData = {
          summary: summary.trim(),
          title: (field === "title" ? data.value : title).trim() || undefined,
          script: (field === "script" ? data.value : script).trim() || undefined,
          description: (field === "description" ? data.value : description).trim() || undefined,
          tags: field === "tags" ? data.value.split(",").map((t: string) => t.trim()).filter(Boolean) : (tags.length > 0 ? tags : undefined),
          postDate: (field === "postDate" ? data.value : postDate) || undefined,
        };
        await onAutoSave(updatedData).catch(() => { /* silent — field is already set locally */ });
      }
    } catch (error_) {
      setSuggestStates((prev) => ({
        ...prev,
        [field]: { loading: false, error: error_ instanceof Error ? error_.message : "Failed" },
      }));
    }
  }, [channelId, summary, title, script, description, tagsStr, postDate, onAutoSave]);

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

function resetFields(
  idea: VideoIdea | null,
  setSummary: (v: string) => void,
  setTitle: (v: string) => void,
  setScript: (v: string) => void,
  setDescription: (v: string) => void,
  setTagsStr: (v: string) => void,
  setPostDate: (v: string) => void,
): void {
  setSummary(idea?.summary ?? "");
  setTitle(idea?.title ?? "");
  setScript(idea?.script ?? "");
  setDescription(idea?.description ?? "");
  setTagsStr(idea?.tags?.join(", ") ?? "");
  setPostDate(idea?.postDate ?? "");
}

type FormFields = {
  summary: string;
  title: string;
  script: string;
  description: string;
  tagsStr: string;
  postDate: string;
};

async function fetchSuggestion(
  channelId: string,
  field: string,
  fields: FormFields,
): Promise<{ value: string }> {
  const currentIdea = {
    summary: fields.summary || undefined,
    title: fields.title || undefined,
    script: fields.script || undefined,
    description: fields.description || undefined,
    tags: fields.tagsStr.split(",").map((t) => t.trim()).filter(Boolean),
    postDate: fields.postDate || undefined,
  };

  const res = await fetch(`/api/me/channels/${channelId}/ideas/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field, currentIdea }),
  });

  if (!res.ok) {throw new Error("Failed to generate suggestion");}

  return res.json() as Promise<{ value: string }>;
}
