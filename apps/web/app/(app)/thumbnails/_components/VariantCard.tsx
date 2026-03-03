"use client";

/**
 * VariantCard
 *
 * Displays a single generated thumbnail variant with action buttons
 * for opening the editor, re-generating, and downloading.
 */

import Image from "next/image";

import s from "../style.module.css";
import type { ToastFn } from "../thumbnail-types";
import { downloadThumbnailImage } from "./thumbnail-helpers";

type VariantCardProps = {
  img: { url: string; width?: number; height?: number; contentType?: string };
  idx: number;
  jobId: string;
  source?: "txt2img" | "img2img";
  regenerating: string | null;
  onOpenEditor: (url: string) => void;
  onRegenerate: (url: string, parentJobId: string) => void;
  toastFn: ToastFn;
};

export function VariantCard({
  img,
  idx,
  jobId,
  source,
  regenerating,
  onOpenEditor,
  onRegenerate,
  toastFn,
}: VariantCardProps) {
  return (
    <div className={s.variantCard}>
      <div
        className={s.variantThumb}
        onClick={() => void onOpenEditor(img.url)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            void onOpenEditor(img.url);
          }
        }}
        style={{ cursor: "pointer" }}
      >
        {source === "img2img" && (
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
        <div className={s.variantActions}>
          <button
            className={s.regenerateBtn}
            onClick={(e) => {
              e.stopPropagation();
              void onRegenerate(img.url, jobId);
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
            onClick={(e) => {
              e.stopPropagation();
              void downloadThumbnailImage(
                img.url,
                `thumbnail-${jobId}-${idx + 1}.png`,
                toastFn,
              );
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
          {source === "img2img" ? "Image variation" : "Text-free base"}
        </p>
      </div>
    </div>
  );
}
