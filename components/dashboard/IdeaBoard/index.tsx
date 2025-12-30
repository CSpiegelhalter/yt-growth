"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import s from "./style.module.css";
import type {
  IdeaBoardData,
  Idea,
  IdeaHook,
  IdeaTitle,
  ProofVideo,
} from "@/types/api";
import { copyToClipboard } from "@/components/ui/Toast";
import { formatCompact } from "@/lib/format";

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
  onRefresh,
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
              channelId: channelId ? parseInt(channelId, 10) : undefined,
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
            Subscribe to Pro
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

/* ================================================
   IDEA CARD - Vertical Feed Card
   ================================================ */
function IdeaCard({
  idea,
  isSaved,
  isSaving,
  onSelect,
  onSave,
  onCopyHook,
  copiedId,
}: {
  idea: Idea;
  isSaved: boolean;
  isSaving?: boolean;
  onSelect: () => void;
  onSave: () => void;
  onCopyHook: (text: string) => void;
  copiedId: string | null;
}) {
  const hooksArr = Array.isArray((idea as any)?.hooks)
    ? ((idea as any).hooks as any[])
    : [];
  const topHook = hooksArr[0] as any;

  return (
    <article className={s.ideaCard}>
      {/* Card content - clickable */}
      <div className={s.ideaCardMain} onClick={onSelect}>
        <div className={s.ideaCardHeader}>
          <h3 className={s.ideaTitle}>{idea.title}</h3>
          <div className={s.ideaBadges}>
            <span className={`${s.difficultyBadge} ${s[idea.difficulty]}`}>
              {idea.difficulty}
            </span>
            <span className={`${s.formatBadge} ${s[idea.format]}`}>
              {idea.format === "shorts" ? "Shorts" : "Long"}
            </span>
          </div>
        </div>
        <p className={s.ideaAngle}>{idea.angle}</p>

        {/* Why Now - if available */}
        {idea.whyNow && (
          <p className={s.ideaWhyNow}>
            <span className={s.whyNowLabel}>Why now:</span>
            {truncate(idea.whyNow, 110)}
          </p>
        )}

        {/* Standout hook */}
        {topHook && (
          <div className={s.ideaHookPreview}>
            <span className={s.hookLabel}>Hook:</span>
            <span className={s.hookText}>
              &ldquo;{truncate(topHook.text, 80)}&rdquo;
            </span>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className={s.ideaActions}>
        <button className={s.ideaActionPrimary} onClick={onSelect}>
          Open
        </button>
        {topHook && (
          <button
            className={s.ideaActionSecondary}
            onClick={(e) => {
              e.stopPropagation();
              onCopyHook(topHook.text);
            }}
          >
            {copiedId === `hook-${idea.id}` ? "Copied" : "Copy Hook"}
          </button>
        )}
        <button
          className={`${s.ideaSaveBtn} ${isSaved ? s.saved : ""} ${
            isSaving ? s.saving : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isSaving) onSave();
          }}
          disabled={isSaving}
          title={isSaved ? "Remove from saved" : "Save idea"}
        >
          {isSaving ? (
            <span className={s.savingSpinner} />
          ) : isSaved ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          )}
        </button>
      </div>
    </article>
  );
}

/* ================================================
   DETAIL SHEET - Scrollable Bottom Sheet
   ================================================ */
function IdeaDetailSheet({
  idea,
  onCopy,
  copiedId,
  onClose,
  channelId,
}: {
  idea: Idea;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  onClose: () => void;
  channelId?: string;
}) {
  type CreativeDirections = {
    titleAngles: string[];
    hookSetups: string[];
    visualMoments: string[];
  };

  const panelRef = useRef<HTMLDivElement>(null);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [extraHooks, setExtraHooks] = useState<string[]>([]);
  const [extraTitles, setExtraTitles] = useState<string[]>([]);
  const [extraKeywords, setExtraKeywords] = useState<string[]>([]);
  const [creativeDirections, setCreativeDirections] =
    useState<CreativeDirections | null>(null);
  const [aiRemixes, setAiRemixes] = useState<
    Array<{ title: string; hook: string; angle: string }>
  >([]);

  const keywordObjs = Array.isArray((idea as any)?.keywords)
    ? ((idea as any).keywords as any[])
    : [];
  const hookObjs = Array.isArray((idea as any)?.hooks)
    ? ((idea as any).hooks as any[])
    : [];
  const titleObjs = Array.isArray((idea as any)?.titles)
    ? ((idea as any).titles as any[])
    : [];

  // Lock body scroll
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleGenerateMore = useCallback(async () => {
    if (!channelId || generatingMore) return;
    setGeneratingMore(true);
    try {
      const res = await fetch(`/api/me/channels/${channelId}/ideas/more`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed: {
            ideaId: idea.id,
            title: idea.title,
            summary: idea.angle,
            keywords: keywordObjs
              .slice(0, 5)
              .map((k) => String(k?.text ?? ""))
              .filter(Boolean),
            hooks: hookObjs
              .slice(0, 2)
              .map((h) => String(h?.text ?? ""))
              .filter(Boolean),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.hooks?.length)
          setExtraHooks((prev) => [...prev, ...data.hooks]);
        if (data.titles?.length)
          setExtraTitles((prev) => [...prev, ...data.titles]);
        if (data.keywords?.length)
          setExtraKeywords((prev) => [...prev, ...data.keywords]);

        if (data.packaging) {
          const normalizeArr = (v: unknown) =>
            Array.isArray(v)
              ? (v
                  .map((x) => String(x ?? "").trim())
                  .filter(Boolean) as string[])
              : [];

          const nextDirections: CreativeDirections = {
            titleAngles: normalizeArr(data.packaging.titleAngles),
            hookSetups: normalizeArr(data.packaging.hookSetups),
            visualMoments: normalizeArr(data.packaging.visualMoments),
          };

          setCreativeDirections((prev) => {
            if (!prev) return nextDirections;
            const uniq = (arr: string[]) => Array.from(new Set(arr));
            return {
              titleAngles: uniq([
                ...prev.titleAngles,
                ...nextDirections.titleAngles,
              ]).slice(0, 12),
              hookSetups: uniq([
                ...prev.hookSetups,
                ...nextDirections.hookSetups,
              ]).slice(0, 12),
              visualMoments: uniq([
                ...prev.visualMoments,
                ...nextDirections.visualMoments,
              ]).slice(0, 12),
            };
          });
        }

        if (Array.isArray(data.remixes) && data.remixes.length) {
          const cleaned = data.remixes
            .map((r: any) => ({
              title: String(r?.title ?? "").trim(),
              hook: String(r?.hook ?? "").trim(),
              angle: String(r?.angle ?? "").trim(),
            }))
            .filter((r: any) => r.title || r.hook || r.angle);

          setAiRemixes((prev) => {
            const key = (r: { title: string; hook: string; angle: string }) =>
              `${r.title}||${r.hook}||${r.angle}`;
            const map = new Map<
              string,
              { title: string; hook: string; angle: string }
            >();
            [...prev, ...cleaned].forEach((r) => map.set(key(r), r));
            return Array.from(map.values()).slice(0, 8);
          });
        }
      }
    } catch (err) {
      console.error("Failed to generate more:", err);
    } finally {
      setGeneratingMore(false);
    }
  }, [channelId, generatingMore, idea]);

  const allKeywords = [
    ...keywordObjs.map((k) => String(k?.text ?? "")).filter(Boolean),
    ...extraKeywords,
  ].join(", ");

  // Combine original + extra content
  const allHooks = [
    ...hookObjs.map((h) => String(h?.text ?? "")).filter(Boolean),
    ...extraHooks,
  ];
  const allTitles = [
    ...titleObjs.map((t) => String(t?.text ?? "")).filter(Boolean),
    ...extraTitles,
  ];

  return (
    <div className={s.sheetOverlay} onClick={onClose}>
      <div
        ref={panelRef}
        className={s.sheetPanel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className={s.sheetHandle} aria-hidden="true" />

        {/* Sticky header with Generate More CTA */}
        <div className={s.sheetHeader}>
          <button className={s.sheetClose} onClick={onClose} aria-label="Close">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className={s.sheetKicker}>Idea</div>
          <h2 className={s.sheetTitle}>{idea.title}</h2>
          {idea.angle && <p className={s.sheetAngle}>{idea.angle}</p>}

          {/* Generate More Like This - Primary CTA */}
          {channelId && (
            <button
              className={s.generateMoreBtn}
              onClick={handleGenerateMore}
              disabled={generatingMore}
            >
              {generatingMore ? (
                <>
                  <span className={s.spinnerSmall} />
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Generate more like this
                </>
              )}
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className={s.sheetContent}>
          {/* Idea Brief */}
          <section className={s.sheetSection}>
            <div className={s.sectionHeader}>
              <h3 className={s.sectionTitle}>Idea brief</h3>
              <button
                className={s.copyAllBtn}
                onClick={() =>
                  onCopy(`${idea.title}\n\n${idea.angle}`.trim(), "premise")
                }
              >
                {copiedId === "premise" ? "Copied" : "Copy"}
              </button>
            </div>
            <div className={s.briefGrid}>
              <div className={s.briefCard}>
                <div className={s.briefLabel}>Angle</div>
                <p className={s.briefText}>{idea.angle}</p>
              </div>
              <div className={s.briefCard}>
                <div className={s.briefLabel}>Why it should work now</div>
                <p className={s.briefText}>{idea.whyNow ? idea.whyNow : "—"}</p>
              </div>
            </div>
          </section>

          {/* Title Options */}
          <section className={s.sheetSection}>
            <div className={s.sectionHeader}>
              <h3 className={s.sectionTitle}>Title options</h3>
              <button
                className={s.copyAllBtn}
                onClick={() => onCopy(allTitles.join("\n"), "all-titles")}
              >
                {copiedId === "all-titles" ? "Copied" : "Copy all"}
              </button>
            </div>
            <p className={s.sectionIntro}>
              Choose one that matches your tone, then film the premise above.
            </p>
            <div className={s.optionList}>
              {titleObjs.map((title, i) => {
                const text = String((title as any)?.text ?? "").trim();
                const styleTags = Array.isArray((title as any)?.styleTags)
                  ? ((title as any).styleTags as any[])
                  : [];
                if (!text) return null;
                return (
                  <div key={`orig-${i}`} className={s.optionRow}>
                    <div className={s.optionIndex}>{i + 1}</div>
                    <div className={s.optionBody}>
                      <p className={s.optionText}>{text}</p>
                      {styleTags.length > 0 && (
                        <div className={s.optionMeta}>
                          {styleTags.slice(0, 3).map((tag) => (
                            <span key={String(tag)} className={s.optionTag}>
                              {String(tag)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className={s.copyIconBtn}
                      onClick={() => onCopy(text, `title-${i}`)}
                      title="Copy"
                    >
                      {copiedId === `title-${i}` ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
              {extraTitles.map((titleText, i) => {
                const text = String(titleText ?? "").trim();
                if (!text) return null;
                const idx = titleObjs.length + i + 1;
                return (
                  <div
                    key={`extra-${i}`}
                    className={`${s.optionRow} ${s.newItem}`}
                  >
                    <div className={s.optionIndex}>{idx}</div>
                    <div className={s.optionBody}>
                      <p className={s.optionText}>{text}</p>
                      <div className={s.optionMeta}>
                        <span className={s.optionTagNew}>New</span>
                      </div>
                    </div>
                    <button
                      className={s.copyIconBtn}
                      onClick={() => onCopy(text, `extra-title-${i}`)}
                      title="Copy"
                    >
                      {copiedId === `extra-title-${i}` ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Hooks */}
          <section className={s.sheetSection}>
            <div className={s.sectionHeader}>
              <h3 className={s.sectionTitle}>Hooks</h3>
              <button
                className={s.copyAllBtn}
                onClick={() => onCopy(allHooks.join("\n"), "all-hooks")}
              >
                {copiedId === "all-hooks" ? "Copied" : "Copy all"}
              </button>
            </div>
            <p className={s.sectionIntro}>
              Use one as your first line and commit to it in the first 10
              seconds.
            </p>
            <div className={s.optionList}>
              {hookObjs.map((hook, i) => {
                const text = String((hook as any)?.text ?? "").trim();
                const typeTags = Array.isArray((hook as any)?.typeTags)
                  ? ((hook as any).typeTags as any[])
                  : [];
                if (!text) return null;
                return (
                  <div key={`hook-${i}`} className={s.optionRow}>
                    <div className={s.optionIndex}>{i + 1}</div>
                    <div className={s.optionBody}>
                      <p className={s.optionText}>&ldquo;{text}&rdquo;</p>
                      {typeTags.length > 0 && (
                        <div className={s.optionMeta}>
                          {typeTags.slice(0, 2).map((tag) => (
                            <span key={String(tag)} className={s.optionTag}>
                              {String(tag)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className={s.copyIconBtn}
                      onClick={() => onCopy(text, `hook-${i}`)}
                      title="Copy"
                    >
                      {copiedId === `hook-${i}` ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
              {extraHooks.map((hookText, i) => {
                const text = String(hookText ?? "").trim();
                if (!text) return null;
                const idx = hookObjs.length + i + 1;
                return (
                  <div
                    key={`extra-hook-${i}`}
                    className={`${s.optionRow} ${s.newItem}`}
                  >
                    <div className={s.optionIndex}>{idx}</div>
                    <div className={s.optionBody}>
                      <p className={s.optionText}>&ldquo;{text}&rdquo;</p>
                      <div className={s.optionMeta}>
                        <span className={s.optionTagNew}>New</span>
                      </div>
                    </div>
                    <button
                      className={s.copyIconBtn}
                      onClick={() => onCopy(text, `extra-hook-${i}`)}
                      title="Copy"
                    >
                      {copiedId === `extra-hook-${i}` ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recommended tags */}
          <section className={s.sheetSection}>
            <div className={s.sectionHeader}>
              <h3 className={s.sectionTitle}>Recommended tags</h3>
              <button
                className={s.copyAllBtn}
                onClick={() => onCopy(allKeywords, "all-keywords")}
              >
                {copiedId === "all-keywords" ? "Copied" : "Copy all"}
              </button>
            </div>
            <p className={s.sectionIntro}>
              Add these as tags/keywords. Keep them aligned to the premise.
            </p>
            <div className={s.keywordChips}>
              {keywordObjs.map((kw, i) => {
                const text = String((kw as any)?.text ?? "").trim();
                if (!text) return null;
                const id = `kw-${i}`;
                const isCopied = copiedId === id;
                return (
                  <button
                    key={id}
                    className={`${s.keywordChip} ${
                      isCopied ? s.keywordChipCopied : ""
                    }`}
                    onClick={() => onCopy(text, id)}
                  >
                    <span className={s.keywordChipText}>{text}</span>
                    {isCopied && (
                      <span className={s.keywordChipState}>Copied</span>
                    )}
                  </button>
                );
              })}
              {extraKeywords.map((kw, i) => {
                const text = String(kw ?? "").trim();
                if (!text) return null;
                const id = `extra-kw-${i}`;
                const isCopied = copiedId === id;
                return (
                  <button
                    key={id}
                    className={`${s.keywordChip} ${s.newChip} ${
                      isCopied ? s.keywordChipCopied : ""
                    }`}
                    onClick={() => onCopy(text, id)}
                  >
                    <span className={s.keywordChipText}>{text}</span>
                    {isCopied && (
                      <span className={s.keywordChipState}>Copied</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Creative directions (from Generate More) */}
          {(creativeDirections || aiRemixes.length > 0) && (
            <section className={s.sheetSection}>
              <h3 className={s.sectionTitle}>Creative directions</h3>
              <p className={s.sectionIntro}>
                Practical ways to shape the video (generated from your idea).
              </p>

              {creativeDirections && (
                <div className={s.directionsGrid}>
                  {creativeDirections.titleAngles.length > 0 && (
                    <div className={s.directionsCard}>
                      <div className={s.directionsLabel}>Title angles</div>
                      <ul className={s.directionsList}>
                        {creativeDirections.titleAngles
                          .slice(0, 6)
                          .map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {creativeDirections.hookSetups.length > 0 && (
                    <div className={s.directionsCard}>
                      <div className={s.directionsLabel}>Openers</div>
                      <ul className={s.directionsList}>
                        {creativeDirections.hookSetups
                          .slice(0, 6)
                          .map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {creativeDirections.visualMoments.length > 0 && (
                    <div className={s.directionsCard}>
                      <div className={s.directionsLabel}>Visual moments</div>
                      <ul className={s.directionsList}>
                        {creativeDirections.visualMoments
                          .slice(0, 6)
                          .map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {aiRemixes.length > 0 && (
                <div className={s.remixList}>
                  {aiRemixes.slice(0, 4).map((r, i) => (
                    <div key={i} className={s.remixPrompt}>
                      {r.title && (
                        <div className={s.remixPromptTitle}>{r.title}</div>
                      )}
                      {r.angle && (
                        <div className={s.remixPromptAngle}>{r.angle}</div>
                      )}
                      {r.hook && (
                        <div className={s.remixPromptHook}>
                          &ldquo;{r.hook}&rdquo;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Script (optional, collapsed by default) */}
          {idea.scriptOutline && (
            <section className={s.sheetSection}>
              <details className={s.scriptDetails}>
                <summary className={s.scriptSummary}>
                  <span className={s.scriptSummaryTitle}>Script outline</span>
                  <span className={s.scriptSummaryHint}>
                    Optional structure — keep it punchy
                  </span>
                </summary>
                <div className={s.scriptGrid}>
                  {idea.scriptOutline.hook && (
                    <div className={s.scriptCard}>
                      <div className={s.scriptCardTitle}>
                        Hook <span className={s.scriptTiming}>0–10s</span>
                      </div>
                      <p className={s.scriptCardBody}>
                        {idea.scriptOutline.hook}
                      </p>
                    </div>
                  )}
                  {idea.scriptOutline.setup && (
                    <div className={s.scriptCard}>
                      <div className={s.scriptCardTitle}>
                        Setup <span className={s.scriptTiming}>10–40s</span>
                      </div>
                      <p className={s.scriptCardBody}>
                        {idea.scriptOutline.setup}
                      </p>
                    </div>
                  )}
                  {idea.scriptOutline.mainPoints &&
                    idea.scriptOutline.mainPoints.length > 0 && (
                      <div className={s.scriptCard}>
                        <div className={s.scriptCardTitle}>Main points</div>
                        <ol className={s.scriptPoints}>
                          {idea.scriptOutline.mainPoints
                            .slice(0, 6)
                            .map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                        </ol>
                      </div>
                    )}
                  {idea.scriptOutline.payoff && (
                    <div className={s.scriptCard}>
                      <div className={s.scriptCardTitle}>Payoff</div>
                      <p className={s.scriptCardBody}>
                        {idea.scriptOutline.payoff}
                      </p>
                    </div>
                  )}
                  {idea.scriptOutline.cta && (
                    <div className={s.scriptCard}>
                      <div className={s.scriptCardTitle}>Call to action</div>
                      <p className={s.scriptCardBody}>
                        {idea.scriptOutline.cta}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            </section>
          )}

          {/* Variations */}
          {idea.remixVariants && Object.keys(idea.remixVariants).length > 0 && (
            <section className={s.sheetSection}>
              <h3 className={s.sectionTitle}>Variations</h3>
              <p className={s.sectionIntro}>
                Same premise, different angle. Use these if you want a sharper
                take.
              </p>
              <div className={s.remixCards}>
                {Object.entries(idea.remixVariants)
                  .slice(0, 3)
                  .map(([key, variant]) => (
                    <div key={key} className={s.remixCard}>
                      <h4 className={s.remixCardTitle}>
                        {formatRemixLabel(key)} version
                      </h4>
                      {variant.titles?.[0]?.text && (
                        <p className={s.remixCardTitle2}>
                          {variant.titles[0].text}
                        </p>
                      )}
                      {variant.hooks?.[0]?.text && (
                        <p className={s.remixCardHook}>
                          &ldquo;{truncate(variant.hooks[0].text, 78)}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Safe area padding */}
          <div className={s.safeAreaBottom} />
        </div>
      </div>
    </div>
  );
}

/* ================================================
   NICHE INSIGHTS BAR
   ================================================ */
function NicheInsightsBar({
  insights,
}: {
  insights: IdeaBoardData["nicheInsights"];
}) {
  const [expanded, setExpanded] = useState(false);

  // Combine old and new field names for backwards compatibility
  const patterns = insights.winningPatterns ?? insights.patternsToCopy ?? [];
  const gaps = insights.contentGaps ?? insights.gapsToExploit ?? [];
  const avoid = insights.avoidThese ?? [];

  if (
    !insights.momentumNow.length &&
    !patterns.length &&
    !gaps.length &&
    !avoid.length
  ) {
    return null;
  }

  return (
    <div className={s.insightsBar}>
      <button
        className={s.insightsToggle}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={s.insightsIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </span>
        <span className={s.insightsLabel}>Niche Insights</span>
        <span className={s.insightsChevron}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className={s.insightsContent}>
          {insights.momentumNow.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>Momentum now</h4>
              <ul className={s.insightList}>
                {insights.momentumNow.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {patterns.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>Winning patterns</h4>
              <ul className={s.insightList}>
                {patterns.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {gaps.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>Content gaps</h4>
              <ul className={s.insightList}>
                {gaps.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {avoid.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>Avoid these</h4>
              <ul className={s.insightList}>
                {avoid.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================
   HELPERS
   ================================================ */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

function formatRemixLabel(key: string): string {
  const labels: Record<string, string> = {
    emotional: "Emotional",
    contrarian: "Contrarian",
    beginner: "Beginner-Friendly",
    advanced: "Advanced",
    shortsFirst: "Shorts-First",
  };
  return labels[key] ?? key;
}
