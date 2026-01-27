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
 *
 * STATE MANAGEMENT NOTES:
 * - `photos` is the canonical source of truth for uploaded identity photos.
 *   The "photos uploaded" counter is DERIVED from photos.length, not stored separately.
 *   This prevents the counter from drifting out of sync.
 *
 * - `generatedThumbnails` persists to localStorage so users can navigate away
 *   and return to see their previously generated thumbnails.
 *
 * - The `handleGenerate` function NEVER clears the photos array. It only resets
 *   the current generation job state, not the upload state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import s from "./style.module.css";
import { useToast } from "@/components/ui/Toast";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { STORAGE_KEYS } from "@/lib/storage/safeLocalStorage";

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
  source?: "txt2img" | "img2img";
  parentJobId?: string;
  outputImages: Array<{
    url: string;
    width?: number;
    height?: number;
    contentType?: string;
  }>;
};

/**
 * Persisted generated thumbnail - stored in localStorage to survive
 * navigation and page refreshes.
 */
type PersistedThumbnail = {
  id: string;
  url: string;
  createdAt: number;
  jobId: string;
  style: StyleV2;
  source?: "txt2img" | "img2img";
};

/**
 * Type guard to validate persisted thumbnails loaded from localStorage.
 * Protects against corrupted or outdated data structures.
 */
function isPersistedThumbnailArray(
  value: unknown,
): value is PersistedThumbnail[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "string" &&
      typeof item.url === "string" &&
      typeof item.createdAt === "number" &&
      typeof item.jobId === "string",
  );
}

/**
 * Type guard to validate uploaded photos loaded from localStorage.
 * These are the identity photos used for face training.
 */
