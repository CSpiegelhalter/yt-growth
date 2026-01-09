"use client";

import { useState, useMemo, useCallback } from "react";
import s from "./style.module.css";
import type { Plan, PlanTopic, PlanOutputJson } from "@/types/api";
import { getCacheStatus } from "@/lib/plan-parser";
import { copyToClipboard } from "@/components/ui/Toast";
import { SUBSCRIPTION, formatUsd } from "@/lib/product";

type Props = {
  plan: Plan | null;
  channelId: string;
  channelName?: string;
  isSubscribed: boolean;
  onGenerate: (options?: { mode?: "default" | "more" }) => Promise<void>;
  loading?: boolean;
};

/**
 * PlanCard - "Idea Engine" for YouTube content planning
 * Displays multiple topic ideas with drill-down into titles, hooks, and angles
 */
export default function PlanCard({
  plan,
  channelId,
  channelName,
  isSubscribed,
  onGenerate,
  loading = false,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "titles"
  );

  const planJson = useMemo<PlanOutputJson | null>(() => {
    if (!plan?.outputJson) return null;
    try {
      return typeof plan.outputJson === "string"
        ? JSON.parse(plan.outputJson)
        : plan.outputJson;
    } catch {
      return null;
    }
  }, [plan?.outputJson]);

  const cacheStatus = useMemo(() => {
    if (!plan) return null;
    return getCacheStatus(plan.createdAt, plan.cachedUntil);
  }, [plan]);

  const selectedTopic = planJson?.topics?.[selectedTopicIndex] ?? null;

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      await onGenerate({ mode: "default" });
    } finally {
      setGenerating(false);
    }
  }, [onGenerate]);

  const handleGenerateMore = useCallback(async () => {
    setGeneratingMore(true);
    try {
      await onGenerate({ mode: "more" });
    } finally {
      setGeneratingMore(false);
    }
  }, [onGenerate]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  }, []);

  const copyTopicPackage = useCallback(() => {
    if (!selectedTopic) return;
    const pkg = [
      `# ${selectedTopic.title}`,
      "",
      "## Why",
      selectedTopic.why,
      "",
      "## Angles",
      ...selectedTopic.angles.map((a) => `- ${a}`),
      "",
      "## Hooks",
      ...selectedTopic.hooks.map((h) => `- "${h}"`),
      "",
      "## Title Options",
      ...selectedTopic.titles.map((t, i) => `${i + 1}. ${t.text}`),
      "",
      "## Keywords",
      selectedTopic.keywords.join(", "),
      "",
      "## Thumbnail",
      `Overlay: ${selectedTopic.thumbnail.overlayText ?? "N/A"}`,
      `Layout: ${selectedTopic.thumbnail.layout ?? "N/A"}`,
    ].join("\n");
    handleCopy(pkg, "package");
  }, [selectedTopic, handleCopy]);

  // Loading skeleton
  if (loading) {
    return (
      <div className={s.card}>
        <div className={s.skeletonHeader}>
          <div className={s.skeleton} style={{ height: 24, width: "60%" }} />
          <div className={s.skeleton} style={{ height: 36, width: 100 }} />
        </div>
        <div className={s.skeletonCarousel}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={s.skeletonTopicCard} />
          ))}
        </div>
        <div className={s.skeletonContent}>
          <div className={s.skeleton} style={{ height: 100 }} />
          <div className={s.skeleton} style={{ height: 80, marginTop: 12 }} />
        </div>
      </div>
    );
  }

  // Subscription gate
  if (!isSubscribed) {
    return (
      <div className={s.card}>
        <div className={s.lockedState}>
          <div className={s.lockedIcon}>
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
          <h3 className={s.lockedTitle}>Unlock the Idea Engine</h3>
          <p className={s.lockedDesc}>
            Get video ideas with titles, hooks, angles, and thumbnail guidance
            tailored to your channel.
          </p>
          <a href="/api/integrations/stripe/checkout" className={s.btnPrimary}>
            Subscribe to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/{SUBSCRIPTION.PRO_INTERVAL}
          </a>
        </div>
      </div>
    );
  }

  // Empty state - no plan yet
  if (!plan) {
    return (
      <div className={s.card}>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
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
          <h3 className={s.emptyTitle}>Your Idea Engine</h3>
          <p className={s.emptyDesc}>
            Generate multiple video topic ideas with titles, hooks, angles, and
            thumbnail guidance.
          </p>
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
              "Generate 5 Topic Ideas"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Fallback: Show markdown content when JSON is not available
  if (!planJson || planJson.topics.length === 0) {
    if (plan.outputMarkdown) {
      return (
        <div className={s.card}>
          <header className={s.header}>
            <div className={s.headerLeft}>
              <h2 className={s.cardTitle}>Idea Engine</h2>
              <div className={s.headerMeta}>
                {channelName && (
                  <span className={s.channelName}>{channelName}</span>
                )}
                <span className={s.dot}>•</span>
                <span className={s.date}>{formatDate(plan.createdAt)}</span>
                <StatusBadge status={cacheStatus} />
                <span className={s.fallbackBadge}>Markdown View</span>
              </div>
            </div>
            <div className={s.headerActions}>
              <button
                onClick={() =>
                  handleCopy(plan.outputMarkdown ?? "", "full-plan")
                }
                className={s.btnSecondary}
                type="button"
              >
                {copiedId === "full-plan" ? "✓ Copied" : "Copy Plan"}
              </button>
            </div>
          </header>
          <div className={s.markdownContent}>
            <MarkdownRenderer content={plan.outputMarkdown} />
          </div>
          <footer className={s.footer}>
            <div className={s.footerMeta}>
              {plan.modelVersion && (
                <span className={s.footerItem}>Model: {plan.modelVersion}</span>
              )}
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={s.btnSecondary}
            >
              {generating ? "Regenerating..." : "Regenerate"}
            </button>
          </footer>
        </div>
      );
    }

    // Truly empty - no plan data at all
    return (
      <div className={s.card}>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
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
          <h3 className={s.emptyTitle}>Your Idea Engine</h3>
          <p className={s.emptyDesc}>
            Generate multiple video topic ideas with titles, hooks, angles, and
            thumbnail guidance.
          </p>
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
              "Generate 5 Topic Ideas"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.card}>
      {/* Header */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <h2 className={s.cardTitle}>Idea Engine</h2>
          <div className={s.headerMeta}>
            {channelName && (
              <span className={s.channelName}>{channelName}</span>
            )}
            <span className={s.dot}>•</span>
            <span className={s.date}>{formatDate(plan.createdAt)}</span>
            <StatusBadge status={cacheStatus} />
          </div>
        </div>
        <div className={s.headerActions}>
          <button
            onClick={handleGenerateMore}
            disabled={generatingMore}
            className={s.btnSecondary}
            title="Generate more topic ideas"
          >
            {generatingMore ? (
              <span className={s.spinner} />
            ) : (
              <>+ More Ideas</>
            )}
          </button>
        </div>
      </header>

      {/* Topic Carousel */}
      <section className={s.carouselSection}>
        <div className={s.carouselHeader}>
          <h3 className={s.carouselTitle}>Topics</h3>
          <span className={s.topicCount}>{planJson.topics.length} ideas</span>
        </div>
        <div className={s.carousel}>
          {planJson.topics.map((topic, index) => (
            <button
              key={topic.id || index}
              className={`${s.topicCard} ${
                index === selectedTopicIndex ? s.selected : ""
              }`}
              onClick={() => setSelectedTopicIndex(index)}
              type="button"
            >
              <ConfidenceBadge confidence={topic.confidence} />
              <h4 className={s.topicCardTitle}>{topic.title}</h4>
              <p className={s.topicCardWhy}>{truncate(topic.why, 60)}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Selected Topic Details */}
      {selectedTopic && (
        <section className={s.detailsSection}>
          <div className={s.detailsHeader}>
            <div>
              <ConfidenceBadge confidence={selectedTopic.confidence} />
              <h3 className={s.detailsTitle}>{selectedTopic.title}</h3>
              <p className={s.detailsWhy}>{selectedTopic.why}</p>
            </div>
            <button
              onClick={copyTopicPackage}
              className={s.copyPackageBtn}
              type="button"
            >
              {copiedId === "package" ? "✓ Copied" : "Copy Package"}
            </button>
          </div>

          {/* Accordion Sections */}
          <div className={s.accordionList}>
            {/* Titles */}
            <AccordionSection
              title="Title Options"
              icon=""
              count={selectedTopic.titles.length}
              isOpen={expandedSection === "titles"}
              onToggle={() =>
                setExpandedSection(
                  expandedSection === "titles" ? null : "titles"
                )
              }
            >
              <div className={s.titleList}>
                {selectedTopic.titles.map((title, i) => (
                  <div key={i} className={s.titleItem}>
                    <div className={s.titleContent}>
                      <span className={s.titleText}>{title.text}</span>
                      {title.tags && title.tags.length > 0 && (
                        <div className={s.titleTags}>
                          {title.tags.map((tag) => (
                            <span key={tag} className={s.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(title.text, `title-${i}`)}
                      className={s.copySmallBtn}
                      type="button"
                    >
                      {copiedId === `title-${i}` ? "✓" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* Hooks */}
            <AccordionSection
              title="Opening Hooks"
              icon=""
              count={selectedTopic.hooks.length}
              isOpen={expandedSection === "hooks"}
              onToggle={() =>
                setExpandedSection(expandedSection === "hooks" ? null : "hooks")
              }
            >
              <div className={s.hookList}>
                {selectedTopic.hooks.map((hook, i) => (
                  <div key={i} className={s.hookItem}>
                    <span className={s.hookText}>&ldquo;{hook}&rdquo;</span>
                    <button
                      onClick={() => handleCopy(hook, `hook-${i}`)}
                      className={s.copySmallBtn}
                      type="button"
                    >
                      {copiedId === `hook-${i}` ? "✓" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* Angles */}
            <AccordionSection
              title="Angles to Explore"
              icon=""
              count={selectedTopic.angles.length}
              isOpen={expandedSection === "angles"}
              onToggle={() =>
                setExpandedSection(
                  expandedSection === "angles" ? null : "angles"
                )
              }
            >
              <ul className={s.angleList}>
                {selectedTopic.angles.map((angle, i) => (
                  <li key={i} className={s.angleItem}>
                    {angle}
                  </li>
                ))}
              </ul>
            </AccordionSection>

            {/* Keywords */}
            <AccordionSection
              title="Keywords & Tags"
              icon=""
              count={selectedTopic.keywords.length}
              isOpen={expandedSection === "keywords"}
              onToggle={() =>
                setExpandedSection(
                  expandedSection === "keywords" ? null : "keywords"
                )
              }
            >
              <div className={s.keywordSection}>
                <div className={s.keywordChips}>
                  {selectedTopic.keywords.map((kw, i) => (
                    <button
                      key={i}
                      onClick={() => handleCopy(kw, `kw-${i}`)}
                      className={s.keywordChip}
                      type="button"
                    >
                      {kw}
                      {copiedId === `kw-${i}` && (
                        <span className={s.chipCopied}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    handleCopy(selectedTopic.keywords.join(", "), "all-kw")
                  }
                  className={s.copyAllBtn}
                  type="button"
                >
                  {copiedId === "all-kw" ? "✓ Copied All" : "Copy All Tags"}
                </button>
              </div>
            </AccordionSection>

            {/* Thumbnail */}
            {/* TODO: Future enhancement - autogenerate thumbnails using AI.
                For now, we show references from similar winners, overlay text suggestions,
                and composition guidance. See README for planned enhancements. */}
            <AccordionSection
              title="Thumbnail Recipe"
              icon=""
              isOpen={expandedSection === "thumbnail"}
              onToggle={() =>
                setExpandedSection(
                  expandedSection === "thumbnail" ? null : "thumbnail"
                )
              }
            >
              <div className={s.thumbnailSection}>
                {selectedTopic.thumbnail.overlayText && (
                  <div className={s.thumbnailRow}>
                    <span className={s.thumbnailLabel}>Text Overlay:</span>
                    <span className={s.thumbnailValue}>
                      &ldquo;{selectedTopic.thumbnail.overlayText}&rdquo;
                    </span>
                  </div>
                )}
                {selectedTopic.thumbnail.layout && (
                  <div className={s.thumbnailRow}>
                    <span className={s.thumbnailLabel}>Layout:</span>
                    <span className={s.thumbnailValue}>
                      {selectedTopic.thumbnail.layout}
                    </span>
                  </div>
                )}
                {selectedTopic.thumbnail.notes.length > 0 && (
                  <div className={s.thumbnailBlock}>
                    <span className={s.thumbnailLabel}>Tips:</span>
                    <ul className={s.thumbnailList}>
                      {selectedTopic.thumbnail.notes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedTopic.thumbnail.avoid.length > 0 && (
                  <div className={s.thumbnailBlock}>
                    <span className={s.thumbnailLabel}>Avoid:</span>
                    <ul className={s.thumbnailAvoidList}>
                      {selectedTopic.thumbnail.avoid.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionSection>
          </div>
        </section>
      )}

      {/* Niche Insights */}
      {planJson.nicheInsights && (
        <NicheInsightsSection insights={planJson.nicheInsights} />
      )}

      {/* Footer */}
      <footer className={s.footer}>
        <div className={s.footerMeta}>
          {plan.modelVersion && (
            <span className={s.footerItem}>Model: {plan.modelVersion}</span>
          )}
          <span className={s.footerItem}>
            {planJson.topics.length} topics generated
          </span>
        </div>
        <a href={`/audit/${channelId}`} className={s.footerLink}>
          View full audit →
        </a>
      </footer>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function StatusBadge({
  status,
}: {
  status: "fresh" | "cached" | "stale" | null;
}) {
  if (!status) return null;

  const config = {
    fresh: { label: "Fresh", className: "badgeFresh" },
    cached: { label: "Cached", className: "badgeCached" },
    stale: { label: "Stale", className: "badgeStale" },
  }[status];

  return (
    <span className={`${s.badge} ${s[config.className]}`}>{config.label}</span>
  );
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: PlanTopic["confidence"];
}) {
  const config = {
    high: { label: "High confidence", className: s.confidenceHigh },
    medium: { label: "Medium", className: s.confidenceMedium },
    exploratory: { label: "Exploratory", className: s.confidenceExploratory },
  }[confidence];

  return (
    <span className={`${s.confidenceBadge} ${config.className}`}>
      {config.label}
    </span>
  );
}

function AccordionSection({
  title,
  icon,
  count,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: string;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`${s.accordion} ${isOpen ? s.accordionOpen : ""}`}>
      <button className={s.accordionHeader} onClick={onToggle} type="button">
        {icon && <span className={s.accordionIcon}>{icon}</span>}
        <span className={s.accordionTitle}>{title}</span>
        {count !== undefined && (
          <span className={s.accordionCount}>{count}</span>
        )}
        <span className={s.accordionChevron}>{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && <div className={s.accordionContent}>{children}</div>}
    </div>
  );
}

function NicheInsightsSection({
  insights,
}: {
  insights: PlanOutputJson["nicheInsights"];
}) {
  return (
    <section className={s.insightsSection}>
      <h3 className={s.insightsTitle}>Niche Insights</h3>

      <div className={s.insightsGrid}>
        {insights.whatIsWorkingNow.length > 0 && (
          <div className={s.insightBlock}>
            <h4 className={s.insightBlockTitle}>What's Working Now</h4>
            <ul className={s.insightList}>
              {insights.whatIsWorkingNow.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {insights.formatsToCopy.length > 0 && (
          <div className={s.insightBlock}>
            <h4 className={s.insightBlockTitle}>Formats to Try</h4>
            <ul className={s.insightList}>
              {insights.formatsToCopy.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {(insights.doDont.do.length > 0 || insights.doDont.dont.length > 0) && (
          <div className={s.insightBlock + " " + s.fullWidth}>
            <h4 className={s.insightBlockTitle}>Do's and Don'ts</h4>
            <div className={s.doDontGrid}>
              {insights.doDont.do.length > 0 && (
                <div className={s.doSection}>
                  <span className={s.doLabel}>✓ Do</span>
                  <ul className={s.doList}>
                    {insights.doDont.do.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {insights.doDont.dont.length > 0 && (
                <div className={s.dontSection}>
                  <span className={s.dontLabel}>✗ Don't</span>
                  <ul className={s.dontList}>
                    {insights.doDont.dont.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Markdown Renderer ---------- */

function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown to JSX conversion
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className={s.mdList}>
          {listItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className={s.mdH2}>
          {trimmed.replace(/^##\s*/, "")}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className={s.mdH3}>
          {trimmed.replace(/^###\s*/, "")}
        </h3>
      );
    }
    // List items (- or numbered)
    else if (trimmed.match(/^[-*]\s+\[?\s?\]?\s*/)) {
      listItems.push(trimmed.replace(/^[-*]\s+\[?\s?\]?\s*/, ""));
    } else if (trimmed.match(/^\d+\.\s+/)) {
      listItems.push(trimmed.replace(/^\d+\.\s+/, ""));
    }
    // Bold text as standalone line (like **"Title"**)
    else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      flushList();
      elements.push(
        <p key={i} className={s.mdBold}>
          {trimmed.replace(/^\*\*|\*\*$/g, "")}
        </p>
      );
    }
    // Regular paragraph
    else if (trimmed.length > 0) {
      flushList();
      // Handle inline bold
      const formattedText = trimmed.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
      );
      elements.push(
        <p
          key={i}
          className={s.mdParagraph}
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    }
  });

  flushList();

  return <div className={s.mdContent}>{elements}</div>;
}

/* ---------- Helpers ---------- */

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "Yesterday";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}
