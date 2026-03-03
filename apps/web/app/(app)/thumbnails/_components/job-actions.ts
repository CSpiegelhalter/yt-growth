/**
 * Job-related action helpers (pure async functions).
 *
 * Extracted from useJobManager to keep hooks under 150 lines.
 */

import type { IdentityStatus, StyleV2, ToastFn } from "../thumbnail-types";

export type GenerateParams = {
  style: StyleV2;
  prompt: string;
  includeIdentity: boolean;
  identity: IdentityStatus;
  identityReady: boolean;
  waitForTraining: () => Promise<string | null>;
};

async function startTrainingFlow(deps: {
  setPhase: (p: "training" | "generating" | null) => void;
  toast: ToastFn;
  waitForTraining: () => Promise<string | null>;
}): Promise<string | undefined> {
  deps.setPhase("training");
  deps.toast(
    "Training your identity model first\u2026 this may take a few minutes.",
    "info",
  );
  const trainRes = await fetch("/api/identity/commit", { method: "POST" });
  const trainData = await trainRes.json().catch(() => ({}));
  if (!trainRes.ok && trainRes.status !== 409) {
    throw new Error(trainData.message || "Failed to start training");
  }
  const modelId = (await deps.waitForTraining()) ?? undefined;
  deps.toast(
    "Identity trained! Now generating thumbnails\u2026",
    "success",
  );
  return modelId;
}

/** Resolve the identityModelId from params, training if necessary. */
export async function resolveIdentityModelId(
  params: GenerateParams,
  deps: {
    setPhase: (p: "training" | "generating" | null) => void;
    toast: ToastFn;
  },
): Promise<string | undefined> {
  if (params.includeIdentity && !params.identityReady) {
    return startTrainingFlow({
      setPhase: deps.setPhase,
      toast: deps.toast,
      waitForTraining: params.waitForTraining,
    });
  }
  if (
    params.includeIdentity &&
    params.identity.status !== "none" &&
    "identityModelId" in params.identity
  ) {
    return params.identity.identityModelId;
  }
  return undefined;
}
