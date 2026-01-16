import s from "./style.module.css";

export default function Loading() {
  return (
    <main className={s.page}>
      <div className={s.header}>
        <div className={s.skeletonTitle} />
        <div className={s.skeletonSubtitle} />
      </div>
      <div className={s.formCard}>
        <div className={s.skeletonInput} />
        <div className={s.skeletonInput} />
        <div className={s.skeletonButton} />
      </div>
    </main>
  );
}
