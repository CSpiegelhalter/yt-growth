import s from "./style.module.css";

export default function Loading() {
  return (
    <main className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Trending Search</h1>
          <p className={s.subtitle}>
            Discover trending niches and rising videos
          </p>
        </div>
      </div>
      <div className={s.loading}>
        <span className={s.spinner} />
        <p>Loading...</p>
      </div>
    </main>
  );
}
