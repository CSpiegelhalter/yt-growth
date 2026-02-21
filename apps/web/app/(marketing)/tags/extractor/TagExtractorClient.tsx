"use client";

import { useState, useCallback } from "react";
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
    if (!result?.tags.length) {return;}

    try {
      await navigator.clipboard.writeText(result.tags.join(", "));
      toast("Copied all tags to clipboard", "success");
    } catch {
      toast("Failed to copy to clipboard", "error");
    }
  }, [result, toast]);

  return (
    <div role="tabpanel" id="panel-extractor" aria-labelledby="tab-extractor">
      {/* Header */}
      <header className={s.header}>
        <h1 className={s.title}>YouTube Tag Finder</h1>
        <p className={s.subtitle}>
          Paste a YouTube video URL to discover the tags used by that video
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className={s.formCard}>
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
            aria-invalid={!!error}
            aria-describedby={error ? "url-error" : "url-hint"}
          />
          {error ? (
            <p id="url-error" className={s.errorText}>
              {error}
            </p>
          ) : (
            <p id="url-hint" className={s.fieldHint}>
              Supports youtube.com, youtu.be, and YouTube Shorts URLs
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={s.submitBtn}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <span className={s.spinner} aria-hidden="true" />
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
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Find Tags
            </>
          )}
        </button>
      </form>


      {/* Results */}
      {result && (
        <div className={s.resultsCard}>
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
                <h3 className={s.resultsTitle}>
                  Tags Found ({result.tags.length})
                </h3>
                <div className={s.copyButtons}>
                  <button type="button" className={s.copyBtn} onClick={handleCopy}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
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

            </>
          ) : (
            <div className={s.noTagsState}>
              <svg
                className={s.noTagsIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
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

      {/* SEO Content Section - Competitive Research */}
      <section className={s.seoSection}>
        <h2 className={s.seoTitle}>YouTube Tag Finder: Competitive Research Made Easy</h2>
        <p className={s.seoText}>
          Our <strong>YouTube tag finder</strong> (also known as a tag extractor) lets you 
          discover the exact tags that any YouTube video is using. Simply paste a video URL 
          and instantly see the keywords that creators in your niche are targeting.
        </p>
        <p className={s.seoText}>
          Since YouTube removed public tag visibility in 2018, tags are no longer visible 
          on video pages or in page source code. Our tool uses the official YouTube Data API 
          to retrieve this hidden metadata, giving you insights that aren&apos;t available 
          through normal browsing.
        </p>
        
        <h3 className={s.seoSubtitle}>Why Analyze Competitor Tags?</h3>
        <ul className={s.seoList}>
          <li>
            <strong>Discover keyword opportunities</strong> — Find relevant search terms 
            and phrases you might have missed in your own tag strategy.
          </li>
          <li>
            <strong>Understand niche terminology</strong> — See how successful creators 
            describe content in your space and the specific language they use.
          </li>
          <li>
            <strong>Identify content gaps</strong> — Spot topics and sub-niches that 
            competitors are targeting that you could explore.
          </li>
          <li>
            <strong>Improve your video SEO</strong> — Use competitor insights to 
            optimize your own tags and improve discoverability.
          </li>
        </ul>

        <h3 className={s.seoSubtitle}>How to Use This Tool Effectively</h3>
        <p className={s.seoText}>
          Start by finding top-performing videos in your niche—look for videos with high 
          view counts relative to the channel size. Extract their tags to see what keywords 
          they&apos;re targeting. Use these insights as inspiration, but only apply tags 
          that genuinely describe your content. Copying irrelevant tags can hurt your 
          channel&apos;s performance.
        </p>
      </section>

      {/* FAQ Section for SEO */}
      <section className={s.faqSection}>
        <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
        <div className={s.faqList}>
          <details className={s.faqItem}>
            <summary>How do I find tags on a YouTube video?</summary>
            <p className={s.faqAnswer}>
              YouTube doesn&apos;t publicly display video tags in the interface.
              However, you can use our Tag Finder tool to extract tags from any
              YouTube video by simply pasting the video URL. We use the YouTube
              Data API to retrieve the tags that creators have added to their
              videos.
            </p>
          </details>

          <details className={s.faqItem}>
            <summary>Does YouTube show tags publicly?</summary>
            <p className={s.faqAnswer}>
              No, YouTube removed public tag visibility in 2018. Tags are no
              longer visible on the video page or in the page source. To see a
              video&apos;s tags, you need to use external tools like our Tag
              Finder that access the YouTube Data API.
            </p>
          </details>

          <details className={s.faqItem}>
            <summary>Can I use competitor tags on my videos?</summary>
            <p className={s.faqAnswer}>
              Yes, you can use similar tags to your competitors, but only if
              they&apos;re genuinely relevant to your content. Never copy tags
              that don&apos;t accurately describe your video—YouTube may
              penalize misleading tags. Use competitor tags as inspiration to
              identify keywords you might have missed.
            </p>
          </details>

          <details className={s.faqItem}>
            <summary>Why do tags matter on YouTube?</summary>
            <p className={s.faqAnswer}>
              YouTube tags help the algorithm understand your video&apos;s
              content and can improve discoverability, especially for misspelled
              searches. However, tags have a minor impact compared to title,
              description, and watch time. Focus on those first, then use tags
              to reinforce your main keywords.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
