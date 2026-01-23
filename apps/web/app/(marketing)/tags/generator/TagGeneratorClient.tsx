"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import s from "../tags.module.css";
import { useToast } from "@/components/ui/Toast";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";

// ============================================
// TYPES
// ============================================

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

  // Result state
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [copyComma, setCopyComma] = useState("");
  const [copyLines, setCopyLines] = useState("");

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
        const decodedTags = decodeURIComponent(prefillTags);
        const tagList = decodedTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        if (tagList.length > 0) {
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

        toast(`Generated ${data.tags.length} tags!`, "success");
      } catch (err) {
        console.error("Generate error:", err);

        if (isApiClientError(err)) {
          if (err.status === 429 || err.code === "LIMIT_REACHED") {
            toast(
              err.message || "You've reached the daily limit. Sign up for more.",
              "error"
            );
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
    [title, description, referenceUrl, validate, toast]
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

  return (
    <div role="tabpanel" id="panel-generator" aria-labelledby="tab-generator">
      {/* Header */}
      <header className={s.header}>
        <h1 className={s.title}>YouTube Tag Generator</h1>
        <p className={s.subtitle}>
          Generate optimized tags to improve your video&apos;s discoverability
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className={s.formCard}>
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
            disabled={loading}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : "title-hint"}
          />
          {errors.title ? (
            <p id="title-error" className={s.errorText}>
              {errors.title}
            </p>
          ) : (
            <p id="title-hint" className={s.fieldHint}>
              {title.length}/120 characters
            </p>
          )}
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
            placeholder="Add your video description for more accurate tag suggestions"
            className={`${s.textarea} ${errors.description ? s.inputError : ""}`}
            rows={4}
            maxLength={4000}
            disabled={loading}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "desc-error" : "desc-hint"
            }
          />
          {errors.description ? (
            <p id="desc-error" className={s.errorText}>
              {errors.description}
            </p>
          ) : (
            <p id="desc-hint" className={s.fieldHint}>
              {description.length}/4000 characters
            </p>
          )}
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
            disabled={loading}
            aria-invalid={!!errors.referenceUrl}
            aria-describedby={errors.referenceUrl ? "ref-error" : "ref-hint"}
          />
          {errors.referenceUrl ? (
            <p id="ref-error" className={s.errorText}>
              {errors.referenceUrl}
            </p>
          ) : (
            <p id="ref-hint" className={s.fieldHint}>
              We&apos;ll analyze this video&apos;s tags for inspiration
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={s.submitBtn}
          disabled={loading || !title.trim()}
        >
          {loading ? (
            <>
              <span className={s.spinner} aria-hidden="true" />
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
                aria-hidden="true"
              >
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              Generate Tags
            </>
          )}
        </button>
      </form>


      {/* Results */}
      {tags.length > 0 && (
        <div className={s.resultsCard}>
          <div className={s.resultsHeader}>
            <h2 className={s.resultsTitle}>Generated Tags ({tags.length})</h2>
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
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy (comma)
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
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy (lines)
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

      {/* SEO Content Section */}
      <section className={s.seoSection}>
        <h2 className={s.seoTitle}>Free YouTube Tag Generator for Creators</h2>
        <p className={s.seoText}>
          Our <strong>YouTube tag generator</strong> helps creators optimize their video 
          metadata in seconds. Simply enter your video title and description, and get 
          AI-powered tag suggestions tailored to your content and niche.
        </p>
        <p className={s.seoText}>
          YouTube tags are keywords that help the algorithm understand what your video 
          is about. While tags have less impact than titles and descriptions, they still 
          play a role in helping YouTube categorize your content and surface it for 
          relevant searches—especially for commonly misspelled terms.
        </p>
        <h3 className={s.seoSubtitle}>How to Use YouTube Tags Effectively</h3>
        <ul className={s.seoList}>
          <li>
            <strong>Start with your primary keyword</strong> — Your main topic should 
            be your first tag to signal the core subject of your video.
          </li>
          <li>
            <strong>Include variations and long-tail keywords</strong> — Add related 
            phrases and specific variations that viewers might search for.
          </li>
          <li>
            <strong>Keep tags relevant</strong> — Only use tags that accurately 
            describe your content. Misleading tags can hurt your channel.
          </li>
          <li>
            <strong>Use 5-15 focused tags</strong> — Quality matters more than 
            quantity. YouTube allows up to 500 characters, but fewer relevant tags 
            outperform a wall of keywords.
          </li>
        </ul>
        <p className={s.seoText}>
          This free tag generator analyzes your input and suggests optimized tags 
          based on your topic, helping you save time while improving your video&apos;s 
          discoverability on YouTube search and suggested videos.
        </p>
      </section>
    </div>
  );
}
