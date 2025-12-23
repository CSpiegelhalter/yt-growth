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
  const [range, setRange] = useState<"7d" | "28d">("7d");
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
      await onGenerate({ mode: "default", range });
    } finally {
      setGenerating(false);
    }
  }, [onGenerate, range]);

  const handleGenerateMore = useCallback(async () => {
    if (!onGenerate) return;
    setGeneratingMore(true);
    try {
      await onGenerate({ mode: "more", range });
    } finally {
      setGeneratingMore(false);
    }
  }, [onGenerate, range]);

  const handleRangeChange = useCallback(
    (newRange: "7d" | "28d") => {
      setRange(newRange);
      onRefresh?.(newRange);
    },
    [onRefresh]
  );

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
            Get video ideas backed by real data from similar
            channels. See what&apos;s working in your niche and get actionable
            hooks, titles, and thumbnails.
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
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 className={s.emptyTitle}>Your Idea Board</h2>
          <p className={s.emptyDesc}>
            Generate video ideas backed by data from similar channels.
            We&apos;ll show you what&apos;s working and how to make it your own.
          </p>
          <div className={s.emptyActions}>
            <select
              className={s.rangeSelect}
              value={range}
              onChange={(e) => setRange(e.target.value as "7d" | "28d")}
            >
              <option value="7d">Last 7 days</option>
              <option value="28d">Last 28 days</option>
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={s.btnPrimary}
            >
              {generating ? (
                <>
                  <span className={s.spinner} />
                  Generating Ideas...
                </>
              ) : (
                "Generate Ideas"
              )}
            </button>
          </div>
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
        <div className={s.headerRight}>
          <select
            className={s.rangeSelect}
            value={range}
            onChange={(e) => handleRangeChange(e.target.value as "7d" | "28d")}
          >
            <option value="7d">Last 7 days</option>
            <option value="28d">Last 28 days</option>
          </select>
          <button
            onClick={handleGenerateMore}
            disabled={generatingMore}
            className={s.btnSecondary}
          >
            {generatingMore ? <span className={s.spinner} /> : "+ More Ideas"}
          </button>
        </div>
      </header>

      {/* Niche Insights */}
      {data.nicheInsights && <NicheInsightsBar insights={data.nicheInsights} />}

      {/* Vertical Idea Feed */}
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
      </div>

      {/* Footer */}
      <footer className={s.footer}>
        <span className={s.footerMeta}>
          {ideas.length} ideas generated {formatRelativeTime(data.generatedAt)}
        </span>
        {savedIdeas.size > 0 && (
          <Link href="/saved-ideas" className={s.savedIdeasLink}>
            View {savedIdeas.size} saved idea{savedIdeas.size !== 1 ? "s" : ""} →
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
  const topHook = idea.hooks[0];
  const proofVideos = idea.proof.basedOn.slice(0, 3);

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
            <span className={s.whyNowIcon}>⚡</span>
            {truncate(idea.whyNow, 100)}
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

        {/* Inspired by strip */}
        {proofVideos.length > 0 && (
          <div className={s.inspiredBy}>
            <span className={s.inspiredLabel}>Inspired by:</span>
            <div className={s.inspiredThumbs}>
              {proofVideos.map((pv) => (
                <div
                  key={pv.videoId}
                  className={s.inspiredThumb}
                  title={pv.title}
                >
                  <img
                    src={pv.thumbnailUrl || "/placeholder-thumb.jpg"}
                    alt=""
                    loading="lazy"
                  />
                </div>
              ))}
              {proofVideos[0] && (
                <span className={s.inspiredChannel}>
                  {proofVideos[0].channelTitle}
                </span>
              )}
            </div>
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
          className={`${s.ideaSaveBtn} ${isSaved ? s.saved : ""} ${isSaving ? s.saving : ""}`}
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
  const panelRef = useRef<HTMLDivElement>(null);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [extraHooks, setExtraHooks] = useState<string[]>([]);
  const [extraTitles, setExtraTitles] = useState<string[]>([]);
  const [extraKeywords, setExtraKeywords] = useState<string[]>([]);
  const [packaging, setPackaging] = useState<{
    titleAngles: string[];
    hookSetups: string[];
    visualMoments: string[];
  } | null>(null);

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

  // Generate packaging ideas on mount (client-side derivation)
  useEffect(() => {
    if (!packaging) {
      const derived = derivePackagingIdeas(idea);
      setPackaging(derived);
    }
  }, [idea, packaging]);

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
            keywords: idea.keywords.slice(0, 5).map((k) => k.text),
            hooks: idea.hooks.slice(0, 2).map((h) => h.text),
            inspiredByVideoIds: idea.proof.basedOn.slice(0, 3).map((p) => p.videoId),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.hooks?.length) setExtraHooks((prev) => [...prev, ...data.hooks]);
        if (data.titles?.length) setExtraTitles((prev) => [...prev, ...data.titles]);
        if (data.keywords?.length) setExtraKeywords((prev) => [...prev, ...data.keywords]);
        if (data.packaging) setPackaging(data.packaging);
      }
    } catch (err) {
      console.error("Failed to generate more:", err);
    } finally {
      setGeneratingMore(false);
    }
  }, [channelId, generatingMore, idea]);

  const allKeywords = [
    ...idea.keywords.map((k) => k.text),
    ...extraKeywords,
  ].join(", ");

  // Combine original + extra content
  const allHooks = [
    ...idea.hooks.map((h) => h.text),
    ...extraHooks,
  ];
  const allTitles = [
    ...idea.titles.map((t) => t.text),
    ...extraTitles,
  ];

  // Limit inspired by to 6 max, no load more
  const proofVideos = idea.proof.basedOn.slice(0, 6);

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
          <h2 className={s.sheetTitle}>{idea.title}</h2>
          <p className={s.sheetAngle}>{idea.angle}</p>

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
          {/* Hooks Section */}
          <section className={s.sheetSection}>
            <h3 className={s.sectionTitle}>Hooks</h3>
            <p className={s.sectionIntro}>
              Opening lines to grab attention in the first 5 seconds
            </p>
            <div className={s.hookCards}>
              {idea.hooks.map((hook, i) => (
                <div key={`orig-${i}`} className={s.hookCard}>
                  <p className={s.hookCardText}>&ldquo;{hook.text}&rdquo;</p>
                  <div className={s.hookCardFooter}>
                    <div className={s.hookTags}>
                      {hook.typeTags.slice(0, 2).map((tag) => (
                        <span key={tag} className={s.hookTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      className={s.copyIconBtn}
                      onClick={() => onCopy(hook.text, `hook-${i}`)}
                      title="Copy"
                    >
                      {copiedId === `hook-${i}` ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {/* Extra hooks from Generate More */}
              {extraHooks.map((hookText, i) => (
                <div key={`extra-${i}`} className={`${s.hookCard} ${s.newItem}`}>
                  <span className={s.newBadge}>New</span>
                  <p className={s.hookCardText}>&ldquo;{hookText}&rdquo;</p>
                  <div className={s.hookCardFooter}>
                    <div />
                    <button
                      className={s.copyIconBtn}
                      onClick={() => onCopy(hookText, `extra-hook-${i}`)}
                      title="Copy"
                    >
                      {copiedId === `extra-hook-${i}` ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Titles Section */}
          <section className={s.sheetSection}>
            <h3 className={s.sectionTitle}>Titles</h3>
            <p className={s.sectionIntro}>
              Title options with style patterns that work
            </p>
            <div className={s.titleCards}>
              {idea.titles.map((title, i) => (
                <div key={`orig-${i}`} className={s.titleCard}>
                  <div className={s.titleCardContent}>
                    <p className={s.titleCardText}>{title.text}</p>
                    <div className={s.styleTags}>
                      {title.styleTags.map((tag) => (
                        <span key={tag} className={s.styleTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className={s.copyIconBtn}
                    onClick={() => onCopy(title.text, `title-${i}`)}
                    title="Copy"
                  >
                    {copiedId === `title-${i}` ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
              {/* Extra titles from Generate More */}
              {extraTitles.map((titleText, i) => (
                <div key={`extra-${i}`} className={`${s.titleCard} ${s.newItem}`}>
                  <span className={s.newBadge}>New</span>
                  <div className={s.titleCardContent}>
                    <p className={s.titleCardText}>{titleText}</p>
                  </div>
                  <button
                    className={s.copyIconBtn}
                    onClick={() => onCopy(titleText, `extra-title-${i}`)}
                    title="Copy"
                  >
                    {copiedId === `extra-title-${i}` ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Script Outline Section - if available */}
          {idea.scriptOutline && (
            <section className={s.sheetSection}>
              <h3 className={s.sectionTitle}>Script Outline</h3>
              <p className={s.sectionIntro}>
                Structure for your video content
              </p>
              <div className={s.scriptOutline}>
                {idea.scriptOutline.hook && (
                  <div className={s.scriptBlock}>
                    <h4 className={s.scriptBlockTitle}>
                      <span className={s.scriptIcon}>🎬</span> Hook (0-10 sec)
                    </h4>
                    <p className={s.scriptBlockText}>{idea.scriptOutline.hook}</p>
                  </div>
                )}
                {idea.scriptOutline.setup && (
                  <div className={s.scriptBlock}>
                    <h4 className={s.scriptBlockTitle}>
                      <span className={s.scriptIcon}>📋</span> Setup (10-40 sec)
                    </h4>
                    <p className={s.scriptBlockText}>{idea.scriptOutline.setup}</p>
                  </div>
                )}
                {idea.scriptOutline.mainPoints && idea.scriptOutline.mainPoints.length > 0 && (
                  <div className={s.scriptBlock}>
                    <h4 className={s.scriptBlockTitle}>
                      <span className={s.scriptIcon}>📝</span> Main Points
                    </h4>
                    <ul className={s.scriptPoints}>
                      {idea.scriptOutline.mainPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {idea.scriptOutline.payoff && (
                  <div className={s.scriptBlock}>
                    <h4 className={s.scriptBlockTitle}>
                      <span className={s.scriptIcon}>🎯</span> Payoff
                    </h4>
                    <p className={s.scriptBlockText}>{idea.scriptOutline.payoff}</p>
                  </div>
                )}
                {idea.scriptOutline.cta && (
                  <div className={s.scriptBlock}>
                    <h4 className={s.scriptBlockTitle}>
                      <span className={s.scriptIcon}>👉</span> Call to Action
                    </h4>
                    <p className={s.scriptBlockText}>{idea.scriptOutline.cta}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Inspired By Section - curated, no load more */}
          {proofVideos.length > 0 && (
            <section className={s.sheetSection}>
              <h3 className={s.sectionTitle}>Inspired By</h3>
              <p className={s.sectionIntro}>
                Recent winners that sparked this idea
              </p>
              <div className={s.proofScroller}>
                {proofVideos.map((pv) => (
                  <a
                    key={pv.videoId}
                    href={`/competitors/video/${pv.videoId}`}
                    className={s.proofCard}
                  >
                    <div className={s.proofThumb}>
                      <img
                        src={pv.thumbnailUrl || "/placeholder-thumb.jpg"}
                        alt=""
                      />
                      <span className={s.proofViews}>
                        {formatCompact(pv.metrics.viewsPerDay)}/day
                      </span>
                    </div>
                    <div className={s.proofInfo}>
                      <h4 className={s.proofTitle}>{truncate(pv.title, 50)}</h4>
                      <span className={s.proofChannel}>{pv.channelTitle}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Keywords Section */}
          <section className={s.sheetSection}>
            <div className={s.sectionHeader}>
              <h3 className={s.sectionTitle}>Keywords</h3>
              <button
                className={s.copyAllBtn}
                onClick={() => onCopy(allKeywords, "all-keywords")}
              >
                {copiedId === "all-keywords" ? "Copied" : "Copy All"}
              </button>
            </div>
            <p className={s.sectionIntro}>Tags for discoverability</p>
            <div className={s.keywordChips}>
              {idea.keywords.map((kw, i) => (
                <button
                  key={i}
                  className={s.keywordChip}
                  onClick={() => onCopy(kw.text, `kw-${i}`)}
                >
                  {kw.text}
                  {copiedId === `kw-${i}` && (
                    <span className={s.chipCheck}>✓</span>
                  )}
                </button>
              ))}
              {extraKeywords.map((kw, i) => (
                <button
                  key={`extra-${i}`}
                  className={`${s.keywordChip} ${s.newChip}`}
                  onClick={() => onCopy(kw, `extra-kw-${i}`)}
                >
                  {kw}
                  {copiedId === `extra-kw-${i}` && (
                    <span className={s.chipCheck}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Packaging Ideas - replaces Thumbnail Recipe */}
          {packaging && (
            <section className={s.sheetSection}>
              <h3 className={s.sectionTitle}>Packaging Ideas</h3>
              <p className={s.sectionIntro}>
                How to package this video for maximum impact
              </p>
              <div className={s.packagingGrid}>
                {/* Title Angles */}
                <div className={s.packagingCard}>
                  <h4 className={s.packagingCardTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                    </svg>
                    Title Angles
                  </h4>
                  <ul className={s.packagingList}>
                    {packaging.titleAngles.map((angle, i) => (
                      <li key={i}>{angle}</li>
                    ))}
                  </ul>
                </div>

                {/* Hook Setups */}
                <div className={s.packagingCard}>
                  <h4 className={s.packagingCardTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
                    </svg>
                    Hook Setups
                  </h4>
                  <ul className={s.packagingList}>
                    {packaging.hookSetups.map((setup, i) => (
                      <li key={i}>{setup}</li>
                    ))}
                  </ul>
                </div>

                {/* Visual Moments */}
                <div className={s.packagingCard}>
                  <h4 className={s.packagingCardTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    Visual Moments
                  </h4>
                  <ul className={s.packagingList}>
                    {packaging.visualMoments.map((moment, i) => (
                      <li key={i}>{moment}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Make It Yours - Remix Suggestions */}
          {idea.remixVariants && Object.keys(idea.remixVariants).length > 0 && (
            <section className={s.sheetSection}>
              <h3 className={s.sectionTitle}>Make It Yours</h3>
              <p className={s.sectionIntro}>
                Twist this idea to fit your style
              </p>
              <div className={s.remixCards}>
                {Object.entries(idea.remixVariants)
                  .slice(0, 3)
                  .map(([key, variant]) => (
                    <div key={key} className={s.remixCard}>
                      <h4 className={s.remixCardTitle}>
                        {formatRemixLabel(key)} Version
                      </h4>
                      {variant.hooks[0] && (
                        <p className={s.remixCardHook}>
                          &ldquo;{truncate(variant.hooks[0].text, 60)}&rdquo;
                        </p>
                      )}
                      {variant.titles[0] && (
                        <p className={s.remixCardTitle2}>
                          {variant.titles[0].text}
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

/** Derive packaging ideas client-side from idea data */
function derivePackagingIdeas(idea: Idea): {
  titleAngles: string[];
  hookSetups: string[];
  visualMoments: string[];
} {
  const titleAngles: string[] = [];
  const hookSetups: string[] = [];
  const visualMoments: string[] = [];

  // Derive title angles from titles and keywords
  if (idea.titles.length > 0) {
    const firstTitle = idea.titles[0].text;
    titleAngles.push(`Lead with the promise: "${truncate(firstTitle, 40)}"`);
  }
  if (idea.keywords.length > 0) {
    titleAngles.push(`Keyword-first: Start with "${idea.keywords[0].text}"`);
  }
  titleAngles.push("Question format: Turn the topic into a curiosity question");

  // Derive hook setups from hooks
  if (idea.hooks.length > 0) {
    hookSetups.push("Start with a bold claim from your top hook");
    hookSetups.push("Open with a relatable problem your audience faces");
  }
  hookSetups.push("Show the end result first, then explain how");

  // Derive visual moments from proof/inspired by
  if (idea.proof.basedOn.length > 0) {
    visualMoments.push("Show a quick result/transformation in first 3 seconds");
  }
  visualMoments.push("Use text overlay matching your title promise");
  visualMoments.push("Cut to B-roll of your hands demonstrating the concept");

  return { titleAngles, hookSetups, visualMoments };
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
              <h4 className={s.insightTitle}>🔥 Momentum Now</h4>
              <ul className={s.insightList}>
                {insights.momentumNow.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {patterns.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>✓ Winning Patterns</h4>
              <ul className={s.insightList}>
                {patterns.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {gaps.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>💡 Content Gaps</h4>
              <ul className={s.insightList}>
                {gaps.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {avoid.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>⚠️ Avoid These</h4>
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
function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

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
