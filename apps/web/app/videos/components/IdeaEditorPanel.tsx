"use client";

import type { VideoIdea } from "@/lib/features/video-ideas/types";

import { AiHelpBanner } from "./AiHelpBanner";
import s from "./idea-editor-panel.module.css";
import { IdeaFormField } from "./IdeaFormField";
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
};

export function IdeaEditorPanel({
  channelId,
  idea,
  onSave,
  onDiscard,
  saving = false,
}: IdeaEditorPanelProps) {
  const form = useIdeaForm(idea, channelId);
  const isNew = !idea;

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
    </div>
  );
}
