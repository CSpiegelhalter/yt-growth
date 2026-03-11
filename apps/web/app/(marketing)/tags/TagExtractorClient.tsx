"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

import { useToast } from "@/components/ui/Toast";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import { validateYouTubeUrl } from "@/lib/shared/youtube-url";

import { SeoAccordion } from "./SeoAccordion";
import s from "./tags.module.css";
import { TagsInput } from "./TagsInput";

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

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copyLabel, setCopyLabel] = useState("Copy Selected Tags");

  const selectedCount = useMemo(() => {
    if (!result?.tags.length) { return 0; }
    return result.tags.filter((t) => selected.has(t)).length;
  }, [result, selected]);

  const validateUrl = useCallback(
    (inputUrl: string): string | null => validateYouTubeUrl(inputUrl),
    [],
  );

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
        setSelected(new Set(data.tags));
        setCopyLabel("Copy Selected Tags");

        if (data.hasTags) {
          toast(`Found ${data.tags.length} tags!`, "success");
        }
      } catch (error_) {
        console.error("Extract error:", error_);

        if (isApiClientError(error_)) {
          setError(error_.message || "Failed to extract tags");
          return;
        }

        setError("Failed to extract tags. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [url, validateUrl, toast],
  );

  const toggleTag = useCallback((tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const action = next.has(tag) ? "delete" : "add";
      next[action](tag);
      return next;
    });
  }, []);

  const handleCopy = useCallback(async () => {
    if (!result?.tags.length) { return; }
    const text = result.tags.filter((t) => selected.has(t)).join(", ");
    if (!text) {
      toast("No tags selected", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy Selected Tags"), 2000);
    } catch {
      toast("Failed to copy to clipboard", "error");
    }
  }, [result, selected, toast]);

  const handleSetUrl = useCallback((value: string) => {
    setUrl(value);
    setError(null);
  }, []);

  return (
    <div>
      {/* Page Header */}
      <header className={s.pageHeader}>
        <p className={s.pageHeading}>YouTube Tags</p>
        <p className={s.pageDescription}>
          Tags are no longer public on video pages or in page source code. Our tool
          uses the official YouTube Data API to retrieve this hidden metadata, giving
          you insights that aren&apos;t available on the site.
        </p>
      </header>

      <TagsInput
        url={url}
        setUrl={handleSetUrl}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
      />

      {/* Results area — min-height reserves space to reduce layout shift */}
      <div className={s.resultsArea}>
        {result && (
          <div className={s.resultsCard}>
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
                  <p className={s.tagHint}>Click tags to deselect</p>
                </div>

                <div className={s.tagPills}>
                  {result.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`${s.tagPill} ${selected.has(tag) ? s.tagPillSelected : ""}`}
                      onClick={() => toggleTag(tag)}
                      aria-pressed={selected.has(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={s.copySelectedBtn}
                  onClick={handleCopy}
                  disabled={selectedCount === 0}
                >
                  {copyLabel} ({selectedCount})
                </button>
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
      </div>

      {/* Accordion Dropdowns */}
      <section className={s.accordionSection}>
        <div className={s.accordionList}>
          <SeoAccordion title="Why Analyze Competitor Tags?">
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
          </SeoAccordion>

          <SeoAccordion title="How to Use This Tool Effectively">
            <p className={s.seoText}>
              Start by finding top-performing videos in your niche—look for videos with high
              view counts relative to the channel size. Extract their tags to see what keywords
              they&apos;re targeting. Use these insights as inspiration, but only apply tags
              that genuinely describe your content. Copying irrelevant tags can hurt your
              channel&apos;s performance.
            </p>
          </SeoAccordion>

          <SeoAccordion title="How do I find tags on a YouTube video?">
            <p className={s.seoAccordionBody}>
              YouTube doesn&apos;t publicly display video tags in the interface.
              However, you can use our Tag Finder tool to extract tags from any
              YouTube video by simply pasting the video URL. We use the YouTube
              Data API to retrieve the tags that creators have added to their
              videos.
            </p>
          </SeoAccordion>

          <SeoAccordion title="Does YouTube show tags publicly?">
            <p className={s.seoAccordionBody}>
              No, YouTube removed public tag visibility in 2018. Tags are no
              longer visible on the video page or in the page source. To see a
              video&apos;s tags, you need to use external tools like our Tag
              Finder that access the YouTube Data API.
            </p>
          </SeoAccordion>

          <SeoAccordion title="Can I use competitor tags on my videos?">
            <p className={s.seoAccordionBody}>
              Yes, you can use similar tags to your competitors, but only if
              they&apos;re genuinely relevant to your content. Never copy tags
              that don&apos;t accurately describe your video—YouTube may
              penalize misleading tags. Use competitor tags as inspiration to
              identify keywords you might have missed.
            </p>
          </SeoAccordion>

          <SeoAccordion title="Why do tags matter on YouTube?">
            <p className={s.seoAccordionBody}>
              YouTube tags help the algorithm understand your video&apos;s
              content and can improve discoverability, especially for misspelled
              searches. However, tags have a minor impact compared to title,
              description, and watch time. Focus on those first, then use tags
              to reinforce your main keywords.
            </p>
          </SeoAccordion>
        </div>
      </section>
    </div>
  );
}
