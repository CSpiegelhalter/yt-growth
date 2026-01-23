"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import s from "../tags.module.css";
import { useToast } from "@/components/ui/Toast";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import { SUBSCRIPTION, formatUsd } from "@/lib/product";

// ============================================
// TYPES
// ============================================

type UsageInfo = {
  remaining: number;
  used: number;
  limit: number;
  resetAt: string;
  isPro: boolean;
};

type GenerateResponse = {
  tags: string[];
  copyComma: string;
  copyLines: string;
  notes: string[];
  remaining: number;
  resetAt: string;
};

// ============================================
// COMPONENT
// ============================================

export function TagGeneratorClient() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [usageLoading, setUsageLoading] = useState(true);

  // Result state
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [copyComma, setCopyComma] = useState("");
  const [copyLines, setCopyLines] = useState("");

  // Usage state
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  // Validation state
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    referenceUrl?: string;
  }>({});

  // Handle prefill from Tag Finder
  useEffect(() => {
    const prefillTags = searchParams.get("prefill");
    if (prefillTags) {
      try {
        // Tags are passed as comma-separated list
        const decodedTags = decodeURIComponent(prefillTags);
        // If it's a comma-separated list, use first few as title suggestion
        const tagList = decodedTags.split(",").map((t) => t.trim()).filter(Boolean);
        if (tagList.length > 0) {
          // Pre-populate the tags as result for user to modify/regenerate
          setTags(tagList);
          setCopyComma(tagList.join(", "));
          setCopyLines(tagList.join("\n"));
          setNotes([
            "These tags were imported from Tag Finder. You can modify them or generate new ones based on your video content.",
          ]);
        }
      } catch {
        // Ignore decode errors
      }
    }
  }, [searchParams]);

  // Fetch usage on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchUsage() {
      try {
        const data = await apiFetchJson<UsageInfo>(
          "/api/youtube-tag-generator/usage",
          { cache: "no-store" }
        );
        if (!cancelled) {
          setUsage(data);
        }
      } catch (err) {
        console.error("Failed to fetch usage:", err);
        if (!cancelled) {
          setUsage(null);
        }
      } finally {
        if (!cancelled) {
          setUsageLoading(false);
        }
      }
    }

    fetchUsage();

    return () => {
      cancelled = true;
    };
  }, []);

  // Validate form
  const validate = useCallback(() => {
    const newErrors: typeof errors = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = "Title is required";
    } else if (trimmedTitle.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (trimmedTitle.length > 120) {
      newErrors.title = "Title must be at most 120 characters";
    }

    if (description.length > 4000) {
      newErrors.description = "Description must be at most 4000 characters";
    }

    if (referenceUrl.trim()) {
      // Basic URL validation
      try {
        const url = new URL(referenceUrl.trim());
        const hostname = url.hostname.toLowerCase();
        const isYouTube =
          hostname === "youtube.com" ||
          hostname === "www.youtube.com" ||
          hostname === "m.youtube.com" ||
          hostname === "youtu.be";
        if (!isYouTube) {
          newErrors.referenceUrl = "Must be a YouTube URL";
        }
      } catch {
        newErrors.referenceUrl = "Invalid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, description, referenceUrl]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      // Check if limit reached
      if (usage && usage.remaining <= 0) {
        toast("Daily limit reached. Please upgrade or wait for reset.", "error");
        return;
      }

      setLoading(true);
      setTags([]);
      setNotes([]);

      try {
        const data = await apiFetchJson<GenerateResponse>(
          "/api/youtube-tag-generator",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim(),
              description: description.trim() || undefined,
              referenceYoutubeUrl: referenceUrl.trim() || undefined,
            }),
          }
        );

        setTags(data.tags);
        setNotes(data.notes);
        setCopyComma(data.copyComma);
        setCopyLines(data.copyLines);

        // Update usage
        setUsage((prev) =>
          prev
            ? {
                ...prev,
                remaining: data.remaining,
                used: prev.limit - data.remaining,
                resetAt: data.resetAt,
              }
            : null
        );

        toast(`Generated ${data.tags.length} tags!`, "success");
      } catch (err) {
        console.error("Generate error:", err);

        if (isApiClientError(err)) {
          if (err.status === 429 || err.code === "LIMIT_REACHED") {
            // Update usage to show 0 remaining
            const details = err.details as Record<string, unknown>;
            if (details?.resetAt) {
              setUsage((prev) =>
                prev
                  ? {
                      ...prev,
                      remaining: 0,
                      used: prev.limit,
                      resetAt: details.resetAt as string,
                    }
                  : null
              );
            }
            toast("Daily limit reached. Please upgrade or wait for reset.", "error");
            return;
          }

          if (err.status === 401) {
            toast("Session expired. Please log in again.", "error");
            return;
          }

          toast(err.message || "Failed to generate tags", "error");
          return;
        }

        toast("Failed to generate tags. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    },
    [title, description, referenceUrl, usage, validate, toast]
  );

  // Copy to clipboard
  const handleCopy = useCallback(
    async (text: string, format: "comma" | "lines") => {
      try {
        await navigator.clipboard.writeText(text);
        toast(
          format === "comma"
            ? "Copied tags (comma separated)"
            : "Copied tags (one per line)",
          "success"
        );
      } catch {
        toast("Failed to copy to clipboard", "error");
      }
    },
    [toast]
  );

  // Format reset time
  const formatResetTime = (resetAt: string) => {
    const date = new Date(resetAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffHours <= 0) return "soon";
    if (diffHours === 1) return "in 1 hour";
    return `in ${diffHours} hours`;
  };

  const isLimitReached = usage !== null && usage.remaining <= 0;

  return (
    <div role="tabpanel" id="panel-generator" aria-labelledby="tab-generator">
      {/* Header */}
      <div className={s.header}>
        <h1 className={s.title}>YouTube Tag Generator</h1>
        <p className={s.subtitle}>
          Generate optimized tags to improve your video&apos;s discoverability
        </p>
      </div>

      {/* Info Box */}
      <div className={s.infoBox}>
        <div className={s.infoIcon}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <div className={s.infoContent}>
          <p className={s.infoTitle}>What YouTube tags do (and don&apos;t do)</p>
          <ul className={s.infoList}>
            <li>
              Tags help YouTube understand your video content and can improve
              discoverability for misspelled searches
            </li>
            <li>
              Tags have a <strong>minor impact</strong> on rankings compared to
              title, description, and watch time
            </li>
            <li>
              Focus on your most important keywords in the title and description
              first
            </li>
          </ul>
          <p className={s.infoWarning}>
            <strong>⚠️ Warning:</strong> Never use misleading or spam tags.
            YouTube may penalize videos with irrelevant tags.
          </p>
        </div>
      </div>

      {/* Usage Display */}
      {!usageLoading && usage && (
        <div className={s.usageBox}>
          <div className={s.usageInfo}>
            <span className={s.usageLabel}>
              {usage.isPro ? "Pro" : "Free"} Plan
            </span>
            <span className={s.usageCount}>
              {usage.remaining} / {usage.limit} generations remaining
            </span>
            {usage.remaining < usage.limit && (
              <span className={s.usageReset}>
                Resets {formatResetTime(usage.resetAt)}
              </span>
            )}
          </div>
          {!usage.isPro && (
            <Link href="/api/integrations/stripe/checkout" className={s.upgradeBtn}>
              Upgrade to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/
              {SUBSCRIPTION.PRO_INTERVAL}
            </Link>
          )}
        </div>
      )}

      {/* Limit Reached Banner */}
      {isLimitReached && (
        <div className={s.limitBanner}>
          <div className={s.limitIcon}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className={s.limitContent}>
            <p className={s.limitTitle}>Daily Limit Reached</p>
            <p className={s.limitText}>
              You&apos;ve used all {usage?.limit} free tag generations for today.
              {usage?.resetAt && ` Resets ${formatResetTime(usage.resetAt)}.`}
            </p>
          </div>
          {!usage?.isPro && (
            <Link href="/api/integrations/stripe/checkout" className={s.limitUpgradeBtn}>
              Upgrade to Pro
            </Link>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className={s.form}>
        {/* Title Input */}
        <div className={s.field}>
          <label htmlFor="title" className={s.label}>
            Video Title <span className={s.required}>*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={validate}
            placeholder="Enter your video title"
            className={`${s.input} ${errors.title ? s.inputError : ""}`}
            maxLength={120}
            disabled={loading || isLimitReached}
          />
          {errors.title && <p className={s.errorText}>{errors.title}</p>}
          <p className={s.fieldHint}>{title.length}/120 characters</p>
        </div>

        {/* Description Input */}
        <div className={s.field}>
          <label htmlFor="description" className={s.label}>
            Video Description <span className={s.optional}>(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={validate}
            placeholder="Enter your video description for more accurate tag suggestions"
            className={`${s.textarea} ${errors.description ? s.inputError : ""}`}
            rows={4}
            maxLength={4000}
            disabled={loading || isLimitReached}
          />
          {errors.description && (
            <p className={s.errorText}>{errors.description}</p>
          )}
          <p className={s.fieldHint}>{description.length}/4000 characters</p>
        </div>

        {/* Reference URL Input */}
        <div className={s.field}>
          <label htmlFor="referenceUrl" className={s.label}>
            Reference YouTube Video <span className={s.optional}>(optional)</span>
          </label>
          <input
            id="referenceUrl"
            type="url"
            value={referenceUrl}
            onChange={(e) => setReferenceUrl(e.target.value)}
            onBlur={validate}
            placeholder="https://youtube.com/watch?v=..."
            className={`${s.input} ${errors.referenceUrl ? s.inputError : ""}`}
            disabled={loading || isLimitReached}
          />
          {errors.referenceUrl && (
            <p className={s.errorText}>{errors.referenceUrl}</p>
          )}
          <p className={s.fieldHint}>
            We&apos;ll analyze this video&apos;s tags for inspiration
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={s.submitBtn}
          disabled={loading || isLimitReached || !title.trim()}
        >
          {loading ? (
            <>
              <span className={s.spinner} />
              Generating...
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              Generate Tags
            </>
          )}
        </button>
      </form>

      {/* Cross-link to Finder */}
      <Link href="/tags/extractor" className={s.crossLinkCta}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        Find competitor tags from a YouTube video
      </Link>

      {/* Results */}
      {tags.length > 0 && (
        <div className={s.results} style={{ marginTop: "var(--space-lg)" }}>
          <div className={s.resultsHeader}>
            <div>
              <h2 className={s.resultsTitle}>Generated Tags ({tags.length})</h2>
            </div>
            <div className={s.copyButtons}>
              <button
                type="button"
                className={s.copyBtn}
                onClick={() => handleCopy(copyComma, "comma")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy (comma separated)
              </button>
              <button
                type="button"
                className={s.copyBtn}
                onClick={() => handleCopy(copyLines, "lines")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy (one per line)
              </button>
            </div>
          </div>

          {/* Tags Grid */}
          <div className={s.tagsGrid}>
            {tags.map((tag, index) => (
              <span key={index} className={s.tag}>
                {tag}
              </span>
            ))}
          </div>

          {/* Strategy Notes */}
          {notes.length > 0 && (
            <div className={s.notesSection}>
              <h3 className={s.notesTitle}>Strategy Notes</h3>
              <ul className={s.notesList}>
                {notes.map((note, index) => (
                  <li key={index} className={s.noteItem}>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
