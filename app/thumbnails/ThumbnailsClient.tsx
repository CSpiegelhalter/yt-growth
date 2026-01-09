"use client";

/**
 * ThumbnailsClient - Main thumbnail generator page
 *
 * Generates AI thumbnails using Flux Thumbnails model.
 * Simple workflow: enter video details → generate thumbnails → download.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import s from "./style.module.css";
import EditThumbnailDrawer from "@/components/thumbnails/EditThumbnailDrawer";
import AdvancedControlsV2 from "@/components/thumbnails/AdvancedControlsV2";
import { useToast } from "@/components/ui/Toast";
import type {
  ThumbnailStyle,
  ThumbnailJobResponse,
  ThumbnailVariantResponse,
} from "@/lib/thumbnails/types";
import {
  type GenerationControls,
  getDefaultControls,
} from "@/lib/thumbnails/generationControls";
import { getControlsSummary } from "@/lib/thumbnails/controlledPromptBuilder";

// ============================================
// TYPES
// ============================================

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

const STYLES: ThumbnailStyle[] = [
  "Bold",
  "Minimal",
  "Neon",
  "Clean",
  "Dramatic",
];

// Default values for development - remove or change in production
const DEV_DEFAULTS = {
  title: "10 mistakes killing your youtube growth",
  description: "We show common mistakes killing youtubers growth",
};

// ============================================
// COMPONENT
// ============================================

export default function ThumbnailsClient({ initialUser }: Props) {
  void initialUser;
  const { toast } = useToast();

  // Form state - use dev defaults in development
  const isDev = process.env.NODE_ENV === "development";
  const [title, setTitle] = useState(isDev ? DEV_DEFAULTS.title : "");
  const [description, setDescription] = useState(
    isDev ? DEV_DEFAULTS.description : ""
  );
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState<ThumbnailStyle>("Bold");
  const [aiBase, setAiBase] = useState(true);
  const [count, setCount] = useState(1);
  const [controls, setControls] = useState<GenerationControls>(
    getDefaultControls()
  );

  // Job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ThumbnailJobResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safe zone toggle
  const [showSafeZones, setShowSafeZones] = useState(false);

  // Edit drawer state
  const [editVariant, setEditVariant] =
    useState<ThumbnailVariantResponse | null>(null);

  // ============================================
  // JOB POLLING
  // ============================================

  // Ref to track if a /run call is in progress
  const isRunningRef = useRef(false);

  // Poll for job updates AND trigger work if needed
  useEffect(() => {
    if (!jobId) return;
    if (job?.status === "completed" || job?.status === "failed") return;

    const interval = setInterval(async () => {
      try {
        // First, get current status
        const res = await fetch(`/api/thumbnails/jobs/${jobId}`);
        if (!res.ok) return;

        const data: ThumbnailJobResponse = await res.json();
        setJob(data);

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
          if (data.status === "failed") {
            setError(data.error ?? "Job failed");
          }
          return;
        }

        // If job is not complete and not currently running, trigger /run
        if (!isRunningRef.current) {
          isRunningRef.current = true;
          try {
            await fetch(`/api/thumbnails/jobs/${jobId}/run`, {
              method: "POST",
            });
          } catch {
            // Ignore errors - we'll retry on next poll
          } finally {
            isRunningRef.current = false;
          }
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, job?.status]);

  // ============================================
  // HANDLERS
  // ============================================

  // Create and run job
  const handleGenerate = useCallback(async () => {
    if (!title.trim()) {
      toast("Please enter a video title", "error");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      toast(
        "Please enter a video description (at least 10 characters)",
        "error"
      );
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
          description: description.trim(),
          topic: topic.trim() || undefined,
          audience: audience.trim() || undefined,
          style,
          count,
          aiBase,
          controls,
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
      isRunningRef.current = true;
      try {
        const runRes = await fetch(`/api/thumbnails/jobs/${newJobId}/run`, {
          method: "POST",
        });

        if (!runRes.ok) {
          const data = await runRes.json();
          console.warn("Run error (will retry):", data);
        }
      } finally {
        isRunningRef.current = false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
      toast("Failed to start generation", "error");
    } finally {
      setLoading(false);
    }
  }, [
    title,
    description,
    topic,
    audience,
    style,
    count,
    aiBase,
    controls,
    toast,
  ]);

  // Handle edit button click
  const handleEditClick = useCallback(
    (variant: ThumbnailVariantResponse, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditVariant(variant);
    },
    []
  );

  // Handle regenerated variants from edit drawer
  const handleRegenerated = useCallback(
    (newVariants: ThumbnailVariantResponse[]) => {
      setJob((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          variants: [...prev.variants, ...newVariants],
        };
      });
      setEditVariant(null);
      toast(
        `Added ${newVariants.length} new variant${
          newVariants.length > 1 ? "s" : ""
        }`,
        "success"
      );
    },
    [toast]
  );

  // Download thumbnail
  const handleDownload = useCallback(
    async (variant: ThumbnailVariantResponse, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!variant.previewUrl) return;

      try {
        const res = await fetch(variant.previewUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `thumbnail-${variant.variantId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast("Download started!", "success");
      } catch {
        toast("Download failed", "error");
      }
    },
    [toast]
  );

  const isGenerating = Boolean(
    loading || (job && job.status !== "completed" && job.status !== "failed")
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <main className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <h1 className={s.title}>Thumbnail Studio</h1>
        <p className={s.subtitle}>
          Create concept-driven thumbnails with visual stories, not just text on
          backgrounds. Each variant uses proven patterns like Before/After,
          Mistake X, VS, and more.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className={s.errorAlert}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
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

          {/* Description (required) */}
          <div className={`${s.formGroup} ${s.fullWidth}`}>
            <label className={s.label} htmlFor="description">
              Video Description *
            </label>
            <textarea
              id="description"
              className={s.textarea}
              placeholder="Describe what happens in the video or what the viewer learns. This helps us create topic-accurate thumbnails."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              disabled={isGenerating}
            />
            <span className={s.inputHint}>
              Be specific! This anchors the visual concept to your actual video
              content.
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
              {STYLES.map((st) => (
                <option key={st} value={st}>
                  {st}
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
              <option value={1}>1 variant (fastest)</option>
              <option value={4}>4 variants</option>
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
                Generate AI scene images (recommended for visual story
                thumbnails)
              </span>
            </div>
          </div>

          {/* Advanced Generation Controls */}
          <div className={`${s.formGroup} ${s.fullWidth}`}>
            <AdvancedControlsV2
              controls={controls}
              onChange={setControls}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Generation Summary */}
        {controls.presetUsed && (
          <div className={s.controlsSummary}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            {getControlsSummary(controls)}
          </div>
        )}

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
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
                className={`${s.toggle} ${s.small} ${
                  showSafeZones ? s.active : ""
                }`}
                onClick={() => setShowSafeZones(!showSafeZones)}
              >
                <span className={s.toggleKnob} />
              </button>
              <span className={s.toggleLabelSmall}>Safe zones</span>
            </div>
          </div>

          <div className={s.variantsGrid}>
            {job.variants.map((variant) => (
              <div key={variant.variantId} className={s.variantCard}>
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
                  {/* Action buttons overlay */}
                  <div className={s.variantActions}>
                    {/* Edit button */}
                    <button
                      className={s.editOverlayBtn}
                      onClick={(e) => handleEditClick(variant, e)}
                      title="Edit this thumbnail"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    {/* Download button */}
                    <button
                      className={s.downloadBtn}
                      onClick={(e) => handleDownload(variant, e)}
                      title="Download this thumbnail"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
                <div className={s.variantInfo}>
                  <p className={s.variantHook}>
                    {variant.spec.hookText ||
                      variant.spec.plan?.hookText ||
                      "Untitled"}
                  </p>
                  <div className={s.variantMeta}>
                    <span className={s.conceptBadge}>
                      {variant.conceptName ||
                        variant.spec.plan?.conceptId?.replace(/-/g, " ") ||
                        "concept"}
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
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <h3>Create Visual Story Thumbnails</h3>
          <p>
            Enter your video title and we&apos;ll generate thumbnails using
            proven patterns like Before/After, Mistake X, VS battles, and more.
            Each thumbnail tells a visual story.
          </p>
        </div>
      )}

      {/* Edit Thumbnail Drawer */}
      {editVariant && jobId && (
        <EditThumbnailDrawer
          variant={editVariant}
          jobId={jobId}
          title={title}
          description={description}
          onClose={() => setEditVariant(null)}
          onRegenerated={handleRegenerated}
        />
      )}
    </main>
  );
}
