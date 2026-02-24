import s from "./style.module.css";

export default function DashboardLoading() {
  return (
    <div className={s.page}>
      <div className={s.content}>
        <div className={s.splitPanel}>
          <div className={s.leftPanel}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{
                  height: 56,
                  borderRadius: 8,
                  marginBottom: 4,
                }}
              />
            ))}
          </div>
          <div className={s.rightPanel} style={{ display: "block" }}>
            <div
              className="skeleton"
              style={{ height: 400, borderRadius: 8 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
