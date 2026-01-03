"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import s from "./style.module.css";
import ThumbnailEditor from "@/components/thumbnails/ThumbnailEditor";
import { useToast } from "@/components/ui/Toast";
import type {
  ThumbnailStyle,
  ThumbnailJobResponse,
  ThumbnailVariantResponse,
} from "@/lib/thumbnails/types";

type Props = {
  initialUser: {
    id: number;
    email: string;
    name: string | null;
    subscription?: {
      isActive: boolean;
      plan: string;
    };
  };
};

const STYLES: ThumbnailStyle[] = ["Bold", "Minimal", "Neon", "Clean", "Dramatic"];

export default function ThumbnailsClient({ initialUser }: Props) {
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState<ThumbnailStyle>("Bold");
  const [aiBase, setAiBase] = useState(true);
  const [count, setCount] = useState(12);

  // Job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ThumbnailJobResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor modal state
  const [selectedVariant, setSelectedVariant] = useState<ThumbnailVariantResponse | null>(null);
  const [showSafeZones, setShowSafeZones] = useState(false);

  // Poll for job updates
  useEffect(() => {
    if (!jobId) return;
    if (job?.status === "completed" || job?.status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/thumbnails/jobs/${jobId}`);
        if (res.ok) {
          const data: ThumbnailJobResponse = await res.json();
          setJob(data);

          if (data.status === "completed" || data.status === "failed") {
            clearInterval(interval);
            if (data.status === "failed") {
              setError(data.error ?? "Job failed");
            }
          }
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, job?.status]);

  // Create and run job
  const handleGenerate = useCallback(async () => {
    if (!title.trim()) {
      toast("Please enter a video title", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setJob(null);
    setJobId(null);

    try {
      // Create job
      const createRes = await fetch("/api/thumbnails/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          topic: topic.trim() || undefined,
          audience: audience.trim() || undefined,
          style,
          count,
          aiBase,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || data.message || "Failed to create job");
      }

      const { jobId: newJobId } = await createRes.json();
      setJobId(newJobId);

      // Set initial job state
      setJob({
        jobId: newJobId,
        status: "queued",
        progress: 0,
        variants: [],
      });

      // Trigger job run
      const runRes = await fetch(`/api/thumbnails/jobs/${newJobId}/run`, {
        method: "POST",
      });

      if (!runRes.ok) {
        const data = await runRes.json();
        console.warn("Run error (will retry):", data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
      toast("Failed to start generation", "error");
    } finally {
      setLoading(false);
    }
  }, [title, topic, audience, style, count, aiBase, toast]);

  // Handle variant click
  const handleVariantClick = useCallback((variant: ThumbnailVariantResponse) => {
    setSelectedVariant(variant);
  }, []);

  // Handle variant update from editor
  const handleVariantUpdate = useCallback((updated: ThumbnailVariantResponse) => {
    setJob((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: prev.variants.map((v) =>
          v.variantId === updated.variantId ? updated : v
        ),
      };
    });
    setSelectedVariant(updated);
  }, []);

  const isGenerating = Boolean(
    loading ||
    (job && job.status !== "completed" && job.status !== "failed")
  );

  return (
    <main className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <h1 className={s.title}>Thumbnail Studio</h1>
        <p className={s.subtitle}>
          Create concept-driven thumbnails with visual stories, not just text on backgrounds.
          Each variant uses proven patterns like Before/After, Mistake X, VS, and more.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className={s.errorAlert}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Input Form */}
      <div className={s.formCard}>
        <div className={s.formGrid}>
          {/* Title (required) */}
          <div className={`${s.formGroup} ${s.fullWidth}`}>
            <label className={s.label} htmlFor="title">
              Video Title *
            </label>
            <input
              id="title"
              type="text"
              className={s.input}
              placeholder="e.g., 10 Mistakes That Are Killing Your YouTube Growth"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={isGenerating}
            />
            <span className={s.inputHint}>
              We&apos;ll transform this into short, punchy hook text (2-5 words)
            </span>
          </div>

          {/* Topic */}
          <div className={s.formGroup}>
            <label className={s.label} htmlFor="topic">
              Topic / Niche
            </label>
            <input
              id="topic"
              type="text"
              className={s.input}
              placeholder="e.g., Gaming, Cooking, Tech"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={100}
              disabled={isGenerating}
            />
          </div>

          {/* Audience */}
          <div className={s.formGroup}>
            <label className={s.label} htmlFor="audience">
              Target Audience
            </label>
            <input
              id="audience"
              type="text"
              className={s.input}
              placeholder="e.g., Beginners, Professionals"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              maxLength={100}
              disabled={isGenerating}
            />
          </div>

          {/* Style */}
          <div className={s.formGroup}>
            <label className={s.label} htmlFor="style">
              Style
            </label>
            <select
              id="style"
              className={s.select}
              value={style}
              onChange={(e) => setStyle(e.target.value as ThumbnailStyle)}
              disabled={isGenerating}
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Count */}
          <div className={s.formGroup}>
            <label className={s.label} htmlFor="count">
              Number of Variants
            </label>
            <select
              id="count"
              className={s.select}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={isGenerating}
            >
              <option value={6}>6 variants</option>
              <option value={12}>12 variants</option>
            </select>
          </div>

          {/* AI Base Toggle */}
          <div className={`${s.formGroup} ${s.fullWidth}`}>
            <div className={s.toggleGroup}>
              <button
                type="button"
                className={`${s.toggle} ${aiBase ? s.active : ""}`}
                onClick={() => setAiBase(!aiBase)}
                disabled={isGenerating}
              >
                <span className={s.toggleKnob} />
              </button>
              <span className={s.toggleLabel}>
                Generate AI scene images (recommended for visual story thumbnails)
              </span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          className={s.generateBtn}
          onClick={handleGenerate}
          disabled={isGenerating || !title.trim()}
        >
          {isGenerating ? (
            <>
              <span className={s.spinner} />
              Generating...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Generate {count} Concept Thumbnails
            </>
          )}
        </button>
      </div>

      {/* Progress Section */}
      {job && job.status !== "completed" && job.status !== "failed" && (
        <div className={s.progressSection}>
          <div className={s.progressCard}>
            <div className={s.progressHeader}>
              <span className={s.progressTitle}>Creating Visual Stories</span>
              <span className={s.progressPercent}>{job.progress}%</span>
            </div>
            <div className={s.progressBar}>
              <div
                className={s.progressFill}
                style={{ width: `${job.progress}%` }}
              />
            </div>
            <div className={s.progressPhase}>{job.phase || "Starting..."}</div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {job && job.variants.length > 0 && (
        <div className={s.variantsSection}>
          <div className={s.variantsHeader}>
            <h2 className={s.sectionTitle}>
              {job.status === "completed"
                ? `${job.variants.length} Concept Thumbnails`
                : `Generating... (${job.variants.length} ready)`}
            </h2>
            <div className={s.toggleGroup}>
              <button
                type="button"
                className={`${s.toggle} ${s.small} ${showSafeZones ? s.active : ""}`}
                onClick={() => setShowSafeZones(!showSafeZones)}
              >
                <span className={s.toggleKnob} />
              </button>
              <span className={s.toggleLabelSmall}>Safe zones</span>
            </div>
          </div>

          <div className={s.variantsGrid}>
            {job.variants.map((variant) => (
              <div
                key={variant.variantId}
                className={s.variantCard}
                onClick={() => handleVariantClick(variant)}
              >
                <div className={s.variantThumb}>
                  {variant.previewUrl ? (
                    <Image
                      src={variant.previewUrl}
                      alt={variant.spec.plan?.hookText || "Thumbnail"}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className={s.variantPlaceholder} />
                  )}
                  {showSafeZones && (
                    <div className={s.safeZoneOverlay}>
                      <div className={s.safeZoneTimestamp}>Timestamp</div>
                    </div>
                  )}
                </div>
                <div className={s.variantInfo}>
                  <p className={s.variantHook}>
                    {variant.spec.hookText || variant.spec.plan?.hookText || "Untitled"}
                  </p>
                  <div className={s.variantMeta}>
                    <span className={s.conceptBadge}>
                      {variant.conceptName || variant.spec.plan?.conceptId?.replace(/-/g, " ") || "concept"}
                    </span>
                    {variant.score !== undefined && (
                      <span className={s.scoreBadge}>
                        {Math.round(variant.score)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!job && !loading && (
        <div className={s.emptyState}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <h3>Create Visual Story Thumbnails</h3>
          <p>
            Enter your video title and we&apos;ll generate thumbnails using proven patterns like
            Before/After, Mistake X, VS battles, and more. Each thumbnail tells a visual story.
          </p>
        </div>
      )}

      {/* Editor Modal */}
      {selectedVariant && (
        <ThumbnailEditor
          variant={selectedVariant}
          onClose={() => setSelectedVariant(null)}
          onUpdate={handleVariantUpdate}
        />
      )}
    </main>
  );
}
