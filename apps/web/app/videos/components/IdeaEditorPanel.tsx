"use client";

import { useState } from "react";

import { apiFetchJson } from "@/lib/client/api";
import type { SourceProvenance } from "@/lib/features/suggestions/types";
import type { VideoIdea } from "@/lib/features/video-ideas/types";

import { AiHelpBanner } from "./AiHelpBanner";
import s from "./idea-editor-panel.module.css";
import { IdeaFormField } from "./IdeaFormField";
import { IdeaSourceSection } from "./IdeaSourceSection";
import { useIdeaForm } from "./useIdeaForm";

type IdeaEditorPanelProps = {
  channelId: string;
  idea: VideoIdea | null;
  onSave: (data: {
    summary: string;
    title?: string;
    script?: string;
    description?: string;
    tags?: string[];
    postDate?: string;
  }) => Promise<void>;
  onDiscard: () => void;
  saving?: boolean;
  onPublished?: (idea: VideoIdea) => void;
};

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  // Direct ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  // YouTube URL patterns
  const urlMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return urlMatch?.[1] ?? null;
}

function MarkAsPublishedSection({
  channelId,
  idea,
  onPublished,
}: {
  channelId: string;
  idea: VideoIdea;
  onPublished?: (idea: VideoIdea) => void;
}) {
  const [videoInput, setVideoInput] = useState(idea.publishedVideoId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkPublished() {
    const videoId = extractVideoId(videoInput);
    if (!videoId) {
      setError("Enter a valid YouTube video URL or ID");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await apiFetchJson<{ idea: VideoIdea }>(
        `/api/me/channels/${channelId}/ideas/${idea.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "published",
            publishedVideoId: videoId,
          }),
        },
      );
      onPublished?.(result.idea);
    } catch {
      setError("Failed to mark as published");
    } finally {
      setSaving(false);
    }
  }

  if (idea.status === "published" && idea.publishedVideoId) {
    return (
      <div className={s.publishedSection}>
        <span className={s.publishedBadge}>Published</span>
        <a
          href={`https://youtube.com/watch?v=${idea.publishedVideoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={s.publishedLink}
        >
          View on YouTube
        </a>
      </div>
    );
  }

  return (
    <div className={s.publishSection}>
      <h4 className={s.publishTitle}>Mark as published</h4>
      <p className={s.publishHint}>
        Paste the YouTube video URL or ID of the published version.
      </p>
      <div className={s.publishRow}>
        <input
          type="text"
          className={s.publishInput}
          value={videoInput}
          onChange={(e) => setVideoInput(e.target.value)}
          placeholder="https://youtube.com/watch?v=... or video ID"
          disabled={saving}
        />
        <button
          type="button"
          className={s.publishBtn}
          onClick={handleMarkPublished}
          disabled={saving || !videoInput.trim()}
        >
          {saving ? "Saving..." : "Mark published"}
        </button>
      </div>
      {error && <p className={s.publishError}>{error}</p>}
    </div>
  );
}

export function IdeaEditorPanel({
  channelId,
  idea,
  onSave,
  onDiscard,
  saving = false,
  onPublished,
}: IdeaEditorPanelProps) {
  const isNew = !idea;
  const form = useIdeaForm(idea, channelId, isNew ? undefined : onSave);

  let parsedProvenance: SourceProvenance | null = null;
  if (idea?.sourceProvenanceJson) {
    try {
      parsedProvenance = JSON.parse(idea.sourceProvenanceJson) as SourceProvenance;
    } catch { /* malformed JSON, skip */ }
  }

  async function handleSave() {
    await onSave(form.toFormData());
  }

  return (
    <div className={s.editorPanel}>
      <div className={s.editorHeader}>
        <h2 className={s.editorTitle}>
          {isNew ? "New Video Draft" : (idea.title || idea.summary)}
        </h2>
        <button type="button" className={s.discardLink} onClick={onDiscard}>
          Discard
        </button>
      </div>

      <IdeaSourceSection provenance={parsedProvenance} />

      <AiHelpBanner />

      <IdeaFormField
        label="Quick video summary"
        value={form.summary}
        onChange={form.setSummary}
        maxLength={150}
        placeholder="What's this video about?"
      />

      <button
        type="button"
        className={s.saveBtn}
        disabled={!form.canSave || saving}
        onClick={handleSave}
      >
        {saving ? "Saving..." : "Save Idea"}
      </button>

      <IdeaFormField
        label="Video Title"
        value={form.title}
        onChange={form.setTitle}
        placeholder="Enter a catchy title"
        onSuggest={() => form.suggestField("title")}
        suggestLoading={form.getSuggestState("title").loading}
        suggestError={form.getSuggestState("title").error}
      />

      <IdeaFormField
        label="Script"
        value={form.script}
        onChange={form.setScript}
        multiline
        placeholder="Write your script or outline"
        onSuggest={() => form.suggestField("script")}
        suggestLoading={form.getSuggestState("script").loading}
        suggestError={form.getSuggestState("script").error}
      />

      <IdeaFormField
        label="Description"
        value={form.description}
        onChange={form.setDescription}
        multiline
        placeholder="SEO-optimized description"
        onSuggest={() => form.suggestField("description")}
        suggestLoading={form.getSuggestState("description").loading}
        suggestError={form.getSuggestState("description").error}
      />

      <IdeaFormField
        label="Tags"
        value={form.tagsStr}
        onChange={form.setTagsStr}
        placeholder="tag1, tag2, tag3"
        onSuggest={() => form.suggestField("tags")}
        suggestLoading={form.getSuggestState("tags").loading}
        suggestError={form.getSuggestState("tags").error}
      />

      <IdeaFormField
        label="Post date"
        value={form.postDate}
        onChange={form.setPostDate}
        placeholder="YYYY-MM-DD"
        onSuggest={() => form.suggestField("postDate")}
        suggestLoading={form.getSuggestState("postDate").loading}
        suggestError={form.getSuggestState("postDate").error}
      />

      {/* Mark as published — shown for planned ideas */}
      {idea && (idea.status === "planned" || idea.status === "published") && (
        <MarkAsPublishedSection
          channelId={channelId}
          idea={idea}
          onPublished={onPublished}
        />
      )}
    </div>
  );
}
