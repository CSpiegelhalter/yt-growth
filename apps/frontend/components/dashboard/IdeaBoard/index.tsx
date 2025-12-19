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

type RemixMode =
  | "default"
  | "emotional"
  | "contrarian"
  | "beginner"
  | "advanced"
  | "shortsFirst";
// Removed: FormatFilter and DifficultyFilter types - no longer used

/**
 * IdeaBoard - Premium Idea Engine experience
 * Visual, data-backed creative direction for YouTube creators
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
  const [remixMode, setRemixMode] = useState<RemixMode>("default");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingMoreProof, setLoadingMoreProof] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("savedIdeas");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  // Handle load more proof videos
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

  // All ideas - no filtering by format/difficulty
  const filteredIdeas = useMemo(() => {
    return data?.ideas ?? [];
  }, [data?.ideas]);

  // Top 3 sparks (hero ideas)
  const topSparks = filteredIdeas.slice(0, 3);
  // Rest of ideas for the stream
  const ideaStream = filteredIdeas.slice(3);

  const selectedIdea = useMemo(() => {
    if (!selectedIdeaId || !data?.ideas) return null;
    return data.ideas.find((i) => i.id === selectedIdeaId) ?? null;
  }, [selectedIdeaId, data?.ideas]);

  // Loading skeleton
  if (loading) {
    return (
      <div className={s.board}>
        <div className={s.skeletonHeader} />
        <div className={s.skeletonCarousel}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={s.skeletonSparkCard} />
          ))}
        </div>
        <div className={s.skeletonStream}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={s.skeletonStreamCard} />
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
            channels. See what's working in your niche and get actionable hooks,
            titles, and thumbnails.
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
            Generate video ideas backed by data from similar channels. We'll
            show you what's working and how to make it your own.
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
      {/* Top Bar */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <h1 className={s.title}>Idea Board</h1>
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

      {/* Filter chips removed - ideas now shown without format/difficulty filters */}

      {/* Hero Section: Top 3 Sparks */}
      {topSparks.length > 0 && (
        <section className={s.sparksSection}>
          <h2 className={s.sectionTitle}>Top Sparks</h2>
          <div className={s.sparksCarousel}>
            {topSparks.map((idea) => (
              <SparkCard
                key={idea.id}
                idea={idea}
                isSaved={savedIdeas.has(idea.id)}
                isSelected={selectedIdeaId === idea.id}
                onSelect={() => setSelectedIdeaId(idea.id)}
                onSave={() => toggleSaveIdea(idea.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Niche Insights */}
      {data.nicheInsights && <NicheInsightsBar insights={data.nicheInsights} />}

      {/* Selected Idea Detail View */}
      {selectedIdea && (
        <IdeaDetailView
          idea={selectedIdea}
          remixMode={remixMode}
          onRemixChange={setRemixMode}
          onCopy={handleCopy}
          copiedId={copiedId}
          onClose={() => setSelectedIdeaId(null)}
          similarChannels={data.similarChannels}
          onLoadMore={() => handleLoadMoreProof(selectedIdea.id)}
          loadingMore={loadingMoreProof}
        />
      )}

      {/* Idea Stream */}
      {ideaStream.length > 0 && (
        <section className={s.streamSection}>
          <h2 className={s.sectionTitle}>More Ideas</h2>
          <div className={s.streamGrid}>
            {ideaStream.map((idea) => (
              <StreamCard
                key={idea.id}
                idea={idea}
                isSaved={savedIdeas.has(idea.id)}
                onSelect={() => setSelectedIdeaId(idea.id)}
                onSave={() => toggleSaveIdea(idea.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className={s.footer}>
        <span className={s.footerMeta}>
          {filteredIdeas.length} ideas • Generated{" "}
          {formatRelativeTime(data.generatedAt)}
        </span>
      </footer>
    </div>
  );
}

/* ================================================
   SUB-COMPONENTS
   ================================================ */

/** Spark Card - Hero idea card with proof strip */
function SparkCard({
  idea,
  isSaved,
  isSelected,
  onSelect,
  onSave,
}: {
  idea: Idea;
  isSaved: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onSave: () => void;
}) {
  const topHook = idea.hooks[0];
  const proofVideos = idea.proof.basedOn.slice(0, 3);

  // Use button for accessibility and proper click handling
  return (
    <button
      type="button"
      className={`${s.sparkCard} ${isSelected ? s.sparkSelected : ""}`}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      {/* Selected indicator */}
      {isSelected && <span className={s.selectedChip}>Selected</span>}

      <div className={s.sparkHeader}>
        <span
          role="button"
          tabIndex={0}
          className={`${s.saveBtn} ${isSaved ? s.saved : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onSave();
            }
          }}
          title={isSaved ? "Unsave" : "Save idea"}
        >
          {isSaved ? "★" : "☆"}
        </span>
      </div>

      <h3 className={s.sparkTitle}>{idea.title}</h3>
      <p className={s.sparkAngle}>{idea.angle}</p>

      {topHook && (
        <div className={s.sparkHook}>
          <span className={s.hookQuote}>&ldquo;{topHook.text}&rdquo;</span>
          <div className={s.hookTags}>
            {topHook.typeTags.slice(0, 2).map((tag) => (
              <span key={tag} className={s.hookTag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Removed TH chip - thumbnail text shown in detail view */}

      {/* Proof Strip - Inspired by recent winners */}
      {proofVideos.length > 0 && (
        <div className={s.proofStrip}>
          <span className={s.proofLabel}>Inspired by:</span>
          <div className={s.proofThumbs}>
            {proofVideos.map((pv) => (
              <div key={pv.videoId} className={s.proofThumb} title={pv.title}>
                <img
                  src={pv.thumbnailUrl || "/placeholder-thumb.jpg"}
                  alt=""
                  loading="lazy"
                />
                <span className={s.proofViews}>
                  {formatCompact(pv.metrics.viewsPerDay)}/d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={s.sparkFooter}>
        <span className={s.tapHint}>Tap to explore →</span>
      </div>
    </button>
  );
}

/** Stream Card - Compact idea card for the grid */
function StreamCard({
  idea,
  isSaved,
  onSelect,
  onSave,
}: {
  idea: Idea;
  isSaved: boolean;
  onSelect: () => void;
  onSave: () => void;
}) {
  const topHook = idea.hooks[0];
  const topProof = idea.proof.basedOn[0];

  return (
    <div className={s.streamCard} onClick={onSelect}>
      <div className={s.streamCardHeader}>
        <button
          className={`${s.saveBtn} ${s.saveBtnSmall} ${isSaved ? s.saved : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
        >
          {isSaved ? "★" : "☆"}
        </button>
      </div>

      <h4 className={s.streamTitle}>{idea.title}</h4>

      {topHook && (
        <p className={s.streamHook}>
          &ldquo;{truncate(topHook.text, 60)}&rdquo;
        </p>
      )}

      <div className={s.streamFooter}>
        {topProof && (
          <div className={s.streamProof}>
            <img
              src={topProof.thumbnailUrl || "/placeholder-thumb.jpg"}
              alt=""
              className={s.streamProofThumb}
              loading="lazy"
            />
            <span className={s.streamProofChannel}>
              {topProof.channelTitle}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Idea Detail View - Full expanded view of an idea */
/** Uses bottom sheet pattern on mobile with fixed header and scrollable content */
function IdeaDetailView({
  idea,
  remixMode,
  onRemixChange,
  onCopy,
  copiedId,
  onClose,
  similarChannels,
  onLoadMore,
  loadingMore,
}: {
  idea: Idea;
  remixMode: RemixMode;
  onRemixChange: (mode: RemixMode) => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  onClose: () => void;
  similarChannels: IdeaBoardData["similarChannels"];
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<
    "hooks" | "titles" | "thumbnail" | "proof" | "keywords"
  >("hooks");
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
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

  // Get hooks/titles based on remix mode
  const displayHooks = useMemo(() => {
    if (
      remixMode === "default" ||
      !idea.remixVariants?.[remixMode as keyof typeof idea.remixVariants]
    ) {
      return idea.hooks;
    }
    return (
      idea.remixVariants[remixMode as keyof typeof idea.remixVariants]?.hooks ??
      idea.hooks
    );
  }, [idea, remixMode]);

  const displayTitles = useMemo(() => {
    if (
      remixMode === "default" ||
      !idea.remixVariants?.[remixMode as keyof typeof idea.remixVariants]
    ) {
      return idea.titles;
    }
    return (
      idea.remixVariants[remixMode as keyof typeof idea.remixVariants]
        ?.titles ?? idea.titles
    );
  }, [idea, remixMode]);

  return (
    <div
      className={s.detailOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="idea-detail-title"
    >
      <div
        ref={panelRef}
        className={s.detailPanel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header for Mobile Bottom Sheet */}
        <div className={s.detailHeaderFixed}>
          {/* Drag handle for mobile */}
          <div className={s.dragHandle} aria-hidden="true" />

          <button
            className={s.closeBtn}
            onClick={onClose}
            aria-label="Close detail view"
          >
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

          {/* Header Content */}
          <div className={s.detailHeader}>
            <h2 id="idea-detail-title" className={s.detailTitle}>
              {idea.title}
            </h2>
            <p className={s.detailAngle}>{idea.angle}</p>
          </div>

          {/* Remix Dial */}
          <div className={s.remixDial}>
            <span className={s.remixLabel}>Remix Style:</span>
            <div className={s.remixOptions}>
              {(
                [
                  { key: "default", label: "Original" },
                  { key: "emotional", label: "Emotional" },
                  { key: "contrarian", label: "Contrarian" },
                  { key: "beginner", label: "Beginner" },
                  { key: "advanced", label: "Advanced" },
                ] as { key: RemixMode; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.key}
                  className={`${s.remixBtn} ${
                    remixMode === opt.key ? s.remixActive : ""
                  }`}
                  onClick={() => onRemixChange(opt.key)}
                  disabled={
                    opt.key !== "default" &&
                    !idea.remixVariants?.[
                      opt.key as keyof typeof idea.remixVariants
                    ]
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Navigation - Sticky */}
          <div className={s.detailTabs}>
            {(
              [
                { key: "hooks", label: "Hooks", count: displayHooks.length },
                { key: "titles", label: "Titles", count: displayTitles.length },
                { key: "thumbnail", label: "Thumbnail" },
                {
                  key: "proof",
                  label: "Proof",
                  count: idea.proof.basedOn.length,
                },
                {
                  key: "keywords",
                  label: "Keywords",
                  count: idea.keywords.length,
                },
              ] as { key: typeof activeTab; label: string; count?: number }[]
            ).map((tab) => (
              <button
                key={tab.key}
                className={`${s.tabBtn} ${
                  activeTab === tab.key ? s.tabActive : ""
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={s.tabCount}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div className={s.tabContent}>
          {activeTab === "hooks" && (
            <HookLab hooks={displayHooks} onCopy={onCopy} copiedId={copiedId} />
          )}

          {activeTab === "titles" && (
            <TitleStudio
              titles={displayTitles}
              proofVideos={idea.proof.basedOn}
              onCopy={onCopy}
              copiedId={copiedId}
            />
          )}

          {activeTab === "thumbnail" && (
            <ThumbnailRecipe
              concept={idea.thumbnailConcept}
              proofVideos={idea.proof.basedOn}
              onCopy={onCopy}
              copiedId={copiedId}
            />
          )}

          {activeTab === "proof" && (
            <ProofInspiration
              proofVideos={idea.proof.basedOn}
              similarChannels={similarChannels}
              onLoadMore={onLoadMore}
              loadingMore={loadingMore}
            />
          )}

          {activeTab === "keywords" && (
            <KeywordsPanel
              keywords={idea.keywords}
              onCopy={onCopy}
              copiedId={copiedId}
            />
          )}

          {/* Safe area padding for iOS */}
          <div className={s.safeAreaBottom} />
        </div>
      </div>
    </div>
  );
}

/** Hook Lab - Visual hook cards */
function HookLab({
  hooks,
  onCopy,
  copiedId,
}: {
  hooks: IdeaHook[];
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  return (
    <div className={s.hookLab}>
      <p className={s.tabIntro}>
        Opening hooks to grab attention in the first 5 seconds
      </p>
      <div className={s.hookCards}>
        {hooks.map((hook, i) => (
          <div key={i} className={s.hookCard}>
            <p className={s.hookCardText}>&ldquo;{hook.text}&rdquo;</p>
            <div className={s.hookCardMeta}>
              <div className={s.hookCardTags}>
                {hook.typeTags.map((tag) => (
                  <span key={tag} className={s.hookTypeTag}>
                    {tag}
                  </span>
                ))}
              </div>
              <button
                className={s.copyBtn}
                onClick={() => onCopy(hook.text, `hook-${i}`)}
              >
                {copiedId === `hook-${i}` ? "✓" : "Copy"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Title Studio - Visual title options with inspiration sources */
function TitleStudio({
  titles,
  proofVideos,
  onCopy,
  copiedId,
}: {
  titles: IdeaTitle[];
  proofVideos: ProofVideo[];
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const proofMap = useMemo(() => {
    const map = new Map<string, ProofVideo>();
    proofVideos.forEach((pv) => map.set(pv.videoId, pv));
    return map;
  }, [proofVideos]);

  return (
    <div className={s.titleStudio}>
      <p className={s.tabIntro}>
        Title options with style tags showing what makes them work
      </p>
      <div className={s.titleCards}>
        {titles.map((title, i) => {
          const basedOnVideo = title.basedOnVideoId
            ? proofMap.get(title.basedOnVideoId)
            : null;
          return (
            <div key={i} className={s.titleCard}>
              <p className={s.titleCardText}>{title.text}</p>
              <div className={s.titleCardMeta}>
                <div className={s.titleStyleTags}>
                  {title.styleTags.map((tag) => (
                    <span key={tag} className={s.styleTag}>
                      {tag}
                    </span>
                  ))}
                </div>
                {basedOnVideo && (
                  <div className={s.titleBasedOn}>
                    <img
                      src={basedOnVideo.thumbnailUrl}
                      alt=""
                      className={s.titleBasedOnThumb}
                    />
                    <span className={s.titleBasedOnChannel}>
                      Inspired by{" "}
                      {title.basedOnChannel || basedOnVideo.channelTitle}
                    </span>
                  </div>
                )}
              </div>
              <button
                className={s.copyBtn}
                onClick={() => onCopy(title.text, `title-${i}`)}
              >
                {copiedId === `title-${i}` ? "✓" : "Copy"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Thumbnail Recipe - Visual thumbnail guidance */
function ThumbnailRecipe({
  concept,
  proofVideos,
  onCopy,
  copiedId,
}: {
  concept: Idea["thumbnailConcept"];
  proofVideos: ProofVideo[];
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  // Normalize moodboard refs to a common shape
  const moodboardRefs = useMemo(() => {
    if (concept.moodboardRefs && concept.moodboardRefs.length > 0) {
      return concept.moodboardRefs;
    }
    return proofVideos.slice(0, 3).map((pv) => ({
      videoId: pv.videoId,
      thumbnailUrl: pv.thumbnailUrl,
      channelTitle: pv.channelTitle,
    }));
  }, [concept.moodboardRefs, proofVideos]);

  return (
    <div className={s.thumbnailRecipe}>
      <div className={s.thumbnailMain}>
        <div className={s.thumbnailOverlay}>
          <span className={s.overlayLabel}>Text Overlay</span>
          <span className={s.overlayText}>{concept.overlayText}</span>
          <button
            className={s.copyBtn}
            onClick={() => onCopy(concept.overlayText, "overlay")}
          >
            {copiedId === "overlay" ? "✓" : "Copy"}
          </button>
        </div>

        <div className={s.thumbnailDetail}>
          <h4 className={s.thumbnailDetailTitle}>Composition</h4>
          <p className={s.thumbnailDetailText}>{concept.composition}</p>
        </div>

        <div className={s.thumbnailDetail}>
          <h4 className={s.thumbnailDetailTitle}>Contrast Note</h4>
          <p className={s.thumbnailDetailText}>{concept.contrastNote}</p>
        </div>

        {concept.avoid.length > 0 && (
          <div className={s.thumbnailAvoid}>
            <h4 className={s.thumbnailDetailTitle}>Avoid</h4>
            <ul className={s.avoidList}>
              {concept.avoid.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Moodboard */}
      {moodboardRefs.length > 0 && (
        <div className={s.moodboard}>
          <h4 className={s.moodboardTitle}>Reference Moodboard</h4>
          <div className={s.moodboardGrid}>
            {moodboardRefs.map((ref, i) => (
              <div key={i} className={s.moodboardItem}>
                <img
                  src={ref.thumbnailUrl || "/placeholder-thumb.jpg"}
                  alt=""
                  className={s.moodboardThumb}
                />
                <span className={s.moodboardChannel}>{ref.channelTitle}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Proof & Inspiration - Horizontal scroller of winning videos with load more */
function ProofInspiration({
  proofVideos,
  similarChannels,
  onLoadMore,
  loadingMore,
}: {
  proofVideos: ProofVideo[];
  similarChannels: IdeaBoardData["similarChannels"];
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  const [selectedProof, setSelectedProof] = useState<ProofVideo | null>(null);

  return (
    <div className={s.proofInspiration}>
      <p className={s.tabIntro}>
        These recent winners inspired this idea. Tap one to see why it worked.
      </p>

      {/* Proof Video Carousel */}
      <div className={s.proofCarousel}>
        {proofVideos.map((pv) => (
          <button
            type="button"
            key={pv.videoId}
            className={`${s.proofCard} ${
              selectedProof?.videoId === pv.videoId ? s.proofSelected : ""
            }`}
            onClick={() => setSelectedProof(pv)}
          >
            <div className={s.proofCardThumb}>
              <img src={pv.thumbnailUrl || "/placeholder-thumb.jpg"} alt="" />
              <span className={s.proofCardViews}>
                {formatCompact(pv.metrics.views)} views
              </span>
            </div>
            <div className={s.proofCardInfo}>
              <h5 className={s.proofCardTitle}>{truncate(pv.title, 50)}</h5>
              <span className={s.proofCardChannel}>{pv.channelTitle}</span>
              <span className={s.proofCardVPD}>
                {formatCompact(pv.metrics.viewsPerDay)}/day
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Load More Button */}
      {onLoadMore && (
        <button
          type="button"
          className={s.loadMoreBtn}
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <>
              <span className={s.spinnerSmall} />
              Loading...
            </>
          ) : (
            "More Inspiration"
          )}
        </button>
      )}

      {/* Selected Proof Detail */}
      {selectedProof && (
        <div className={s.proofDetail}>
          <h4 className={s.proofDetailTitle}>{selectedProof.title}</h4>

          {selectedProof.whyItWorked &&
            selectedProof.whyItWorked.length > 0 && (
              <div className={s.proofSection}>
                <h5 className={s.proofSectionTitle}>Why It Worked</h5>
                <ul className={s.proofList}>
                  {selectedProof.whyItWorked.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

          {selectedProof.patternToSteal &&
            selectedProof.patternToSteal.length > 0 && (
              <div className={s.proofSection}>
                <h5 className={s.proofSectionTitle}>Pattern to Steal</h5>
                <ul className={s.proofList}>
                  {selectedProof.patternToSteal.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

          {selectedProof.remixIdea && (
            <div className={s.proofSection}>
              <h5 className={s.proofSectionTitle}>How to Remix for You</h5>
              <p className={s.proofRemix}>{selectedProof.remixIdea}</p>
            </div>
          )}

          <a
            href={`https://youtube.com/watch?v=${selectedProof.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={s.proofLink}
          >
            Watch on YouTube →
          </a>
        </div>
      )}

      {/* Similar Channels Strip */}
      {similarChannels.length > 0 && (
        <div className={s.similarChannels}>
          <h4 className={s.similarTitle}>Similar Channels Tracked</h4>
          <div className={s.similarStrip}>
            {similarChannels.map((ch) => (
              <div key={ch.channelId} className={s.similarChannel}>
                {ch.channelThumbnailUrl && (
                  <img
                    src={ch.channelThumbnailUrl}
                    alt=""
                    className={s.similarThumb}
                  />
                )}
                <span className={s.similarName}>{ch.channelTitle}</span>
                <span className={s.similarScore}>
                  {Math.round(ch.similarityScore * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Keywords Panel - Chips with copy functionality */
function KeywordsPanel({
  keywords,
  onCopy,
  copiedId,
}: {
  keywords: Idea["keywords"];
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const allKeywords = keywords.map((k) => k.text).join(", ");

  return (
    <div className={s.keywordsPanel}>
      <p className={s.tabIntro}>Keywords and tags for discoverability</p>

      <div className={s.keywordChips}>
        {keywords.map((kw, i) => (
          <button
            key={i}
            className={s.keywordChip}
            onClick={() => onCopy(kw.text, `kw-${i}`)}
            title={kw.fit}
          >
            <span className={s.keywordText}>{kw.text}</span>
            <span className={`${s.keywordIntent} ${s[`intent-${kw.intent}`]}`}>
              {kw.intent}
            </span>
            {copiedId === `kw-${i}` && <span className={s.chipCopied}>✓</span>}
          </button>
        ))}
      </div>

      <button
        className={s.copyAllBtn}
        onClick={() => onCopy(allKeywords, "all-keywords")}
      >
        {copiedId === "all-keywords" ? "✓ Copied All" : "Copy All Keywords"}
      </button>
    </div>
  );
}

/** Niche Insights Bar - Quick insights strip */
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
   BADGE COMPONENTS
   ================================================ */

// DifficultyBadge and FormatBadge removed - no longer shown per user request

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
