"use client";

import s from "../style.module.css";

type LoadingStateProps = {
  loadingStage: string;
  llmProgress: number;
};

/**
 * LoadingState - Full-page blocking loader with spinner, stage text, and progress bar
 */
export function LoadingState({ loadingStage, llmProgress }: LoadingStateProps) {
  const progressValue = Math.max(8, llmProgress || 12);

  return (
    <main className={s.loadingPage}>
      <div className={s.loading}>
        <div className={s.spinner} />
        <p className={s.loadingStage}>{loadingStage}</p>
        <div className={s.loadingProgress}>
          <div
            className={s.progressTrack}
            role="progressbar"
            aria-label="Analyzing your video"
            aria-valuenow={Math.round(progressValue)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={s.progressFill}
              style={{ width: `${progressValue}%` }}
            />
          </div>
          <div className={s.loadingProgressHint}>
            This can take a bit on first view (we cache results for next time).
          </div>
        </div>
      </div>
    </main>
  );
}

