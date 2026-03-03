"use client";

/**
 * useIdentityManager
 *
 * Manages identity photo state and training status polling.
 * Action handlers are delegated to identity-actions.ts.
 */

import { useEffect, useState } from "react";

import { STORAGE_KEYS } from "@/lib/client/safeLocalStorage";
import { usePersistentState } from "@/lib/hooks/usePersistentState";

import type { IdentityStatus, ToastFn, UploadedPhoto } from "../thumbnail-types";
import {
  deletePhoto,
  resetModel,
  uploadPhotos,
  waitForTraining as waitForTrainingAction,
} from "./identity-actions";
import { isUploadedPhotoArray } from "./thumbnail-helpers";

export function useIdentityManager(toast: ToastFn) {
  const [identity, setIdentity] = useState<IdentityStatus>({
    status: "none",
    photoCount: 0,
  });
  const [uploading, setUploading] = useState(false);
  const { value: photos, setValue: setPhotos } = usePersistentState<
    UploadedPhoto[]
  >({
    key: STORAGE_KEYS.UPLOADED_PHOTOS,
    initialValue: [],
    validator: isUploadedPhotoArray,
  });
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(
    null,
  );
  const [resettingModel, setResettingModel] = useState(false);

  const photoCount = photos.length;
  const identityReady = identity.status === "ready";
  const hasEnoughPhotos = photoCount >= 7;

  const loadIdentityStatus = async () => {
    try {
      const res = await fetch("/api/identity/status");
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as IdentityStatus & {
        photos?: UploadedPhoto[];
      };
      setIdentity(data);
      if (Array.isArray(data.photos)) {
        setPhotos(data.photos);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadIdentityStatus();
  }, [loadIdentityStatus]);

  useEffect(() => {
    if (identity.status !== "training" && identity.status !== "pending") {
      return;
    }
    const t = setInterval(() => void loadIdentityStatus(), 5000);
    return () => clearInterval(t);
  }, [identity.status]);

  const handleUploadPhotos = (e: React.ChangeEvent<HTMLInputElement>) =>
    uploadPhotos(e, {
      setUploading,
      loadIdentityStatus,
      toast,
    });

  const handleDeletePhoto = (photoId: string) =>
    deletePhoto(photoId, { setDeletingPhotoId, setPhotos, toast });

  const handleResetModel = (dp = false) =>
    resetModel(dp, {
      setResettingModel,
      loadIdentityStatus,
      toast,
    });

  const waitForTraining = () =>
    waitForTrainingAction({ setIdentity, setPhotos });

  return {
    identity,
    photos,
    photoCount,
    uploading,
    deletingPhotoId,
    resettingModel,
    identityReady,
    hasEnoughPhotos,
    handleUploadPhotos,
    handleDeletePhoto,
    handleResetModel,
    waitForTraining,
  };
}
