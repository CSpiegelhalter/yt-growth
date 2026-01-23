import s from "./tags.module.css";

export default function TagsLoading() {
  return (
    <div className={s.loadingContainer}>
      <div className={s.loadingSpinner} />
      <span className={s.loadingText}>Loading...</span>
    </div>
  );
}
