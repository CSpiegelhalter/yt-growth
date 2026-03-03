"use client";

/**
 * PhotoUploader
 *
 * Identity photo management section: upload button, reset model,
 * photo grid, and the "Include my face" toggle.
 */

import s from "../style.module.css";
import type { IdentityStatus, UploadedPhoto } from "../thumbnail-types";
import { IdentityStatusLine } from "./IdentityStatusLine";
import { getToggleTitle } from "./thumbnail-helpers";
import { UploadedPhotoGrid } from "./UploadedPhotoGrid";

type PhotoUploaderProps = {
  photos: UploadedPhoto[];
  photoCount: number;
  identityReady: boolean;
  identity: IdentityStatus;
  uploading: boolean;
  generating: boolean;
  resettingModel: boolean;
  deletingPhotoId: string | null;
  includeIdentity: boolean;
  canUseIdentity: boolean;
  isCompatibleStyle: boolean;
  hasEnoughPhotos: boolean;
  onUploadPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeletePhoto: (photoId: string) => void;
  onResetModel: (deletePhotos?: boolean) => void;
  onToggleIdentity: () => void;
};

export function PhotoUploader({
  photos,
  photoCount,
  identityReady,
  identity,
  uploading,
  generating,
  resettingModel,
  deletingPhotoId,
  includeIdentity,
  canUseIdentity,
  isCompatibleStyle,
  hasEnoughPhotos,
  onUploadPhotos,
  onDeletePhoto,
  onResetModel,
  onToggleIdentity,
}: PhotoUploaderProps) {
  return (
    <div className={`${s.formGroup} ${s.fullWidth}`}>
      <span className={s.label}>
        Put yourself in the thumbnail (optional)
      </span>
      <div className={s.identityRow}>
        <IdentityStatusLine
          photoCount={photoCount}
          identityReady={identityReady}
          identityStatus={identity.status}
          errorMessage={
            identity.status !== "none" ? identity.errorMessage : undefined
          }
        />
        <div className={s.identityActions}>
          {identityReady && (
            <button
              type="button"
              className={s.resetBtn}
              onClick={() => void onResetModel(false)}
              disabled={resettingModel || generating}
              title="Reset your identity model to retrain with new photos"
            >
              {resettingModel ? "Resetting\u2026" : "Reset Model"}
            </button>
          )}
          <label className={s.uploadBtn}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => void onUploadPhotos(e)}
              disabled={uploading || generating || identityReady}
              style={{ display: "none" }}
            />
            {uploading ? "Uploading\u2026" : "Upload photos"}
          </label>
        </div>
      </div>

      {identityReady && (
        <p className={s.identityHelp}>
          Your identity model is trained and ready. To update your photos,
          click &quot;Reset Model&quot; first.
        </p>
      )}

      <UploadedPhotoGrid
        photos={photos}
        deletingPhotoId={deletingPhotoId}
        onDeletePhoto={onDeletePhoto}
      />

      <div className={s.toggleGroup}>
        <button
          type="button"
          className={`${s.toggle} ${includeIdentity ? s.active : ""}`}
          onClick={onToggleIdentity}
          disabled={!canUseIdentity || generating}
          title={getToggleTitle(canUseIdentity, isCompatibleStyle, photoCount)}
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
  );
}
