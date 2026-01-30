"use client";

import { useState, useEffect, useRef } from "react";
import s from "./style.module.css";

// Loading stages for progress animation
const LOADING_STAGES = [
  { atMs: 0, text: "Connecting to YouTube..." },
  { atMs: 800, text: "Fetching video metadata..." },
  { atMs: 1600, text: "Loading analytics data..." },
  { atMs: 2400, text: "Computing performance metrics..." },
  { atMs: 3200, text: "Analyzing retention curve..." },
  { atMs: 4000, text: "Comparing to channel baseline..." },
  { atMs: 5000, text: "Finalizing insights..." },
];

/**
 * Loading state for Video Insights page.
 * Shows animated progress bar while server fetches analytics data.
 */
export default function VideoInsightsLoading() {
  const [progress, setProgress] = useState(8);
  const [stage, setStage] = useState(LOADING_STAGES[0].text);
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();

    // Update loading stage text based on elapsed time
    const stageTimer = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const currentStage = [...LOADING_STAGES]
        .reverse()
        .find((s) => elapsed >= s.atMs);
      if (currentStage) {
        setStage(currentStage.text);
      }
    }, 300);

    // Smoothly animate progress bar (asymptotically approaches 92%)
    const progressTimer = window.setInterval(() => {
      setProgress((p) => {
        const target = 92;
        const increment = Math.max(1, Math.round((target - p) * 0.08));
        return Math.min(target, p + increment);
      });
    }, 200);

    return () => {
      window.clearInterval(stageTimer);
      window.clearInterval(progressTimer);
    };
  }, []);

  const progressValue = Math.max(8, progress);

  return (
    <main className={s.loadingPage}>
      <div className={s.loading}>
        <div className={s.spinner} />
        <p className={s.loadingStage}>{stage}</p>
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
