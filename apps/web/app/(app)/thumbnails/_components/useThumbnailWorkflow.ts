"use client";

/**
 * useThumbnailWorkflow
 *
 * Thin orchestrator hook that composes useIdentityManager and useJobManager
 * with the top-level workflow state (style, prompt, identity toggle).
 */

import { useEffect, useState } from "react";

import { useToast } from "@/components/ui/Toast";

import type { StyleV2 } from "../thumbnail-types";
import { getExamplesForStyle } from "./style-cards";
import { useIdentityManager } from "./useIdentityManager";
import { useJobManager } from "./useJobManager";

export function useThumbnailWorkflow() {
  const { toast } = useToast();

  // --- Core workflow state ---
  const [style, setStyle] = useState<StyleV2>("subject");
  const [prompt, setPrompt] = useState("");
  const [includeIdentity, setIncludeIdentity] = useState(false);

  // --- Composed hooks ---
  const identityMgr = useIdentityManager(toast);
  const jobMgr = useJobManager(toast);

  // --- Derived values ---
  const isCompatibleStyle = style === "subject" || style === "hold";
  const canUseIdentity =
    isCompatibleStyle &&
    (identityMgr.identityReady || identityMgr.hasEnoughPhotos);
  const examples = getExamplesForStyle(style);
  const isGenerateDisabled =
    jobMgr.generating || prompt.trim().length < 3;

  // Auto-toggle identity when user gets enough photos
  useEffect(() => {
    if (
      canUseIdentity &&
      !identityMgr.identityReady &&
      identityMgr.photoCount >= 7
    ) {
      setIncludeIdentity(true);
    }
    if (!canUseIdentity) {
      setIncludeIdentity(false);
    }
  }, [canUseIdentity, identityMgr.identityReady, identityMgr.photoCount]);

  // --- Wrapped generate that passes current state ---
  const handleGenerate = () =>
    jobMgr.handleGenerate({
      style,
      prompt,
      includeIdentity,
      identity: identityMgr.identity,
      identityReady: identityMgr.identityReady,
      waitForTraining: identityMgr.waitForTraining,
    });

  return {
    // Workflow state
    style,
    setStyle,
    prompt,
    setPrompt,
    includeIdentity,
    setIncludeIdentity,
    examples,

    // Identity (spread for easy access)
    ...identityMgr,

    // Derived
    isCompatibleStyle,
    canUseIdentity,
    isGenerateDisabled,

    // Job management
    job: jobMgr.job,
    generating: jobMgr.generating,
    generationPhase: jobMgr.generationPhase,
    error: jobMgr.error,
    regenerating: jobMgr.regenerating,

    // Actions
    handleGenerate,
    openEditor: jobMgr.openEditor,
    handleRegenerate: jobMgr.handleRegenerate,
    toast,
  };
}
