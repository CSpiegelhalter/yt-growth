"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import s from "./style.module.css";
import type { IdeaBoardData, Idea } from "@/types/api";
import { copyToClipboard } from "@/components/ui/Toast";
import { IdeaCard } from "./IdeaCard";
import { NicheInsightsBar } from "./NicheInsightsBar";
import { IdeaDetailSheet } from "./IdeaDetailSheet";
import { formatRelativeTime } from "./helpers";
import { SUBSCRIPTION, formatUsd } from "@/lib/product";

type Props = {
  data: IdeaBoardData | null;
  channelId?: string;
  channelName?: string;
  loading?: boolean;
  isSubscribed?: boolean;
  onGenerate?: (options?: {
    mode?: "default" | "more";
    range?: "7d" | "28d";
  }) => Promise<void>;
  onRefresh?: (range: "7d" | "28d") => void;
};

/**
 * IdeaBoard - Premium Idea Engine experience
 * Vertical feed with scrollable detail sheets
 */
export default function IdeaBoard({
  data,
  channelId,
  channelName,
  loading = false,
  isSubscribed = true,
  onGenerate,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIdeas, setSavedIdeas] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Load saved idea IDs from API on mount
  useEffect(() => {
    const loadSavedIds = async () => {
      try {
        const res = await fetch("/api/me/saved-ideas");
        if (res.ok) {
          const data = await res.json();
          const ids = new Set<string>(
            (data.savedIdeas || []).map((s: { ideaId: string }) => s.ideaId)
          );
          setSavedIdeas(ids);
        }
      } catch (err) {
        console.error("Failed to load saved ideas:", err);
      }
    };
    loadSavedIds();
  }, []);

  const showSaveToast = (message: string) => {
    setSaveToast(message);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleCopy = useCallback(async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!onGenerate) return;
    setGenerating(true);
    try {
      await onGenerate({ mode: "default", range: "7d" });
    } finally {
      setGenerating(false);
    }
  }, [onGenerate]);

  const handleGenerateMore = useCallback(async () => {
    if (!onGenerate) return;
    setGeneratingMore(true);
    try {
      await onGenerate({ mode: "more", range: "7d" });
    } finally {
      setGeneratingMore(false);
    }
  }, [onGenerate]);

  // Check if ideas are from a previous day (need refresh)
  const needsDailyRefresh = useMemo(() => {
    if (!data?.generatedAt) return false;
    const generatedDate = new Date(data.generatedAt);
    const today = new Date();
    return (
      generatedDate.getFullYear() !== today.getFullYear() ||
      generatedDate.getMonth() !== today.getMonth() ||
      generatedDate.getDate() !== today.getDate()
    );
  }, [data?.generatedAt]);

  // Save/unsave idea using API
  const toggleSaveIdea = useCallback(
    async (idea: Idea) => {
      const ideaId = idea.id;
      const isSaved = savedIdeas.has(ideaId);
      setSavingId(ideaId);

      try {
        if (isSaved) {
          // Unsave
          const res = await fetch(`/api/me/saved-ideas/${ideaId}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to unsave");
          setSavedIdeas((prev) => {
            const next = new Set(prev);
            next.delete(ideaId);
            return next;
          });
          showSaveToast("Idea removed from saved");
        } else {
          // Save
          const res = await fetch("/api/me/saved-ideas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ideaId: idea.id,
              channelId: channelId ?? undefined,
              title: idea.title || "Untitled Idea",
              angle: idea.angle || null,
              format: idea.format || "long",
              difficulty: idea.difficulty || "medium",
              ideaJson: idea,
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            if (res.status === 409) {
              // Already saved
              setSavedIdeas((prev) => new Set([...prev, ideaId]));
              showSaveToast("Idea already saved");
              return;
            }
            throw new Error(data.error || "Failed to save");
          }
          setSavedIdeas((prev) => new Set([...prev, ideaId]));
          showSaveToast("Idea saved! View in Saved Ideas →");
        }
      } catch (err) {
        console.error("Failed to toggle save:", err);
        showSaveToast("Failed to save idea");
      } finally {
        setSavingId(null);
      }
    },
    [savedIdeas, channelId]
  );

  const ideas = data?.ideas ?? [];

  const selectedIdea = useMemo(() => {
    if (!selectedIdeaId || !data?.ideas) return null;
    return data.ideas.find((i) => i.id === selectedIdeaId) ?? null;
  }, [selectedIdeaId, data?.ideas]);

  // Loading skeleton
  if (loading) {
    return (
      <div className={s.board}>
        <div className={s.skeletonHeader} />
        <div className={s.skeletonFeed}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={s.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  // Subscription gate
  if (!isSubscribed) {
    return (
      <div className={s.board}>
        <div className={s.lockedState}>
          <div className={s.lockedIcon} aria-hidden="true">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className={s.lockedTitle}>Unlock the Idea Board</h2>
          <p className={s.lockedDesc}>
            Get video ideas backed by real data from similar channels. See
            what's working in your niche and get actionable hooks, titles, and
            thumbnails.
          </p>
          <a href="/api/integrations/stripe/checkout" className={s.btnPrimary}>
            Subscribe to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/{SUBSCRIPTION.PRO_INTERVAL}
          </a>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.ideas.length === 0) {
    return (
      <div className={s.board}>
        <div className={s.emptyState}>
          <div className={s.emptyIcon} aria-hidden="true">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className={s.emptyTitle}>Ready to spark your next hit?</h2>
          <p className={s.emptyDesc}>
            We analyze what's working in your niche right now and generate
            unique video ideas with hooks, titles, and scripts tailored for you.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={s.btnPrimary}
          >
            {generating ? (
              <>
                <span className={s.spinner} />
                Brewing ideas...
              </>
            ) : (
              "Generate Today's Ideas"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.board}>
      {/* Header */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <h1 className={s.title}>Idea Engine</h1>
          {channelName && <span className={s.channelName}>{channelName}</span>}
          {data.demo && <span className={s.demoBadge}>Demo Data</span>}
        </div>
        {needsDailyRefresh && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={s.refreshBtn}
          >
            {generating ? (
              <>
                <span className={s.spinnerSmall} />
                Refreshing...
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New day, fresh ideas
              </>
            )}
          </button>
        )}
      </header>

      {/* Niche Insights */}
      {data.nicheInsights && <NicheInsightsBar insights={data.nicheInsights} />}

      {/* Grid Idea Feed */}
      <div className={s.ideaFeed}>
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            isSaved={savedIdeas.has(idea.id)}
            isSaving={savingId === idea.id}
            onSelect={() => setSelectedIdeaId(idea.id)}
            onSave={() => toggleSaveIdea(idea)}
            onCopyHook={(text) => handleCopy(text, `hook-${idea.id}`)}
            copiedId={copiedId}
          />
        ))}

        {/* Bottom Load More */}
        <div className={s.feedBottom}>
          <button
            onClick={handleGenerateMore}
            disabled={generatingMore}
            className={s.loadMoreFeed}
          >
            {generatingMore ? (
              <>
                <span className={s.spinner} />
                Generating...
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Load More Ideas
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className={s.footer}>
        <span className={s.footerMeta}>
          {ideas.length} ideas generated {formatRelativeTime(data.generatedAt)}
        </span>
        {savedIdeas.size > 0 && (
          <Link href="/saved-ideas" className={s.savedIdeasLink}>
            View {savedIdeas.size} saved idea{savedIdeas.size !== 1 ? "s" : ""}{" "}
            →
          </Link>
        )}
      </footer>

      {/* Save Toast */}
      {saveToast && <div className={s.saveToast}>{saveToast}</div>}

      {/* Detail Sheet */}
      {selectedIdea && (
        <IdeaDetailSheet
          idea={selectedIdea}
          onCopy={handleCopy}
          copiedId={copiedId}
          onClose={() => setSelectedIdeaId(null)}
          channelId={channelId}
        />
      )}
    </div>
  );
}

// Re-export IdeaDetailSheet for external use (e.g., Saved Ideas page)
export { IdeaDetailSheet } from "./IdeaDetailSheet";
