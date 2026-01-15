"use client";

/**
 * ThumbnailsClient (Workflow V2)
 *
 * Workflow:
 * 1) pick a style (COMPARE / SUBJECT / OBJECT / HOLD)
 * 2) describe the thumbnail
 * 3) server uses LLM -> deterministic model prompt (no text)
 * 4) server runs Replicate style models (3 variants)
 * 5) click a result to open the pro editor
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import s from "./style.module.css";
import { useToast } from "@/components/ui/Toast";

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

type StyleV2 = "compare" | "subject" | "object" | "hold";

type UploadedPhoto = {
  id: string;
  url: string | null;
  width: number;
  height: number;
};

type IdentityStatus =
  | { status: "none"; photoCount?: number; photos?: UploadedPhoto[] }
  | {
      status: "pending" | "training" | "ready" | "failed" | "canceled";
      identityModelId: string;
      triggerWord?: string;
      errorMessage?: string;
      photoCount?: number;
      photos?: UploadedPhoto[];
    };

type UploadResult = {
  filename: string;
  status: "ok" | "error";
  id?: string;
  width?: number;
  height?: number;
  error?: string;
};

type ThumbnailJobV2 = {
  jobId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  style: StyleV2;
  outputImages: Array<{
    url: string;
    width?: number;
    height?: number;
    contentType?: string;
  }>;
};

const STYLE_CARDS: Array<{
  id: StyleV2;
  title: string;
  desc: string;
  examples: string[];
}> = [
  {
    id: "compare",
    title: "Compare",
    desc: "Two things head-to-head. Strong contrast, clean split.",
    examples: [
      "My old setup vs my new setup",
      "Cheap mic vs pro mic",
      "Before vs after",
    ],
  },
  {
    id: "subject",
    title: "Subject",
    desc: "A single expressive subject. Great for personality channels.",
    examples: [
      "Shocked creator reacting to analytics spike",
      "Confident creator holding a laptop",
      "Close-up with clean background space",
    ],
  },
  {
    id: "object",
    title: "Object",
    desc: "One hero object. Crisp lighting, product-style focus.",
    examples: [
      "A camera on a desk with dramatic lighting",
      "A gold trophy with glow and particles",
      "A keyboard exploding into neon shards",
    ],
  },
  {
    id: "hold",
    title: "Holding Object",
    desc: "Subject holding a prop toward camera. Very clickable framing.",
    examples: [
      "Creator holding a YouTube play button toward camera",
      "Hands holding a broken phone with sparks",
      "Person holding a giant red X sign",
    ],
  },
];

// ============================================
// COMPONENT
// ============================================

export default function ThumbnailsClient({ initialUser }: Props) {
  void initialUser;
  const { toast } = useToast();
  const router = useRouter();

  const [style, setStyle] = useState<StyleV2>("subject");
  const [prompt, setPrompt] = useState("");
  const [includeIdentity, setIncludeIdentity] = useState(false);

  const [identity, setIdentity] = useState<IdentityStatus>({ status: "none", photoCount: 0 });
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ThumbnailJobV2 | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // IDENTITY STATUS
  // ============================================

  const identityReady =
    identity.status !== "none" && identity.status === "ready";

  const loadIdentityStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/identity/status");
      if (!res.ok) return;
      const data = (await res.json()) as IdentityStatus & { 
        photoCount?: number;
        photos?: UploadedPhoto[];
      };
      setIdentity(data);
      if (typeof data.photoCount === "number") {
        setPhotoCount(data.photoCount);
      }
      if (Array.isArray(data.photos)) {
        setPhotos(data.photos);
      }
    } catch {
      // ignore
    }
  }, []);

  // Load identity status on mount
  useEffect(() => {
    void loadIdentityStatus();
  }, [loadIdentityStatus]);

  // Only poll when training is in progress
  useEffect(() => {
    if (identity.status !== "training" && identity.status !== "pending") return;
    
    const t = setInterval(() => void loadIdentityStatus(), 5000);
    return () => clearInterval(t);
  }, [identity.status, loadIdentityStatus]);

  // ============================================
  // JOB POLLING
  // ============================================

  const pollRef = useRef<number | null>(null);
  const pollJob = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/thumbnails/job/${id}`);
        if (!res.ok) return;
        const data = (await res.json()) as ThumbnailJobV2;
        setJob(data);
        if (data.status === "succeeded" || data.status === "failed") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
          setGenerating(false);
        }
      } catch {
        // ignore transient errors
      }
    },
    []
  );

  useEffect(() => {
    if (!jobId) return;
    void pollJob(jobId);
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(() => void pollJob(jobId), 2500);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [jobId, pollJob]);

  const canUseIdentity = identityReady && (style === "subject" || style === "hold");

  useEffect(() => {
    if (!canUseIdentity) setIncludeIdentity(false);
  }, [canUseIdentity]);

  const examples = useMemo(
    () => STYLE_CARDS.find((c) => c.id === style)?.examples ?? [],
    [style]
  );

  const handleGenerate = useCallback(async () => {
    setError(null);
    setJob(null);
    setJobId(null);

    const p = prompt.trim();
    if (p.length < 3) {
      toast("Describe what you want (at least 3 characters).", "error");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/thumbnails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,
          prompt: p,
          variants: 3,
          includeIdentity,
          identityModelId:
            includeIdentity && identity.status !== "none"
              ? identity.identityModelId
              : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to start generation");
      }
      setJobId(data.jobId);
      toast("Generating variants…", "success");
    } catch (err) {
      setGenerating(false);
      setError(err instanceof Error ? err.message : "Generation failed");
      toast("Generation failed", "error");
    }
  }, [prompt, style, includeIdentity, identity, toast]);

  const openEditor = useCallback(
    async (baseImageUrl: string) => {
      if (!jobId) return;
      try {
        const res = await fetch("/api/thumbnails/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ thumbnailJobId: jobId, baseImageUrl }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to create project");
        }
        router.push(`/thumbnails/editor/${data.projectId}`);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to open editor", "error");
      }
    },
    [jobId, router, toast]
  );

  const handleUploadPhotos = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      for (const f of Array.from(files)) form.append("file", f);
      const res = await fetch("/api/identity/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Upload failed");
      }
      
      const succeeded = data.counts?.uploaded ?? 0;
      const failed = data.counts?.failed ?? 0;
      
      // Show appropriate toast with failed file details
      if (failed > 0) {
        const failedFiles = (data.results as UploadResult[] || [])
          .filter((r) => r.status === "error")
          .map((r) => `${r.filename}: ${r.error}`)
          .join("\n");
        
        if (succeeded > 0) {
          toast(`${succeeded} uploaded, ${failed} failed:\n${failedFiles}`, "info");
        } else {
          toast(`All ${failed} failed:\n${failedFiles}`, "error");
        }
      } else if (succeeded > 0) {
        toast(`${succeeded} photo(s) uploaded`, "success");
      }
      
      // Reload photos to show the new ones
      await loadIdentityStatus();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }, [toast, loadIdentityStatus]);

  const handleStartTraining = useCallback(async () => {
    setTraining(true);
    try {
      const res = await fetch("/api/identity/commit", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Training failed to start");
      toast("Training started. This can take a while.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Training failed", "error");
    } finally {
      setTraining(false);
    }
  }, [toast]);

  const handleDeletePhoto = useCallback(async (photoId: string) => {
    setDeletingPhotoId(photoId);
    try {
      const res = await fetch(`/api/identity/upload/${photoId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to delete");
      
      // Update local state
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (data.counts?.total !== undefined) {
        setPhotoCount(data.counts.total);
      } else {
        setPhotoCount((c) => Math.max(0, c - 1));
      }
      toast("Photo deleted", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setDeletingPhotoId(null);
    }
  }, [toast]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <main className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <h1 className={s.title}>Thumbnail Studio</h1>
        <p className={s.subtitle}>
          Generate premium, style-consistent thumbnails (no AI text baked in).
          Add your text, arrows, shapes, and overlays in the editor.
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

      {/* Workflow Card */}
      <div className={s.formCard}>
        <div className={s.formGrid}>
          <div className={`${s.formGroup} ${s.fullWidth}`}>
            <label className={s.label}>1) Choose a Style</label>
            <div className={s.styleGrid}>
              {STYLE_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`${s.styleCard} ${style === card.id ? s.styleCardActive : ""}`}
                  onClick={() => setStyle(card.id)}
                  disabled={generating}
                >
                  <div className={s.styleCardTitle}>{card.title}</div>
                  <div className={s.styleCardDesc}>{card.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className={`${s.formGroup} ${s.fullWidth}`}>
            <label className={s.label} htmlFor="prompt">
              2) Describe what you want
            </label>
            <textarea
              id="prompt"
              className={s.textarea}
              placeholder={
                examples.length > 0 ? `Example: ${examples[0]}` : "Describe the thumbnail..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={generating}
            />
            {examples.length > 0 && (
              <div className={s.examples}>
                {examples.slice(0, 3).map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    className={s.exampleChip}
                    onClick={() => setPrompt(ex)}
                    disabled={generating}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
            <span className={s.inputHint}>
              Tip: mention the subject, the prop, and the vibe. We’ll keep the image text-free.
            </span>
          </div>

          <div className={`${s.formGroup} ${s.fullWidth}`}>
            <label className={s.label}>Identity model (optional)</label>
            <div className={s.identityRow}>
              <div className={s.identityStatus}>
                Status:{" "}
                <strong>
                  {identity.status === "none" ? "not trained" : identity.status}
                </strong>
                {" · "}
                <span>{photoCount} photo{photoCount !== 1 ? "s" : ""} uploaded</span>
                {identity.status !== "none" && identity.errorMessage && (
                  <span className={s.identityError}> — {identity.errorMessage}</span>
                )}
              </div>
              <div className={s.identityActions}>
                <label className={s.uploadBtn}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => void handleUploadPhotos(e.target.files)}
                    disabled={uploading}
                    style={{ display: "none" }}
                  />
                  {uploading ? "Uploading…" : "Upload photos"}
                </label>
                <button
                  type="button"
                  className={s.secondaryBtn}
                  onClick={() => void handleStartTraining()}
                  disabled={training || identity.status === "training" || photoCount < 7}
                  title={photoCount < 7 ? `Need at least 7 photos (have ${photoCount})` : undefined}
                >
                  {identity.status === "training"
                    ? "Training…"
                    : training
                    ? "Starting…"
                    : `Train identity (${photoCount}/7 photos)`}
                </button>
              </div>
            </div>

            {/* Uploaded Photos Grid */}
            {photos.length > 0 && (
              <div className={s.uploadedPhotos}>
                <div className={s.uploadedPhotosHeader}>
                  <span className={s.uploadedPhotosTitle}>
                    Uploaded Photos ({photos.length})
                  </span>
                </div>
                <div className={s.uploadedPhotosList}>
                  {photos.map((photo) => (
                    <div key={photo.id} className={s.uploadedPhotoItem}>
                      {photo.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.url}
                          alt="Uploaded training photo"
                          className={s.uploadedPhotoImg}
                        />
                      ) : (
                        <div className={s.uploadedPhotoPlaceholder} />
                      )}
                      <button
                        type="button"
                        className={s.uploadedPhotoDelete}
                        onClick={() => void handleDeletePhoto(photo.id)}
                        disabled={deletingPhotoId === photo.id}
                        title="Delete photo"
                      >
                        {deletingPhotoId === photo.id ? "…" : "✕"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={s.toggleGroup}>
              <button
                type="button"
                className={`${s.toggle} ${includeIdentity ? s.active : ""}`}
                onClick={() => setIncludeIdentity((v) => !v)}
                disabled={!canUseIdentity || generating}
                title={
                  canUseIdentity
                    ? "Include your identity model"
                    : "Train your identity model (and use SUBJECT/HOLD styles) to enable"
                }
              >
                <span className={s.toggleKnob} />
              </button>
              <span className={s.toggleLabel}>
                Use my identity model (SUBJECT / HOLD)
              </span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          className={s.generateBtn}
          onClick={handleGenerate}
          disabled={generating || prompt.trim().length < 3}
        >
          {generating ? (
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
              Generate 3 Variants
            </>
          )}
        </button>
      </div>

      {/* Progress Section */}
      {job && job.status === "running" && (
        <div className={s.progressSection}>
          <div className={s.progressCard}>
            <div className={s.progressHeader}>
              <span className={s.progressTitle}>Generating thumbnails</span>
              <span className={s.progressPercent}>
                {job.outputImages.length}/3
              </span>
            </div>
            <div className={s.progressBar}>
              <div
                className={s.progressFill}
                style={{
                  width: `${Math.min(100, (job.outputImages.length / 3) * 100)}%`,
                }}
              />
            </div>
            <div className={s.progressPhase}>
              We’ll keep generating until all variants are ready.
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {job && job.outputImages.length > 0 && (
        <div className={s.variantsSection}>
          <div className={s.variantsHeader}>
            <h2 className={s.sectionTitle}>
              {job.status === "succeeded"
                ? "Your variants"
                : `Ready: ${job.outputImages.length}`}
            </h2>
            <div className={s.toggleGroup} />
          </div>

          <div className={s.variantsGrid}>
            {job.outputImages.map((img) => (
              <div key={img.url} className={s.variantCard}>
                <div className={s.variantThumb}>
                  {img.url ? (
                    <Image
                      src={img.url}
                      alt="Generated thumbnail"
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className={s.variantPlaceholder} />
                  )}
                  {/* Action buttons overlay */}
                  <div className={s.variantActions}>
                    <button
                      className={s.editOverlayBtn}
                      onClick={() => void openEditor(img.url)}
                      title="Open editor"
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
                      Open editor
                    </button>
                    <button
                      className={s.downloadBtn}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await fetch(img.url);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `thumbnail-${job.jobId}.png`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast("Download started!", "success");
                        } catch {
                          toast("Download failed", "error");
                        }
                      }}
                      title="Download"
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
                  <p className={s.variantHook}>Text-free base image</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!job && !generating && (
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
            Pick a style, describe what you want, and generate 3 variants. Then
            open the editor to add text, arrows, highlights, and overlays.
          </p>
        </div>
      )}
    </main>
  );
}
