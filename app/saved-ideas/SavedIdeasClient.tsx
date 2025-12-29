"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import s from "./style.module.css";
import type { Idea } from "@/types/api";

type Status = "saved" | "in_progress" | "filmed" | "published";

type SavedIdea = {
  id: string;
  ideaId: string;
  title: string;
  angle: string | null;
  format: string;
  difficulty: string;
  ideaJson: Idea;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABELS: Record<Status, string> = {
  saved: "Saved",
  in_progress: "In Progress",
  filmed: "Filmed",
  published: "Published",
};

const FILTER_TABS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "All Ideas" },
  { key: "saved", label: "Saved" },
  { key: "in_progress", label: "In Progress" },
  { key: "filmed", label: "Filmed" },
  { key: "published", label: "Published" },
];

export default function SavedIdeasClient() {
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [toast, setToast] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<SavedIdea | null>(null);

  // Fetch saved ideas
  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch("/api/me/saved-ideas");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setIdeas(data.savedIdeas || []);
    } catch (err) {
      console.error("Failed to fetch saved ideas:", err);
      showToast("Failed to load saved ideas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Update idea status
  const updateStatus = useCallback(async (ideaId: string, status: Status) => {
    try {
      const res = await fetch(`/api/me/saved-ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");

      setIdeas((prev) =>
        prev.map((idea) =>
          idea.ideaId === ideaId ? { ...idea, status } : idea
        )
      );
      showToast(`Status updated to "${STATUS_LABELS[status]}"`);
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast("Failed to update status");
    }
  }, []);

  // Update idea notes
  const updateNotes = useCallback(async (ideaId: string, notes: string) => {
    try {
      const res = await fetch(`/api/me/saved-ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to update");

      setIdeas((prev) =>
        prev.map((idea) =>
          idea.ideaId === ideaId ? { ...idea, notes } : idea
        )
      );
      setEditingNotes(null);
      showToast("Notes saved");
    } catch (err) {
      console.error("Failed to update notes:", err);
      showToast("Failed to save notes");
    }
  }, []);

  // Delete saved idea
  const deleteIdea = useCallback(async (ideaId: string) => {
    if (!confirm("Remove this idea from your saved list?")) return;

    try {
      const res = await fetch(`/api/me/saved-ideas/${ideaId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      setIdeas((prev) => prev.filter((idea) => idea.ideaId !== ideaId));
      showToast("Idea removed");
    } catch (err) {
      console.error("Failed to delete idea:", err);
      showToast("Failed to remove idea");
    }
  }, []);

  // Filtered ideas
  const filteredIdeas = useMemo(() => {
    if (filter === "all") return ideas;
    return ideas.filter((idea) => idea.status === filter);
  }, [ideas, filter]);

  // Count by status
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ideas.length };
    ideas.forEach((idea) => {
      c[idea.status] = (c[idea.status] || 0) + 1;
    });
    return c;
  }, [ideas]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className={s.container}>
        <div className={s.inner}>
          <div className={s.loadingContainer}>
            <div className={s.spinner} />
            <p className={s.loadingText}>Loading your saved ideas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={s.inner}>
        {/* Header */}
        <header className={s.header}>
          <div className={s.headerTop}>
            <div>
              <div className={s.titleRow}>
                <div className={s.headerIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h1 className={s.title}>Saved Ideas</h1>
              </div>
              <p className={s.subtitle}>
                Your collection of video ideas. Track progress from saved to published.
              </p>
            </div>
            <Link href="/ideas" className={s.backLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Ideas
            </Link>
          </div>
        </header>

        {/* Filter Tabs */}
        <div className={s.filters}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${s.filterBtn} ${filter === tab.key ? s.active : ""}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={s.filterCount}>{counts[tab.key]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Ideas List */}
        {filteredIdeas.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className={s.emptyTitle}>
              {filter === "all" ? "No saved ideas yet" : `No ${STATUS_LABELS[filter as Status].toLowerCase()} ideas`}
            </h2>
            <p className={s.emptyDesc}>
              {filter === "all"
                ? "Save ideas from the Idea Engine to build your video backlog. Click the bookmark icon on any idea to save it here."
                : `Move ideas to "${STATUS_LABELS[filter as Status]}" status to see them here.`}
            </p>
            {filter === "all" && (
              <Link href="/ideas" className={s.emptyBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Go to Idea Engine
              </Link>
            )}
          </div>
        ) : (
          <div className={s.ideasGrid}>
            {filteredIdeas.map((idea) => (
              <article key={idea.id} className={s.ideaCard}>
                <div className={s.ideaCardMain}>
                  <div className={s.ideaCardHeader}>
                    <h2 className={s.ideaTitle}>{idea.title}</h2>
                    <div className={s.ideaBadges}>
                      <span className={`${s.difficultyBadge} ${s[idea.difficulty]}`}>
                        {idea.difficulty}
                      </span>
                      <span className={`${s.formatBadge} ${s[idea.format]}`}>
                        {idea.format === "shorts" ? "Shorts" : "Long-form"}
                      </span>
                    </div>
                  </div>

                  {idea.angle && (
                    <p className={s.ideaAngle}>{idea.angle}</p>
                  )}

                  <div className={s.ideaMeta}>
                    <span className={s.ideaMetaItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      Saved {formatDate(idea.createdAt)}
                    </span>
                    <span className={`${s.statusBadge} ${s[idea.status.replace("-", "_")]}`}>
                      {STATUS_LABELS[idea.status as Status] || idea.status}
                    </span>
                  </div>

                  {/* Notes Section */}
                  <div className={s.notesSection}>
                    <div className={s.notesLabel}>Notes</div>
                    {editingNotes === idea.ideaId ? (
                      <div>
                        <textarea
                          className={s.notesInput}
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Add your notes about this idea..."
                          autoFocus
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            className={s.actionBtnPrimary}
                            onClick={() => updateNotes(idea.ideaId, notesValue)}
                          >
                            Save
                          </button>
                          <button
                            className={s.actionBtn}
                            onClick={() => setEditingNotes(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : idea.notes ? (
                      <p
                        className={s.notesText}
                        onClick={() => {
                          setEditingNotes(idea.ideaId);
                          setNotesValue(idea.notes || "");
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {idea.notes}
                      </p>
                    ) : (
                      <button
                        className={s.actionBtn}
                        onClick={() => {
                          setEditingNotes(idea.ideaId);
                          setNotesValue("");
                        }}
                      >
                        + Add notes
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className={s.ideaActions}>
                  <select
                    className={s.statusSelect}
                    value={idea.status}
                    onChange={(e) => updateStatus(idea.ideaId, e.target.value as Status)}
                  >
                    <option value="saved">📌 Saved</option>
                    <option value="in_progress">🎬 In Progress</option>
                    <option value="filmed">🎥 Filmed</option>
                    <option value="published">✅ Published</option>
                  </select>

                  <button
                    className={s.actionBtn}
                    onClick={() => setSelectedIdea(idea)}
                  >
                    View Details
                  </button>

                  <div className={s.spacer} />

                  <button
                    className={`${s.actionBtn} ${s.danger}`}
                    onClick={() => deleteIdea(idea.ideaId)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Detail Sheet */}
        {selectedIdea && (
          <div className={s.sheetOverlay} onClick={() => setSelectedIdea(null)}>
            <div className={s.sheetPanel} onClick={(e) => e.stopPropagation()}>
              <div className={s.sheetHandle} />
              <div className={s.sheetHeader}>
                <button
                  className={s.sheetClose}
                  onClick={() => setSelectedIdea(null)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
                <h2 className={s.sheetTitle}>{selectedIdea.title}</h2>
              </div>

              <div className={s.sheetContent}>
                {selectedIdea.angle && (
                  <div className={s.sheetSection}>
                    <h3 className={s.sectionTitle}>Angle</h3>
                    <p style={{ color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                      {selectedIdea.angle}
                    </p>
                  </div>
                )}

                {selectedIdea.ideaJson.whyNow && (
                  <div className={s.sheetSection}>
                    <h3 className={s.sectionTitle}>Why Now</h3>
                    <p style={{ color: "#059669", background: "#ecfdf5", padding: 12, borderRadius: 8, margin: 0, lineHeight: 1.5 }}>
                      {selectedIdea.ideaJson.whyNow}
                    </p>
                  </div>
                )}

                {selectedIdea.ideaJson.hooks && selectedIdea.ideaJson.hooks.length > 0 && (
                  <div className={s.sheetSection}>
                    <h3 className={s.sectionTitle}>Hooks</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {selectedIdea.ideaJson.hooks.map((hook, i) => (
                        <div
                          key={i}
                          style={{
                            background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
                            border: "1px solid #fde68a",
                            borderRadius: 12,
                            padding: 16,
                          }}
                        >
                          <p style={{ color: "#854d0e", margin: 0, fontWeight: 500 }}>
                            {hook.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedIdea.ideaJson.titles && selectedIdea.ideaJson.titles.length > 0 && (
                  <div className={s.sheetSection}>
                    <h3 className={s.sectionTitle}>Title Options</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selectedIdea.ideaJson.titles.map((title, i) => (
                        <div
                          key={i}
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          <p style={{ color: "#1e293b", margin: 0, fontWeight: 600 }}>
                            {title.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedIdea.ideaJson.scriptOutline && (
                  <div className={s.sheetSection}>
                    <h3 className={s.sectionTitle}>Script Outline</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {selectedIdea.ideaJson.scriptOutline.hook && (
                        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: 4 }}>
                            🎣 Hook
                          </div>
                          <p style={{ color: "#475569", margin: 0, lineHeight: 1.5 }}>
                            {selectedIdea.ideaJson.scriptOutline.hook}
                          </p>
                        </div>
                      )}
                      {selectedIdea.ideaJson.scriptOutline.setup && (
                        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: 4 }}>
                            📋 Setup
                          </div>
                          <p style={{ color: "#475569", margin: 0, lineHeight: 1.5 }}>
                            {selectedIdea.ideaJson.scriptOutline.setup}
                          </p>
                        </div>
                      )}
                      {selectedIdea.ideaJson.scriptOutline.mainPoints && (
                        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: 8 }}>
                            📝 Main Points
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {selectedIdea.ideaJson.scriptOutline.mainPoints.map((pt, i) => (
                              <li key={i} style={{ color: "#475569", marginBottom: 6, lineHeight: 1.5 }}>
                                {pt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedIdea.ideaJson.scriptOutline.payoff && (
                        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: 4 }}>
                            💡 Payoff
                          </div>
                          <p style={{ color: "#475569", margin: 0, lineHeight: 1.5 }}>
                            {selectedIdea.ideaJson.scriptOutline.payoff}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={s.sheetFooter}>
                <button
                  className={s.actionBtnPrimary}
                  onClick={() => setSelectedIdea(null)}
                  style={{ flex: 1 }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && <div className={s.toast}>{toast}</div>}
      </div>
    </div>
  );
}

