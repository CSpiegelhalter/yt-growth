"use client";

import { useState, useMemo, useCallback } from "react";
import styles from "./panels.module.css";
import {
  runDescriptionSeoAudit,
  type DescriptionSeoInput,
  type DescriptionCheck,
  type DescriptionCheckStatus,
} from "@/lib/youtube/descriptionSeoAudit";
import { copyToClipboard } from "@/components/ui/Toast";

// ============================================
// Types
// ============================================

type VideoData = {
  title?: string;
  description?: string;
  tags?: string[];
  thumbnails?: Record<string, { url: string; width?: number; height?: number }>;
  categoryId?: string | null;
  publishedAt?: string;
};

type ApiFocusKeyword = {
  keyword: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  alternatives: string[];
};

type ApiSeoData = {
  focusKeyword?: ApiFocusKeyword;
  titleAnalysis?: unknown;
  descriptionAnalysis?: unknown;
  tagAnalysis?: unknown;
};

type SeoPanelProps = {
  video?: VideoData;
  caption?: "true" | "false" | boolean | string;
  data?: ApiSeoData | null;
  loading?: boolean;
  error?: string | null;
  videoTitle?: string;
};

// ============================================
// Helpers
// ============================================

function generateSuggestedTags(
  title: string,
  focusKeyword: string | null,
  candidates: string[],
  existingTags: string[]
): string[] {
  const suggestions: string[] = [];
  const existingLower = new Set(existingTags.map((t) => t.toLowerCase()));

  // Add focus keyword as first tag if not present
  if (focusKeyword && !existingLower.has(focusKeyword.toLowerCase())) {
    suggestions.push(focusKeyword);
  }

  // Add variations of focus keyword
  if (focusKeyword) {
    const variations = [
      `${focusKeyword} tutorial`,
      `${focusKeyword} guide`,
      `${focusKeyword} tips`,
      `how to ${focusKeyword}`,
      `best ${focusKeyword}`,
    ];
    variations.forEach((v) => {
      if (!existingLower.has(v.toLowerCase()) && suggestions.length < 15) {
        suggestions.push(v);
      }
    });
  }

  // Add other candidates
  candidates.forEach((c) => {
    if (
      c !== focusKeyword &&
      !existingLower.has(c.toLowerCase()) &&
      suggestions.length < 15
    ) {
      suggestions.push(c);
    }
  });

  // Extract key terms from title
  const titleWords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        ![
          "this",
          "that",
          "with",
          "from",
          "your",
          "will",
          "have",
          "been",
          "were",
          "they",
          "what",
          "when",
          "where",
          "which",
        ].includes(w)
    );

  titleWords.forEach((word) => {
    if (
      !existingLower.has(word) &&
      !suggestions.some((s) => s.toLowerCase().includes(word)) &&
      suggestions.length < 15
    ) {
      suggestions.push(word);
    }
  });

  return suggestions.slice(0, 12);
}

// ============================================
// Main Component
// ============================================

export function SeoPanel({ video, data, loading, error }: SeoPanelProps) {
  if (!video) {
    if (loading) {
      return (
        <div className={styles.seoLoading}>
          <div className={styles.loadingSpinner} />
          <p>Analyzing SEO...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.seoError}>
          <p>{error}</p>
        </div>
      );
    }
    return (
      <div className={styles.seoEmpty}>
        <p>No SEO data available</p>
      </div>
    );
  }

  return <SeoContent video={video} apiData={data} />;
}

// ============================================
// Main Content
// ============================================

