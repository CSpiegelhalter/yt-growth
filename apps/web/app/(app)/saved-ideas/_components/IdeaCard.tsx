"use client";

import type { SavedIdea, Status } from "../saved-ideas-types";
import { formatDate } from "../saved-ideas-types";
import s from "../style.module.css";
import { NotesEditor } from "./NotesEditor";

type IdeaCardProps = {
  idea: SavedIdea;
  editingNotes: string | null;
  notesValue: string;
  onNotesChange: (v: string) => void;
  onEditNotes: (ideaId: string, currentNotes: string) => void;
  onCancelEditNotes: () => void;
  onSaveNotes: (ideaId: string, notes: string) => void;
  onSelectIdea: (idea: SavedIdea) => void;
  onUpdateStatus: (ideaId: string, status: Status) => void;
  onDelete: (ideaId: string) => void;
};

export function IdeaCard({
  idea,
  editingNotes,
  notesValue,
  onNotesChange,
  onEditNotes,
  onCancelEditNotes,
  onSaveNotes,
  onSelectIdea,
  onUpdateStatus,
  onDelete,
}: IdeaCardProps) {
  return (
    <article className={s.ideaCard}>
      <div
        className={s.ideaCardMain}
        role="button"
        tabIndex={0}
        onClick={() => onSelectIdea(idea)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { onSelectIdea(idea); }
        }}
      >
        <div className={s.ideaCardHeader}>
          <h2 className={s.ideaTitle}>{idea.title}</h2>
        </div>

        {idea.angle && <p className={s.ideaAngle}>{idea.angle}</p>}

        <div className={s.ideaMeta}>
          <span className={s.ideaMetaItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            Saved {formatDate(idea.createdAt)}
          </span>
        </div>

        <div
          className={s.notesSection}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <div className={s.notesLabel}>Notes</div>
          {editingNotes === idea.ideaId ? (
            <NotesEditor
              notesValue={notesValue}
              onNotesChange={onNotesChange}
              onSave={() => onSaveNotes(idea.ideaId, notesValue)}
              onCancel={onCancelEditNotes}
            />
          ) : idea.notes ? (
            <button
              type="button"
              className={`${s.notesText} ${s.notesTextBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                onEditNotes(idea.ideaId, idea.notes || "");
              }}
            >
              {idea.notes}
            </button>
          ) : (
            <button
              className={s.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                onEditNotes(idea.ideaId, "");
              }}
            >
              + Add notes
            </button>
          )}
        </div>
      </div>

      <div className={s.ideaActions}>
        <select
          className={s.statusSelect}
          value={idea.status}
          onChange={(e) => onUpdateStatus(idea.ideaId, e.target.value as Status)}
        >
          <option value="saved">Saved</option>
          <option value="in_progress">In Progress</option>
          <option value="filmed">Filmed</option>
          <option value="published">Published</option>
        </select>

        <button
          className={`${s.actionBtn} ${s.danger}`}
          onClick={() => onDelete(idea.ideaId)}
          aria-label="Remove saved idea"
          title="Remove"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </div>
    </article>
  );
}
