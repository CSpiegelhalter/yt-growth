/**
 * Identity action handlers (pure async functions).
 * Each function takes the state setters and dependencies it needs.
 */

import type { IdentityStatus, ToastFn, UploadedPhoto } from "../thumbnail-types";
import { showUploadResultToasts } from "./thumbnail-helpers";

type LoadFn = () => Promise<void>;
type SetPhotosFn = (fn: (prev: UploadedPhoto[]) => UploadedPhoto[]) => void;
type SetIdentityFn = (data: IdentityStatus) => void;

export async function uploadPhotos(
  e: React.ChangeEvent<HTMLInputElement>,
  deps: {
    setUploading: (v: boolean) => void;
    loadIdentityStatus: LoadFn;
    toast: ToastFn;
  },
) {
  const files = e.target.files;
  if (!files || files.length === 0) {
    return;
  }
  const inputEl = e.target;
  deps.setUploading(true);
  try {
    const form = new FormData();
    for (const f of files) {
      form.append("file", f);
    }
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
    showUploadResultToasts(data, deps.toast);
    await deps.loadIdentityStatus();
  } catch (error_) {
    deps.toast(
      error_ instanceof Error ? error_.message : "Upload failed",
      "error",
    );
  } finally {
    deps.setUploading(false);
    inputEl.value = "";
  }
}

export async function deletePhoto(
  photoId: string,
  deps: {
    setDeletingPhotoId: (id: string | null) => void;
    setPhotos: SetPhotosFn;
    toast: ToastFn;
  },
) {
  deps.setDeletingPhotoId(photoId);
  try {
    const res = await fetch(`/api/identity/upload/${photoId}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Failed to delete");
    }
    deps.setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    deps.toast("Photo deleted", "success");
  } catch (error_) {
    deps.toast(
      error_ instanceof Error ? error_.message : "Failed to delete",
      "error",
    );
  } finally {
    deps.setDeletingPhotoId(null);
  }
}

export async function resetModel(
  deletePhotos: boolean,
  deps: {
    setResettingModel: (v: boolean) => void;
    loadIdentityStatus: LoadFn;
    toast: ToastFn;
  },
) {
  if (
    !confirm(
      deletePhotos
        ? "This will delete your trained model AND all uploaded photos. You'll need to upload new photos to retrain. Continue?"
        : "This will delete your trained model. Your photos will remain so you can retrain after making changes. Continue?",
    )
  ) {
    return;
  }
  deps.setResettingModel(true);
  try {
    const res = await fetch("/api/identity/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deletePhotos }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Failed to reset model");
    }
    deps.toast(data.message || "Model reset successfully", "success");
    await deps.loadIdentityStatus();
  } catch (error_) {
    deps.toast(
      error_ instanceof Error ? error_.message : "Failed to reset",
      "error",
    );
  } finally {
    deps.setResettingModel(false);
  }
}

export async function waitForTraining(deps: {
  setIdentity: SetIdentityFn;
  setPhotos: (fn: (prev: UploadedPhoto[]) => UploadedPhoto[]) => void;
}): Promise<string | null> {
  const maxAttempts = 120;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const res = await fetch("/api/identity/status");
    if (!res.ok) {
      continue;
    }
    const data = await res.json();
    deps.setIdentity(data);
    if (Array.isArray(data.photos)) {
      deps.setPhotos(() => data.photos);
    }
    if (data.status === "ready") {
      return data.identityModelId;
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.errorMessage || "Identity training failed");
    }
  }
  throw new Error("Training timed out. Please try again.");
}
