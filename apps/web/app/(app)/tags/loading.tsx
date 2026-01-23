import s from "./tags.module.css";

export default function TagsLoading() {
  return (
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
  );
}