function isUploadedPhotoArray(value: unknown): value is UploadedPhoto[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "string" &&
      (item.url === null || typeof item.url === "string") &&
      typeof item.width === "number" &&
      typeof item.height === "number",
  );
}

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

  const [identity, setIdentity] = useState<IdentityStatus>({
    status: "none",
    photoCount: 0,
  });
  const [uploading, setUploading] = useState(false);

  // PERSISTED: Uploaded identity photos are stored in localStorage so they
  // appear immediately on page load while we fetch the latest from the server.
  // This also provides resilience if the server is slow to respond.
  const { value: photos, setValue: setPhotos } = usePersistentState<
    UploadedPhoto[]
  >({
    key: STORAGE_KEYS.UPLOADED_PHOTOS,
    initialValue: [],
    validator: isUploadedPhotoArray,
  });

  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [resettingModel, setResettingModel] = useState(false);

  // DERIVED: photoCount comes from photos array length, not separate state
  const photoCount = photos.length;

  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ThumbnailJobV2 | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<
    "training" | "generating" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // PERSISTED GENERATED THUMBNAILS
  // Stored in localStorage so they survive navigation/refresh.
  // ============================================
  const {
    value: persistedThumbnails,
    setValue: setPersistedThumbnails,
    isHydrated: thumbnailsHydrated,
  } = usePersistentState<PersistedThumbnail[]>({
    key: STORAGE_KEYS.GENERATED_THUMBNAILS,
    initialValue: [],
    validator: isPersistedThumbnailArray,
  });

  // ============================================
  // IDENTITY STATUS
  // ============================================

  const identityReady = identity.status === "ready";
  const hasEnoughPhotos = photoCount >= 7;

  const loadIdentityStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/identity/status");
      if (!res.ok) return;
      const data = (await res.json()) as IdentityStatus & {
        photoCount?: number;
        photos?: UploadedPhoto[];
      };
      setIdentity(data);
      // BUG FIX: Only update photos if the server returns a photos array.
      // This prevents clearing the photos state when the server returns
      // identity status without photo data (e.g., during training polling).
      // The photoCount is now DERIVED from photos.length, so we don't set it separately.
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
          setGenerationPhase(null);

          // PERSIST: When job succeeds, save generated thumbnails to localStorage
          // so they survive navigation and page refresh.
          if (data.status === "succeeded" && data.outputImages.length > 0) {
            const newThumbnails: PersistedThumbnail[] = data.outputImages.map(
              (img, idx) => ({
                id: `${data.jobId}-${idx}`,
                url: img.url,
                createdAt: Date.now(),
                jobId: data.jobId,
                style: data.style,
                source: data.source,
              }),
            );
            // Merge with existing, avoiding duplicates by id
            setPersistedThumbnails((prev) => {
              const existingIds = new Set(prev.map((t) => t.id));
              const toAdd = newThumbnails.filter((t) => !existingIds.has(t.id));
              // Keep most recent 50 thumbnails to prevent unbounded growth
              const merged = [...toAdd, ...prev].slice(0, 50);
              return merged;
            });
          }
        }
      } catch {
        // ignore transient errors
      }
    },
    [setPersistedThumbnails],
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

  // RESTORE: When page loads with no active job but we have persisted thumbnails,
  // create a synthetic job to display them. This ensures thumbnails persist
  // across navigation and page refresh.
  useEffect(() => {
    // Only run after localStorage has been loaded and if we don't already have a job
    if (!thumbnailsHydrated || job || jobId || generating) return;

    if (persistedThumbnails.length > 0) {
      // Group by most recent jobId to create a synthetic job for display
      const mostRecentJobId = persistedThumbnails[0]?.jobId;
      const mostRecentThumbnails = persistedThumbnails.filter(
        (t) => t.jobId === mostRecentJobId,
      );

      if (mostRecentThumbnails.length > 0) {
        const syntheticJob: ThumbnailJobV2 = {
          jobId: mostRecentJobId,
          status: "succeeded",
          style: mostRecentThumbnails[0]?.style ?? "subject",
          source: mostRecentThumbnails[0]?.source,
          outputImages: mostRecentThumbnails.map((t) => ({ url: t.url })),
        };
        // BUG FIX: Also set jobId so that openEditor() works correctly.
        // Previously only set job, but openEditor uses jobId as fallback.
        setJobId(mostRecentJobId);
        setJob(syntheticJob);
      }
    }
  }, [thumbnailsHydrated, persistedThumbnails, job, jobId, generating]);

  // Can use identity if:
  // 1. Using a compatible style (subject or hold), AND
  // 2. EITHER the model is already trained (identityReady) OR user has enough photos to train
  // BUG FIX: Previously required hasEnoughPhotos even when model was already ready,
  // which caused the toggle to be disabled when photos weren't cached locally.
  const isCompatibleStyle = style === "subject" || style === "hold";
  const canUseIdentity =
    isCompatibleStyle && (identityReady || hasEnoughPhotos);

  // Auto-enable toggle when user first gets 7+ photos with a compatible style
  useEffect(() => {
    if (canUseIdentity && !identityReady && photoCount >= 7) {
      setIncludeIdentity(true);
    }
    if (!canUseIdentity) setIncludeIdentity(false);
  }, [canUseIdentity, identityReady, photoCount]);

  const examples = useMemo(
    () => STYLE_CARDS.find((c) => c.id === style)?.examples ?? [],
    [style],
  );

  // Helper to wait for identity training to complete
  const waitForTraining = useCallback(async (): Promise<string | null> => {
    const maxAttempts = 120; // ten minutes max (5s intervals)
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const res = await fetch("/api/identity/status");
      if (!res.ok) continue;
      const data = await res.json();
      // BUG FIX: Only update identity status, not photos. The photos state
      // is managed separately and should not be cleared during training polling.
      // This prevents the "photos uploaded" counter from resetting to 0.
      setIdentity(data);
      // If the server returns photos, update them (but don't clear if missing)
      if (Array.isArray(data.photos)) {
        setPhotos(data.photos);
      }
      if (data.status === "ready") {
        return data.identityModelId;
      }
      if (data.status === "failed" || data.status === "canceled") {
        throw new Error(data.errorMessage || "Identity training failed");
      }
    }
    throw new Error("Training timed out. Please try again.");
  }, []);

  const handleGenerate = useCallback(async () => {
    // BUG FIX: Only reset JOB-related state here, NOT the photos/uploads state.
    // Previously, this function (or something it triggered) was clearing the
    // uploaded photos, causing the "photos uploaded" counter to reset.
    // The photos state is intentionally NOT touched here.
    setError(null);
    setJob(null);
    setJobId(null);
    setGenerationPhase(null);
    // NOTE: We do NOT call setPhotos([]) or clear any upload-related state here.
    // The uploaded photos must persist across generation attempts.

    const p = prompt.trim();
    if (p.length < 3) {
      toast("Describe what you want (at least 3 characters).", "error");
      return;
    }

    setGenerating(true);

    let identityModelId: string | undefined;

    try {
      // If user wants identity but model isn't ready, train first
      if (includeIdentity && !identityReady) {
        setGenerationPhase("training");
        toast(
          "Training your identity model first… this may take a few minutes.",
          "info",
        );

        // Start training
        const trainRes = await fetch("/api/identity/commit", {
          method: "POST",
        });
        const trainData = await trainRes.json().catch(() => ({}));

        if (!trainRes.ok) {
          // If already training, just wait for it
          if (trainRes.status !== 409) {
            throw new Error(trainData.message || "Failed to start training");
          }
        }

        // Wait for training to complete
        identityModelId = (await waitForTraining()) ?? undefined;
        toast("Identity trained! Now generating thumbnails…", "success");
      } else if (
        includeIdentity &&
        identity.status !== "none" &&
        "identityModelId" in identity
      ) {
        identityModelId = identity.identityModelId;
      }

      setGenerationPhase("generating");
      const res = await fetch("/api/thumbnails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,
          prompt: p,
          variants: 3,
          includeIdentity,
          identityModelId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to start generation",
        );
      }
      setJobId(data.jobId);
      toast("Generating variants…", "success");
    } catch (err) {
      setGenerating(false);
      setGenerationPhase(null);
      setError(err instanceof Error ? err.message : "Generation failed");
      toast(err instanceof Error ? err.message : "Generation failed", "error");
    }
  }, [
    prompt,
    style,
    includeIdentity,
    identityReady,
    identity,
    toast,
    waitForTraining,
  ]);

  const openEditor = useCallback(
    async (baseImageUrl: string, targetJobId?: string) => {
      const jid = targetJobId ?? jobId;
      if (!jid) return;
      try {
        const res = await fetch("/api/thumbnails/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ thumbnailJobId: jid, baseImageUrl }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to create project");
        }
        router.push(`/thumbnails/editor/${data.projectId}`);
      } catch (err) {
        toast(
          err instanceof Error ? err.message : "Failed to open editor",
          "error",
        );
      }
    },
    [jobId, router, toast],
  );

  const [regenerating, setRegenerating] = useState<string | null>(null);

  const handleRegenerate = useCallback(
    async (inputImageUrl: string, parentJobId: string) => {
      if (regenerating) return;
      setRegenerating(inputImageUrl);
      try {
        const res = await fetch("/api/thumbnails/generate-img2img", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputImageUrl,
            parentJobId,
            strength: 0.6, // Moderate variation
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to start variation");
        }
        // Start polling the new job
        setJobId(data.jobId);
        setGenerating(true);
        setGenerationPhase("generating");
        toast("Creating variation...", "success");
      } catch (err) {
        toast(
          err instanceof Error ? err.message : "Failed to create variation",
          "error",
        );
      } finally {
        setRegenerating(null);
      }
    },
    [regenerating, toast],
  );

  const handleUploadPhotos = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Reset input immediately so user can re-select same files
      const inputEl = e.target;

      setUploading(true);
      try {
        const form = new FormData();
        for (const f of Array.from(files)) form.append("file", f);
        const res = await fetch("/api/identity/upload", {
          method: "POST",
          body: form,
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data.error?.message || data.message || "Upload failed",
          );
        }

        const succeeded = data.counts?.uploaded ?? 0;
        const failed = data.counts?.failed ?? 0;

        // Show appropriate toast with failed file details
        if (failed > 0) {
          const failedFiles = ((data.results as UploadResult[]) || [])
            .filter((r) => r.status === "error")
            .map((r) => `${r.filename}: ${r.error}`)
            .join("\n");

          if (succeeded > 0) {
            toast(
              `${succeeded} uploaded, ${failed} failed:\n${failedFiles}`,
              "info",
            );
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
        // Reset file input so user can select same files again
        inputEl.value = "";
      }
    },
    [toast, loadIdentityStatus],
  );

  const handleDeletePhoto = useCallback(
    async (photoId: string) => {
      setDeletingPhotoId(photoId);
      try {
        const res = await fetch(`/api/identity/upload/${photoId}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to delete");

        // BUG FIX: Only update the photos array. The photoCount is now derived
        // from photos.length, so we don't need to update it separately.
        // This prevents the count from drifting out of sync with the actual photos.
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        toast("Photo deleted", "success");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to delete", "error");
      } finally {
        setDeletingPhotoId(null);
      }
    },
    [toast],
  );

  const handleResetModel = useCallback(
    async (deletePhotos = false) => {
      if (
        !confirm(
          deletePhotos
            ? "This will delete your trained model AND all uploaded photos. You'll need to upload new photos to retrain. Continue?"
            : "This will delete your trained model. Your photos will remain so you can retrain after making changes. Continue?",
        )
      ) {
        return;
      }

      setResettingModel(true);
      try {
        const res = await fetch("/api/identity/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deletePhotos }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to reset model");

        toast(data.message || "Model reset successfully", "success");

        // Reload identity status to reflect changes
        await loadIdentityStatus();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to reset", "error");
      } finally {
        setResettingModel(false);
      }
    },
    [toast, loadIdentityStatus],
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
                examples.length > 0
                  ? `Example: ${examples[0]}`
                  : "Describe the thumbnail..."
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
              Tip: mention the subject, the prop, and the vibe. We’ll keep the
              image text-free.
            </span>
          </div>

          <div className={`${s.formGroup} ${s.fullWidth}`}>
            <label className={s.label}>
              Put yourself in the thumbnail (optional)
            </label>
            <div className={s.identityRow}>
              <div className={s.identityStatus}>
                <span>
                  {photoCount} photo{photoCount !== 1 ? "s" : ""} uploaded
                </span>
                {photoCount < 7 && !identityReady && (
                  <span className={s.identityHint}>
                    {" "}
                    — need {7 - photoCount} more to enable
                  </span>
                )}
                {identityReady && (
                  <span className={s.identityReady}> ✓ Ready to use</span>
                )}
                {identity.status === "training" && (
                  <span className={s.identityTraining}>
                    {" "}
                    — Training in progress…
                  </span>
                )}
                {identity.status !== "none" && identity.errorMessage && (
                  <span className={s.identityError}>
                    {" "}
                    — {identity.errorMessage}
                  </span>
                )}
              </div>
              <div className={s.identityActions}>
                {identityReady && (
                  <button
                    type="button"
                    className={s.resetBtn}
                    onClick={() => void handleResetModel(false)}
                    disabled={resettingModel || generating}
                    title="Reset your identity model to retrain with new photos"
                  >
                    {resettingModel ? "Resetting…" : "Reset Model"}
                  </button>
                )}
                <label className={s.uploadBtn}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => void handleUploadPhotos(e)}
                    disabled={uploading || generating || identityReady}
                    style={{ display: "none" }}
                  />
                  {uploading ? "Uploading…" : "Upload photos"}
                </label>
              </div>
            </div>

            {/* Help text when model is ready */}
            {identityReady && (
              <p className={s.identityHelp}>
                Your identity model is trained and ready. To update your photos,
                click "Reset Model" first.
              </p>
            )}

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
                    ? "Include your face in the thumbnail"
                    : !isCompatibleStyle
                      ? "Identity works with Subject and Hold styles only"
                      : `Upload ${7 - photoCount} more photo${7 - photoCount !== 1 ? "s" : ""} to enable`
                }
              >
                <span className={s.toggleKnob} />
              </button>
              <span className={s.toggleLabel}>
                Include my face
                {!identityReady && hasEnoughPhotos && (
                  <span className={s.toggleHint}>
                    {" "}
                    (will train automatically)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Generate Button (Desktop) */}
        <button
          className={`${s.generateBtn} ${s.desktopOnlyGenerateBtn}`}
          onClick={handleGenerate}
          disabled={generating || prompt.trim().length < 3}
        >
          {generating ? (
            <>
              <span className={s.spinner} />
              {generationPhase === "training"
                ? "Training identity…"
                : "Generating…"}
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
              {includeIdentity && !identityReady
                ? "Train & Generate"
                : "Generate 3 Variants"}
            </>
          )}
        </button>
      </div>

      {/* Mobile-pinned Generate Button */}
      <div className={s.mobileGenerateWrapper}>
        <button
          className={s.mobileGenerateBtn}
          onClick={handleGenerate}
          disabled={generating || prompt.trim().length < 3}
        >
          {generating ? (
            <>
              <span className={s.spinner} />
              {generationPhase === "training" ? "Training…" : "Generating…"}
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
              {includeIdentity && !identityReady
                ? "Train & Generate"
                : "Generate"}
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
            {job.outputImages.map((img, idx) => (
              <div key={img.url} className={s.variantCard}>
                <div
                  className={s.variantThumb}
                  onClick={() => void openEditor(img.url)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      void openEditor(img.url);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {job.source === "img2img" && (
                    <span className={s.variantBadge}>Variant</span>
                  )}
                  {img.url ? (
                    <Image
                      src={img.url}
                      alt="Generated thumbnail - click to edit"
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
                      className={s.regenerateBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRegenerate(img.url, job.jobId);
                      }}
                      disabled={regenerating === img.url}
                      title="Create variation"
                    >
                      {regenerating === img.url ? (
                        <>
                          <span className={s.spinner} />
                          Creating...
                        </>
                      ) : (
                        <>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                          Re-generate
                        </>
                      )}
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
                          a.download = `thumbnail-${job.jobId}-${idx + 1}.png`;
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
                  <p className={s.variantHook}>
                    {job.source === "img2img"
                      ? "Image variation"
                      : "Text-free base"}
                  </p>
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
