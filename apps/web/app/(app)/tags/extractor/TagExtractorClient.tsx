"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import s from "../tags.module.css";
import { useToast } from "@/components/ui/Toast";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";

// ============================================
// TYPES
// ============================================

type ExtractResponse = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  tags: string[];
  hasTags: boolean;
};

// ============================================
// COMPONENT
// ============================================

export function TagExtractorClient() {
  const { toast } = useToast();
  const router = useRouter();

  // Form state
  const [url, setUrl] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<ExtractResponse | null>(null);

  // Validate URL
  const validateUrl = useCallback((inputUrl: string): string | null => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      return "Please enter a YouTube URL";
    }

    try {
      const parsed = new URL(trimmed);
      const hostname = parsed.hostname.toLowerCase();
      const isYouTube =
        hostname === "youtube.com" ||
        hostname === "www.youtube.com" ||
        hostname === "m.youtube.com" ||
        hostname === "youtu.be";

      if (!isYouTube) {
        return "Please enter a valid YouTube URL";
      }
    } catch {
      return "Please enter a valid URL";
    }

    return null;
  }, []);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationError = validateUrl(url);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setLoading(true);
      setResult(null);

      try {
        const data = await apiFetchJson<ExtractResponse>("/api/tags/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        setResult(data);

        if (data.hasTags) {
          toast(`Found ${data.tags.length} tags!`, "success");
        }
      } catch (err) {
        console.error("Extract error:", err);

        if (isApiClientError(err)) {
          if (err.status === 401) {
            toast("Session expired. Please log in again.", "error");
            return;
          }
          setError(err.message || "Failed to extract tags");
          return;
        }

        setError("Failed to extract tags. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [url, validateUrl, toast]
  );

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!result?.tags.length) return;

    try {
      await navigator.clipboard.writeText(result.tags.join(", "));
      toast("Copied all tags to clipboard", "success");
    } catch {
      toast("Failed to copy to clipboard", "error");
    }
  }, [result, toast]);

  // Navigate to generator with prefilled tags
  const handleGenerateFromTags = useCallback(() => {
    if (!result?.tags.length) return;

    // Encode tags as comma-separated list
    const prefill = encodeURIComponent(result.tags.slice(0, 30).join(","));
    router.push(`/tags/generator?prefill=${prefill}`);
  }, [result, router]);

  return (
    <div role="tabpanel" id="panel-extractor" aria-labelledby="tab-extractor">
      {/* Header */}
      <div className={s.header}>
        <h1 className={s.title}>YouTube Tag Finder</h1>
        <p className={s.subtitle}>
          Paste a YouTube video URL to discover the tags used by that video
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
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div className={s.infoContent}>
          <p className={s.infoTitle}>Competitive research made easy</p>
          <ul className={s.infoList}>
            <li>
              See exactly which tags successful videos in your niche are using
            </li>
            <li>
              Discover keyword opportunities you might have missed
            </li>
            <li>
              Use insights to improve your own video SEO strategy
            </li>
          </ul>
          <p className={s.infoWarning}>
            <strong>Note:</strong> Some videos may not have tags, or tags may be
            hidden by the creator.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.field}>
          <label htmlFor="videoUrl" className={s.label}>
            YouTube Video URL <span className={s.required}>*</span>
          </label>
          <input
            id="videoUrl"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
            className={`${s.input} ${error ? s.inputError : ""}`}
            disabled={loading}
            autoComplete="off"
          />
          {error && <p className={s.errorText}>{error}</p>}
          <p className={s.fieldHint}>
            Supports youtube.com, youtu.be, and YouTube Shorts URLs
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={s.submitBtn}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <span className={s.spinner} />
              Finding tags...
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
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Find Tags
            </>
          )}
        </button>
      </form>

      {/* Cross-link to Generator */}
      <Link href="/tags/generator" className={s.crossLinkCta}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
          <circle cx="12" cy="12" r="4" />
        </svg>
        Generate custom tags for your video
      </Link>

      {/* Results */}
      {result && (
        <div className={s.results} style={{ marginTop: "var(--space-lg)" }}>
          {/* Video Info */}
          <div className={s.videoInfo}>
            {result.thumbnailUrl && (
              <Image
                src={result.thumbnailUrl}
                alt={result.title}
                className={s.videoThumb}
                width={160}
                height={90}
                unoptimized
              />
            )}
            <div className={s.videoMeta}>
              <h2 className={s.videoTitle}>{result.title}</h2>
              <p className={s.videoChannel}>{result.channelTitle}</p>
            </div>
          </div>

          {result.hasTags ? (
            <>
              <div className={s.resultsHeader}>
                <div>
                  <h3 className={s.resultsTitle}>
                    Tags Found ({result.tags.length})
                  </h3>
                </div>
                <div className={s.copyButtons}>
                  <button
                    type="button"
                    className={s.copyBtn}
                    onClick={handleCopy}
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
                    Copy all tags
                  </button>
                </div>
              </div>

              {/* Tags Grid */}
              <div className={s.tagsGrid}>
                {result.tags.map((tag, index) => (
                  <span key={index} className={s.tag}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Generate CTA */}
              <div className={s.notesSection}>
                <button
                  type="button"
                  onClick={handleGenerateFromTags}
                  className={s.crossLinkCta}
                  style={{ marginTop: 0 }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  Generate tags based on these
                </button>
              </div>
            </>
          ) : (
            <div className={s.noTagsState}>
              <svg
                className={s.noTagsIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <h3 className={s.noTagsTitle}>No tags found</h3>
              <p className={s.noTagsText}>
                This video doesn&apos;t have any tags, or the creator has chosen
                not to share them publicly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* FAQ Section for SEO */}
      <section style={{ marginTop: "var(--space-xl, 3rem)" }}>
        <h2 className={s.infoTitle} style={{ marginBottom: "var(--space-4)" }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <details className={s.infoBox} style={{ cursor: "pointer" }}>
            <summary className={s.infoTitle} style={{ marginBottom: 0 }}>
              How do I find tags on a YouTube video?
            </summary>
            <p style={{ marginTop: "var(--space-3)", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              YouTube doesn&apos;t publicly display video tags in the interface. However, you
              can use our Tag Finder tool to extract tags from any YouTube video by simply
              pasting the video URL. We use the YouTube Data API to retrieve the tags that
              creators have added to their videos.
            </p>
          </details>

          <details className={s.infoBox} style={{ cursor: "pointer" }}>
            <summary className={s.infoTitle} style={{ marginBottom: 0 }}>
              Does YouTube show tags publicly?
            </summary>
            <p style={{ marginTop: "var(--space-3)", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              No, YouTube removed public tag visibility in 2018. Tags are no longer visible
              on the video page or in the page source. To see a video&apos;s tags, you need to
              use external tools like our Tag Finder that access the YouTube Data API.
            </p>
          </details>

          <details className={s.infoBox} style={{ cursor: "pointer" }}>
            <summary className={s.infoTitle} style={{ marginBottom: 0 }}>
              Can I use competitor tags on my videos?
            </summary>
            <p style={{ marginTop: "var(--space-3)", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Yes, you can use similar tags to your competitors, but only if they&apos;re
              genuinely relevant to your content. Never copy tags that don&apos;t accurately
              describe your video—YouTube may penalize misleading tags. Use competitor tags
              as inspiration to identify keywords you might have missed.
            </p>
          </details>

          <details className={s.infoBox} style={{ cursor: "pointer" }}>
            <summary className={s.infoTitle} style={{ marginBottom: 0 }}>
              Why do tags matter on YouTube?
            </summary>
            <p style={{ marginTop: "var(--space-3)", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              YouTube tags help the algorithm understand your video&apos;s content and can
              improve discoverability, especially for misspelled searches. However, tags
              have a minor impact compared to title, description, and watch time. Focus on
              those first, then use tags to reinforce your main keywords.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
