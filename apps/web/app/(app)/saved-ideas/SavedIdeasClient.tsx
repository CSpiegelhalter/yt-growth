"use client";

import { IdeaDetailSheet } from "@/components/dashboard/IdeaBoard";
import { PageContainer } from "@/components/ui";

import { EmptyState } from "./_components/EmptyState";
import { IdeaCard } from "./_components/IdeaCard";
import { IdeaFilters } from "./_components/IdeaFilters";
import { SavedIdeasHeader } from "./_components/SavedIdeasHeader";
import { useSavedIdeas } from "./_components/use-saved-ideas";
import s from "./style.module.css";

export function SavedIdeasClient() {
  const {
    loading,
    filter,
    setFilter,
    toast,
    editingNotes,
    setEditingNotes,
    notesValue,
    setNotesValue,
    selectedIdea,
    setSelectedIdea,
    copiedId,
    handleCopy,
    persistGeneratedDetails,
    updateStatus,
    updateNotes,
    deleteIdea,
    filteredIdeas,
    counts,
  } = useSavedIdeas();

  if (loading) {
    return (
      <PageContainer>
        <div className={s.loadingContainer}>
          <div className={s.spinner} />
          <p className={s.loadingText}>Loading your saved ideas...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SavedIdeasHeader />

      <IdeaFilters filter={filter} onFilterChange={setFilter} counts={counts} />

      {filteredIdeas.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className={s.ideasGrid}>
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              editingNotes={editingNotes}
              notesValue={notesValue}
              onNotesChange={setNotesValue}
              onEditNotes={(ideaId, currentNotes) => {
                setEditingNotes(ideaId);
                setNotesValue(currentNotes);
              }}
              onCancelEditNotes={() => setEditingNotes(null)}
              onSaveNotes={updateNotes}
              onSelectIdea={setSelectedIdea}
              onUpdateStatus={updateStatus}
              onDelete={deleteIdea}
            />
          ))}
        </div>
      )}

      {selectedIdea && (
        <IdeaDetailSheet
          idea={selectedIdea.ideaJson}
          onCopy={handleCopy}
          copiedId={copiedId}
          onClose={() => setSelectedIdea(null)}
          channelId={selectedIdea.youtubeChannelId ?? undefined}
          onDetailsGenerated={(payload) =>
            persistGeneratedDetails(selectedIdea.ideaId, payload)
          }
        />
      )}

      {toast && <div className={s.toast}>{toast}</div>}
    </PageContainer>
  );
}
