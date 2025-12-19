"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
  channelName?: string;
  loading?: boolean;
  isSubscribed?: boolean;
  onGenerate?: (options?: {
    mode?: "default" | "more";
    range?: "7d" | "28d";
  }) => Promise<void>;
  onRefresh?: (range: "7d" | "28d") => void;
  onLoadMoreProof?: (ideaId: string) => Promise<void>;
};

/**
 * IdeaBoard - Premium Idea Engine experience
 * Vertical feed with scrollable detail sheets
 */
export default function IdeaBoard({
  data,
  channelName,
  loading = false,
  isSubscribed = true,
  onGenerate,
  onRefresh,
  onLoadMoreProof,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [range, setRange] = useState<"7d" | "28d">("7d");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingMoreProof, setLoadingMoreProof] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("savedIdeas");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  const handleLoadMoreProof = useCallback(
    async (ideaId: string) => {
      if (!onLoadMoreProof || loadingMoreProof) return;
      setLoadingMoreProof(true);
      try {
        await onLoadMoreProof(ideaId);
      } finally {
        setLoadingMoreProof(false);
      }
    },
    [onLoadMoreProof, loadingMoreProof]
  );

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

  const toggleSaveIdea = useCallback((ideaId: string) => {
    setSavedIdeas((prev) => {
      const next = new Set(prev);
      if (next.has(ideaId)) {
        next.delete(ideaId);
      } else {
        next.add(ideaId);
      }
      localStorage.setItem("savedIdeas", JSON.stringify([...next]));
      return next;
    });
  }, []);

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
            Get AI-generated video ideas backed by real data from similar
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
            onSelect={() => setSelectedIdeaId(idea.id)}
            onSave={() => toggleSaveIdea(idea.id)}
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
      </footer>

      {/* Detail Sheet */}
      {selectedIdea && (
        <IdeaDetailSheet
          idea={selectedIdea}
          onCopy={handleCopy}
          copiedId={copiedId}
          onClose={() => setSelectedIdeaId(null)}
          similarChannels={data.similarChannels}
          onLoadMore={() => handleLoadMoreProof(selectedIdea.id)}
          loadingMore={loadingMoreProof}
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
  onSelect,
  onSave,
  onCopyHook,
  copiedId,
}: {
  idea: Idea;
  isSaved: boolean;
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
        <h3 className={s.ideaTitle}>{idea.title}</h3>
        <p className={s.ideaAngle}>{idea.angle}</p>

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
          className={`${s.ideaSaveBtn} ${isSaved ? s.saved : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          title={isSaved ? "Unsave" : "Save idea"}
        >
          {isSaved ? (
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
  similarChannels,
  onLoadMore,
  loadingMore,
}: {
  idea: Idea;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  onClose: () => void;
  similarChannels: IdeaBoardData["similarChannels"];
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

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

  const allKeywords = idea.keywords.map((k) => k.text).join(", ");
  const allHooks = idea.hooks.map((h) => h.text).join("\n\n");
  const allTitles = idea.titles.map((t) => t.text).join("\n");

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

        {/* Sticky header */}
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
        </div>

        {/* Quick Actions Bar */}
        <div className={s.quickActions}>
          <button
            className={s.quickActionBtn}
            onClick={() => onCopy(idea.hooks[0]?.text ?? "", "quick-hook")}
          >
            {copiedId === "quick-hook" ? "Copied" : "Copy Hook"}
          </button>
          <button
            className={s.quickActionBtn}
            onClick={() => onCopy(idea.titles[0]?.text ?? "", "quick-title")}
          >
            {copiedId === "quick-title" ? "Copied" : "Copy Title"}
          </button>
          <button
            className={s.quickActionBtn}
            onClick={() => onCopy(allKeywords, "quick-keywords")}
          >
            {copiedId === "quick-keywords" ? "Copied" : "Copy Keywords"}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className={s.sheetContent}>
          {/* Hooks Section */}
          <section className={s.sheetSection}>
            <div className={s.sectionHeader}>
              <h3 className={s.sectionTitle}>Hooks</h3>
              <button
                className={s.copyAllBtn}
                onClick={() => onCopy(allHooks, "all-hooks")}
              >
                {copiedId === "all-hooks" ? "Copied" : "Copy All"}
              </button>
            </div>
            <p className={s.sectionIntro}>
              Opening lines to grab attention in the first 5 seconds
            </p>
            <div className={s.hookCards}>
              {idea.hooks.map((hook, i) => (
                <div key={i} className={s.hookCard}>
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
                      className={s.copyBtn}
                      onClick={() => onCopy(hook.text, `hook-${i}`)}
                    >
                      {copiedId === `hook-${i}` ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Titles Section */}
          <section className={s.sheetSection}>
            <div className={s.sectionHeader}>
              <h3 className={s.sectionTitle}>Titles</h3>
              <button
                className={s.copyAllBtn}
                onClick={() => onCopy(allTitles, "all-titles")}
              >
                {copiedId === "all-titles" ? "Copied" : "Copy All"}
              </button>
            </div>
            <p className={s.sectionIntro}>
              Title options with style patterns that work
            </p>
            <div className={s.titleCards}>
              {idea.titles.map((title, i) => (
                <div key={i} className={s.titleCard}>
                  <p className={s.titleCardText}>{title.text}</p>
                  <div className={s.titleCardFooter}>
                    <div className={s.styleTags}>
                      {title.styleTags.map((tag) => (
                        <span key={tag} className={s.styleTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      className={s.copyBtn}
                      onClick={() => onCopy(title.text, `title-${i}`)}
                    >
                      {copiedId === `title-${i}` ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Inspired By Section (formerly Proof) */}
          <section className={s.sheetSection}>
            <h3 className={s.sectionTitle}>Inspired By</h3>
            <p className={s.sectionIntro}>
              Recent winners that sparked this idea
            </p>
            <div className={s.proofScroller}>
              {idea.proof.basedOn.map((pv) => (
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
            {onLoadMore && (
              <button
                className={s.loadMoreBtn}
                onClick={onLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            )}
          </section>

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
            </div>
          </section>

          {/* Thumbnail Recipe */}
          {idea.thumbnailConcept && (
            <section className={s.sheetSection}>
              <h3 className={s.sectionTitle}>Thumbnail Recipe</h3>
              <div className={s.thumbnailRecipe}>
                <div className={s.thumbnailOverlay}>
                  <span className={s.overlayLabel}>Text Overlay</span>
                  <span className={s.overlayText}>
                    {idea.thumbnailConcept.overlayText}
                  </span>
                  <button
                    className={s.copyBtn}
                    onClick={() =>
                      onCopy(idea.thumbnailConcept.overlayText, "overlay")
                    }
                  >
                    {copiedId === "overlay" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className={s.thumbnailNote}>
                  <strong>Composition:</strong>{" "}
                  {idea.thumbnailConcept.composition}
                </p>
                <p className={s.thumbnailNote}>
                  <strong>Contrast:</strong>{" "}
                  {idea.thumbnailConcept.contrastNote}
                </p>
                {idea.thumbnailConcept.avoid.length > 0 && (
                  <div className={s.thumbnailAvoid}>
                    <strong>Avoid:</strong>
                    <ul>
                      {idea.thumbnailConcept.avoid.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
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

/* ================================================
   NICHE INSIGHTS BAR
   ================================================ */
function NicheInsightsBar({
  insights,
}: {
  insights: IdeaBoardData["nicheInsights"];
}) {
  const [expanded, setExpanded] = useState(false);

  if (
    !insights.momentumNow.length &&
    !insights.patternsToCopy.length &&
    !insights.gapsToExploit.length
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
              <h4 className={s.insightTitle}>Momentum Now</h4>
              <ul className={s.insightList}>
                {insights.momentumNow.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {insights.patternsToCopy.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>Patterns to Copy</h4>
              <ul className={s.insightList}>
                {insights.patternsToCopy.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {insights.gapsToExploit.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>Gaps to Exploit</h4>
              <ul className={s.insightList}>
                {insights.gapsToExploit.map((item, i) => (
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
