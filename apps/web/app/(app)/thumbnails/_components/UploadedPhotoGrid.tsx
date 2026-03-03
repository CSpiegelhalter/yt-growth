"use client";

/**
 * UploadedPhotoGrid
 *
 * Displays a grid of uploaded identity photos with delete buttons.
 */

import Image from "next/image";

import s from "../style.module.css";
import type { UploadedPhoto } from "../thumbnail-types";

type UploadedPhotoGridProps = {
  photos: UploadedPhoto[];
  deletingPhotoId: string | null;
  onDeletePhoto: (photoId: string) => void;
};

export function UploadedPhotoGrid({
  photos,
  deletingPhotoId,
  onDeletePhoto,
}: UploadedPhotoGridProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
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
              <Image
                src={photo.url}
                alt="Uploaded training reference"
                className={s.uploadedPhotoImg}
                fill
                sizes="80px"
                unoptimized
              />
            ) : (
              <div className={s.uploadedPhotoPlaceholder} />
            )}
            <button
              type="button"
              className={s.uploadedPhotoDelete}
              onClick={() => void onDeletePhoto(photo.id)}
              disabled={deletingPhotoId === photo.id}
              title="Delete photo"
            >
              {deletingPhotoId === photo.id ? "\u2026" : "\u2715"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
