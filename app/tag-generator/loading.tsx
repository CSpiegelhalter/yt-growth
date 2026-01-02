import s from "./style.module.css";

export default function TagGeneratorLoading() {
  return (
    <main className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>YouTube Tag Generator</h1>
        <p className={s.subtitle}>
          Generate optimized tags to improve your video&apos;s discoverability
        </p>
      </div>
      <div className={s.loading}>
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid var(--border)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: 16,
          }}
        />
        <span>Loading...</span>
      </div>
    </main>
  );
}
