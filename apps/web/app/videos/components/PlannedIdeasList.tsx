"use client";

import { ErrorBanner, Skeleton } from "@/components/ui";
import type { VideoIdea } from "@/lib/features/video-ideas/types";

import { IdeaListItem } from "./IdeaListItem";
import { NewIdeaCard } from "./NewIdeaCard";
import s from "./planned-ideas-list.module.css";

type PlannedIdeasListProps = {
  ideas: VideoIdea[];
  selectedIdeaId: string | null;
  isNewIdeaSelected: boolean;
  onSelectIdea: (id: string) => void;
  onNewIdea: () => void;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function PlannedIdeasList({
  ideas,
  selectedIdeaId,
  isNewIdeaSelected,
  onSelectIdea,
  onNewIdea,
  loading,
  error,
  onRetry,
}: PlannedIdeasListProps) {
  return (
    <div className={s.listContainer}>
      <NewIdeaCard
        selected={isNewIdeaSelected}
        onClick={onNewIdea}
      />

      {error ? (
        <ErrorBanner message={error} onRetry={onRetry} />
      ) : loading ? (
        <>
          <Skeleton height="72px" />
          <Skeleton height="72px" />
          <Skeleton height="72px" />
        </>
      ) : ideas.length === 0 ? (
        <div className={s.emptyState}>
          No ideas yet. Start planning your next video!
        </div>
      ) : (
        ideas.map((idea) => (
          <IdeaListItem
            key={idea.id}
            idea={idea}
            selected={idea.id === selectedIdeaId}
            onClick={() => onSelectIdea(idea.id)}
          />
        ))
      )}
    </div>
  );
}
