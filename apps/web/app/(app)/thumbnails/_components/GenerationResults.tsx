"use client";

/**
 * GenerationResults
 *
 * Displays generation progress, variant cards grid,
 * or the empty state when no thumbnails exist yet.
 */

import s from "../style.module.css";
import type { ThumbnailJobV2, ToastFn } from "../thumbnail-types";
import { VariantCard } from "./VariantCard";

type GenerationResultsProps = {
  job: ThumbnailJobV2 | null;
  generating: boolean;
  regenerating: string | null;
  onOpenEditor: (url: string) => void;
  onRegenerate: (url: string, parentJobId: string) => void;
  toastFn: ToastFn;
};

export function GenerationResults({
  job,
  generating,
  regenerating,
  onOpenEditor,
  onRegenerate,
  toastFn,
}: GenerationResultsProps) {
  return (
    <>
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
              We&apos;ll keep generating until all variants are ready.
            </div>
          </div>
        </div>
      )}

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
              <VariantCard
                key={img.url}
                img={img}
                idx={idx}
                jobId={job.jobId}
                source={job.source}
                regenerating={regenerating}
                onOpenEditor={onOpenEditor}
                onRegenerate={onRegenerate}
                toastFn={toastFn}
              />
            ))}
          </div>
        </div>
      )}

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
    </>
  );
}
