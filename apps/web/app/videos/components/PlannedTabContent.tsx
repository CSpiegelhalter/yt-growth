"use client";

import type { VideoIdea } from "@/lib/features/video-ideas/types";

import { IdeaEditorPanel } from "./IdeaEditorPanel";
import { PlannedIdeasList } from "./PlannedIdeasList";

type PlannedTabContentProps = {
  channelId: string;
  ideas: VideoIdea[];
  ideasLoading: boolean;
  selectedIdeaId: string | null;
  isNewIdea: boolean;
  selectedIdea: VideoIdea | null;
  saving: boolean;
  hasSelection: boolean;
  ideasError?: string | null;
  onRetry?: () => void;
  onNewIdea: () => void;
  onSelectIdea: (id: string) => void;
  onSave: (data: {
    summary: string;
    title?: string;
    script?: string;
    description?: string;
    tags?: string[];
    postDate?: string;
  }) => Promise<void>;
  onDiscard: () => void;
};

export function PlannedLeftContent({
  ideas,
  selectedIdeaId,
  isNewIdea,
  onSelectIdea,
  onNewIdea,
  ideasLoading,
  ideasError,
  onRetry,
}: Pick<PlannedTabContentProps, "ideas" | "selectedIdeaId" | "isNewIdea" | "onSelectIdea" | "onNewIdea" | "ideasLoading" | "ideasError" | "onRetry">) {
  return (
    <PlannedIdeasList
      ideas={ideas}
      selectedIdeaId={selectedIdeaId}
      isNewIdeaSelected={isNewIdea}
      onSelectIdea={onSelectIdea}
      onNewIdea={onNewIdea}
      loading={ideasLoading}
      error={ideasError}
      onRetry={onRetry}
    />
  );
}

export function PlannedRightContent({
  channelId,
  isNewIdea,
  selectedIdea,
  hasSelection,
  saving,
  onSave,
  onDiscard,
}: Pick<PlannedTabContentProps, "channelId" | "isNewIdea" | "selectedIdea" | "hasSelection" | "saving" | "onSave" | "onDiscard">) {
  if (!hasSelection) {return null;}
  return (
    <IdeaEditorPanel
      channelId={channelId}
      idea={isNewIdea ? null : selectedIdea}
      onSave={onSave}
      onDiscard={onDiscard}
      saving={saving}
    />
  );
}
