"use client";

/**
 * useJobManager
 *
 * Action handlers for thumbnail generation: starting a new job,
 * opening the editor, and creating img2img variations.
 * Delegates polling/persistence to useJobPolling.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ToastFn } from "../thumbnail-types";
import type { GenerateParams } from "./job-actions";
import { resolveIdentityModelId } from "./job-actions";
import { useJobPolling } from "./useJobPolling";

export type { GenerateParams } from "./job-actions";

export function useJobManager(toast: ToastFn) {
  const router = useRouter();
  const polling = useJobPolling();
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const handleGenerate = async (params: GenerateParams) => {
    setError(null);
    polling.setJob(null);
    polling.setJobId(null);
    polling.setGenerationPhase(null);

    const p = params.prompt.trim();
    if (p.length < 3) {
      toast("Describe what you want (at least 3 characters).", "error");
      return;
    }

    polling.setGenerating(true);
    try {
      const identityModelId = await resolveIdentityModelId(params, {
        setPhase: polling.setGenerationPhase,
        toast,
      });

      polling.setGenerationPhase("generating");
      const res = await fetch("/api/thumbnails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: params.style,
          prompt: p,
          variants: 3,
          includeIdentity: params.includeIdentity,
          identityModelId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to start generation",
        );
      }
      polling.setJobId(data.jobId);
      toast("Generating variants\u2026", "success");
    } catch (error_) {
      polling.setGenerating(false);
      polling.setGenerationPhase(null);
      const msg =
        error_ instanceof Error ? error_.message : "Generation failed";
      setError(msg);
      toast(msg, "error");
    }
  };

  const openEditor = async (
    baseImageUrl: string,
    targetJobId?: string,
  ) => {
    const jid = targetJobId ?? polling.jobId;
    if (!jid) {
      return;
    }
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
    } catch (error_) {
      toast(
        error_ instanceof Error
          ? error_.message
          : "Failed to open editor",
        "error",
      );
    }
  };

  const handleRegenerate = async (
    inputImageUrl: string,
    parentJobId: string,
  ) => {
    if (regenerating) {
      return;
    }
    setRegenerating(inputImageUrl);
    try {
      const res = await fetch("/api/thumbnails/generate-img2img", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputImageUrl, parentJobId, strength: 0.6 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to start variation");
      }
      polling.setJobId(data.jobId);
      polling.setGenerating(true);
      polling.setGenerationPhase("generating");
      toast("Creating variation...", "success");
    } catch (error_) {
      toast(
        error_ instanceof Error
          ? error_.message
          : "Failed to create variation",
        "error",
      );
    } finally {
      setRegenerating(null);
    }
  };

  return {
    job: polling.job,
    generating: polling.generating,
    generationPhase: polling.generationPhase,
    error,
    regenerating,
    handleGenerate,
    openEditor,
    handleRegenerate,
  };
}
