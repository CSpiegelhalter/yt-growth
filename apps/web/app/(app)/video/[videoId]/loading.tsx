import s from "./style.module.css";

export default function VideoInsightsLoading() {
  return (
    <main className={s.loadingPage}>
      <div className={s.loading}>
        <div className={s.spinner} />
        <p className={s.loadingStage}>Analyzing your video...</p>
        <div className={s.loadingProgress}>
          <div
            className={s.progressTrack}
            role="progressbar"
            aria-label="Analyzing your video"
          >
            <div className={`${s.progressFill} ${s.progressAnimate}`} />
          </div>
          <div className={s.loadingProgressHint}>
            This can take a bit on first view (we cache results for next time).
          </div>
        </div>
      </div>
    </main>
  );
}