function SeoContent({
  video,
  apiData,
}: {
  video: VideoData;
  apiData?: ApiSeoData | null;
}) {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Use API-provided focus keyword if available (LLM-based, smarter)
  const apiFocusKeyword = apiData?.focusKeyword;
  
  // Determine the effective keyword: user selection > API keyword > auto-detected
  const effectiveKeyword = selectedKeyword ?? apiFocusKeyword?.keyword ?? null;

  const auditInput: DescriptionSeoInput = useMemo(
    () => ({
      title: video.title ?? "",
      description: video.description ?? "",
      tags: video.tags ?? [],
    }),
    [video]
  );

  // Run audit with the effective keyword as override (so description/tag checks use the right keyword)
  const auditResult = useMemo(
    () => runDescriptionSeoAudit(auditInput, { focusKeywordOverride: effectiveKeyword }),
    [auditInput, effectiveKeyword]
  );

  // The focus keyword is now always from the audit (which uses our override)
  const focusKeyword = auditResult.focusKeyword.value;

  // Merge candidates: API alternatives + audit candidates (audit now includes override)
  const allCandidates = useMemo(() => {
    const apiAlts = apiFocusKeyword?.alternatives ?? [];
    const auditCandidates = auditResult.focusKeyword.candidates;
    const seen = new Set<string>();
    const merged: string[] = [];

    // Add audit candidates first (these include the effective keyword)
    for (const c of auditCandidates) {
      const lower = c.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        merged.push(c);
      }
    }

    // Add API alternatives that aren't duplicates
    for (const alt of apiAlts) {
      const lower = alt.toLowerCase();
      if (!seen.has(lower) && merged.length < 6) {
        seen.add(lower);
        merged.push(alt);
      }
    }

    return merged;
  }, [apiFocusKeyword?.alternatives, auditResult.focusKeyword.candidates]);

  // Generate suggested tags
  const suggestedTags = useMemo(
    () =>
      generateSuggestedTags(
        video.title ?? "",
        focusKeyword,
        allCandidates,
        video.tags ?? []
      ),
    [video.title, focusKeyword, allCandidates, video.tags]
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleCopy = useCallback(
    async (text: string) => {
      const success = await copyToClipboard(text);
      showToast(success ? "Copied" : "Failed to copy");
    },
    [showToast]
  );

  // Count issues by status
  const strongCount = auditResult.checks.filter(
    (c) => c.status === "strong"
  ).length;
  const totalCount = auditResult.checks.length;

  return (
    <div className={styles.seoPanel}>
      {/* Toast */}
      {toast && (
        <div className={styles.seoToast} role="status">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className={styles.seoHeader}>
        <div className={styles.seoSummaryRow}>
          <span className={styles.seoScore}>
            {strongCount}/{totalCount}
          </span>
          <span className={styles.seoScoreLabel}>checks passing</span>
        </div>

        <div className={styles.seoKeywordRow}>
          <span className={styles.seoKeywordLabel}>Focus keyword:</span>
          {focusKeyword ? (
            <span className={styles.seoKeywordValue}>{focusKeyword}</span>
          ) : (
            <span className={styles.seoKeywordNone}>Not detected</span>
          )}
          {allCandidates.length > 1 && (
            <KeywordPicker
              candidates={allCandidates}
              selected={focusKeyword}
              onSelect={setSelectedKeyword}
            />
          )}
        </div>
      </div>

      {/* Description */}
      <CheckSection
        title="Description"
        checks={auditResult.descriptionChecks}
        onCopy={handleCopy}
      />

      {/* Chapters - no examples */}
      <CheckSection
        title="Chapters"
        checks={auditResult.chapterChecks}
        onCopy={handleCopy}
        hideExamples
      />

      {/* Hashtags */}
      <CheckSection
        title="Hashtags"
        checks={auditResult.hashtagChecks}
        onCopy={handleCopy}
      />

      {/* Tags - with suggestions */}
      <TagsSection
        checks={auditResult.tagChecks}
        suggestedTags={suggestedTags}
        existingTags={video.tags ?? []}
        onCopy={handleCopy}
      />

      {/* Google Tips */}
      <section className={styles.seoSection}>
        <h3 className={styles.seoSectionTitle}>Rank on Google</h3>
        <ul className={styles.seoTipsList}>
          <li>Embed the video on your website in a relevant article</li>
          <li>Encourage engagement (likes, comments, shares)</li>
          <li>Promote on social media</li>
          <li>Use a high-quality custom thumbnail</li>
          <li>Add accurate captions/transcripts</li>
        </ul>
      </section>
    </div>
  );
}

// ============================================
// Keyword Picker
// ============================================

function KeywordPicker({
  candidates,
  selected,
  onSelect,
}: {
  candidates: string[];
  selected: string | null;
  onSelect: (kw: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.keywordPicker}>
      <button
        type="button"
        className={styles.keywordChangeBtn}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        Change
      </button>
      {open && (
        <div className={styles.keywordDropdown}>
          {candidates.slice(0, 5).map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.keywordOption} ${
                c === selected ? styles.keywordOptionActive : ""
              }`}
              onClick={() => {
                onSelect(c === selected ? null : c);
                setOpen(false);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Check Section with Card Grid
// ============================================

function CheckSection({
  title,
  checks,
  onCopy,
  hideExamples = false,
}: {
  title: string;
  checks: DescriptionCheck[];
  onCopy: (text: string) => void;
  hideExamples?: boolean;
}) {
  const passCount = checks.filter((c) => c.status === "strong").length;

  return (
    <section className={styles.seoSection}>
      <div className={styles.seoSectionHeader}>
        <h3 className={styles.seoSectionTitle}>{title}</h3>
        <span className={styles.seoSectionCount}>
          {passCount}/{checks.length}
        </span>
      </div>
      <div className={styles.checksGrid}>
        {checks.map((check) => (
          <CheckCard
            key={check.id}
            check={check}
            onCopy={onCopy}
            hideExample={hideExamples}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================
// Tags Section with Suggestions
// ============================================

function TagsSection({
  checks,
  suggestedTags,
  existingTags,
  onCopy,
}: {
  checks: DescriptionCheck[];
  suggestedTags: string[];
  existingTags: string[];
  onCopy: (text: string) => void;
}) {
  const passCount = checks.filter((c) => c.status === "strong").length;

  const handleCopyAll = () => {
    onCopy(suggestedTags.join(", "));
  };

  return (
    <section className={styles.seoSection}>
      <div className={styles.seoSectionHeader}>
        <h3 className={styles.seoSectionTitle}>Tags</h3>
        <span className={styles.seoSectionCount}>
          {passCount}/{checks.length}
        </span>
      </div>

      {/* Check cards */}
      <div className={styles.checksGrid}>
        {checks.map((check) => (
          <CheckCard key={check.id} check={check} onCopy={onCopy} hideExample />
        ))}
      </div>

      {/* Suggested tags */}
      {suggestedTags.length > 0 && (
        <div className={styles.suggestedTags}>
          <div className={styles.suggestedTagsHeader}>
            <span className={styles.suggestedTagsLabel}>
              Suggested tags for this video
            </span>
            <button
              type="button"
              className={styles.copyAllTagsBtn}
              onClick={handleCopyAll}
            >
              Copy all
            </button>
          </div>
          <div className={styles.tagChips}>
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={styles.tagChip}
                onClick={() => onCopy(tag)}
                title="Click to copy"
              >
                {tag}
              </button>
            ))}
          </div>
          {existingTags.length > 0 && (
            <p className={styles.existingTagsNote}>
              You already have {existingTags.length} tag
              {existingTags.length !== 1 ? "s" : ""} on this video
            </p>
          )}
        </div>
      )}
    </section>
  );
}

// ============================================
// Check Card
// ============================================

function CheckCard({
  check,
  onCopy,
  hideExample = false,
}: {
  check: DescriptionCheck;
  onCopy: (text: string) => void;
  hideExample?: boolean;
}) {
  const isStrong = check.status === "strong";
  const showExample = !hideExample && !isStrong && check.exampleFix;

  return (
    <div className={`${styles.checkCard} ${styles[`card-${check.status}`]}`}>
      <div className={styles.checkCardHeader}>
        <StatusDot status={check.status} />
        <span className={styles.checkCardLabel}>{check.label}</span>
      </div>

      {check.evidence && (
        <p className={styles.checkCardEvidence}>{check.evidence}</p>
      )}

      {!isStrong && check.recommendation && (
        <p className={styles.checkCardRec}>{check.recommendation}</p>
      )}

      {showExample && (
        <div className={styles.checkCardExample}>
          <pre>{check.exampleFix}</pre>
          <button
            type="button"
            className={styles.copyBtn}
            onClick={() => onCopy(check.exampleFix!)}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Status Dot
// ============================================

function StatusDot({ status }: { status: DescriptionCheckStatus }) {
  return (
    <span
      className={`${styles.statusDot} ${styles[`dot-${status}`]}`}
      aria-label={
        status === "strong"
          ? "Passing"
          : status === "needs_work"
          ? "Needs work"
          : "Missing"
      }
    />
  );
}