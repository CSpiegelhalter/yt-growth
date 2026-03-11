import s from "./components/dashboard-client.module.css";

export default function DashboardLoading() {
  return (
    <div className={s.grid}>
      <div className={s.leftPanel}>
        <div className={s.skeleton} style={{ height: 400 }} />
      </div>
      <div className={s.rightPanel}>
        <div className={s.skeleton} style={{ height: 120 }} />
        <div className={s.skeleton} style={{ height: 120 }} />
        <div className={s.skeleton} style={{ height: 120 }} />
        <div className={s.skeleton} style={{ height: 120 }} />
      </div>
    </div>
  );
}
