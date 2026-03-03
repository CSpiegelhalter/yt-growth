"use client";

/**
 * useJobPolling
 *
 * Manages job polling lifecycle and persisted thumbnail storage.
 * Polls the job status endpoint at 2.5s intervals and persists
 * completed thumbnails to localStorage.
 */

import { useEffect, useRef, useState } from "react";

import { STORAGE_KEYS } from "@/lib/client/safeLocalStorage";
import { usePersistentState } from "@/lib/hooks/usePersistentState";

import type { PersistedThumbnail, ThumbnailJobV2 } from "../thumbnail-types";
import { isPersistedThumbnailArray } from "./thumbnail-helpers";

export function useJobPolling() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ThumbnailJobV2 | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<
    "training" | "generating" | null
  >(null);

  const {
    value: persistedThumbnails,
    setValue: setPersistedThumbnails,
    isHydrated: thumbnailsHydrated,
  } = usePersistentState<PersistedThumbnail[]>({
    key: STORAGE_KEYS.GENERATED_THUMBNAILS,
    initialValue: [],
    validator: isPersistedThumbnailArray,
  });

  const pollRef = useRef<number | null>(null);

  const pollJob = async (id: string) => {
    try {
      const res = await fetch(`/api/thumbnails/job/${id}`);
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as ThumbnailJobV2;
      setJob(data);
      if (data.status === "succeeded" || data.status === "failed") {
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
        }
        pollRef.current = null;
        setGenerating(false);
        setGenerationPhase(null);

        if (data.status === "succeeded" && data.outputImages.length > 0) {
          const newThumbs: PersistedThumbnail[] = data.outputImages.map(
            (img, idx) => ({
              id: `${data.jobId}-${idx}`,
              url: img.url,
              createdAt: Date.now(),
              jobId: data.jobId,
              style: data.style,
              source: data.source,
            }),
          );
          setPersistedThumbnails((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const toAdd = newThumbs.filter((t) => !existingIds.has(t.id));
            return [...toAdd, ...prev].slice(0, 50);
          });
        }
      }
    } catch {
      // ignore transient errors
    }
  };

  useEffect(() => {
    if (!jobId) {
      return;
    }
    void pollJob(jobId);
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
    }
    pollRef.current = window.setInterval(
      () => void pollJob(jobId),
      2500,
    );
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
      pollRef.current = null;
    };
  }, [jobId, pollJob]);

  // Restore persisted thumbnails on mount
  useEffect(() => {
    if (!thumbnailsHydrated || job || jobId || generating) {
      return;
    }
    if (persistedThumbnails.length > 0) {
      const recentId = persistedThumbnails[0]?.jobId;
      const recent = persistedThumbnails.filter(
        (t) => t.jobId === recentId,
      );
      if (recent.length > 0) {
        setJobId(recentId);
        setJob({
          jobId: recentId,
          status: "succeeded",
          style: recent[0]?.style ?? "subject",
          source: recent[0]?.source,
          outputImages: recent.map((t) => ({ url: t.url })),
        });
      }
    }
  }, [thumbnailsHydrated, persistedThumbnails, job, jobId, generating]);

  return {
    jobId,
    setJobId,
    job,
    setJob,
    generating,
    setGenerating,
    generationPhase,
    setGenerationPhase,
  };
}
