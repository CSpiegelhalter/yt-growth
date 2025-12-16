import s from "./style.module.css";
import { RetentionRow } from "@/types/api";

export default function RetentionTable({
  rows,
  hypothesis,
  onRefresh,
  busy,
}: {
  rows: RetentionRow[];
  hypothesis?: string;
  onRefresh?: () => void;
  busy?: boolean;
}) {
  return (
    <div className={s.card}>
      <div className={s.header}>
        <div>
          <div className={s.title}>Retention cliffs (last 10)</div>
          <div className={s.subtle}>
            We fetch retention curves only when you view this tab.
          </div>
        </div>
        {onRefresh && (
          <button className={s.btn} onClick={onRefresh} disabled={busy}>
            {busy ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Video</th>
            <th>Cliff time</th>
            <th>Reason</th>
            <th>Context</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className={s.subtle}>
                No retention data yet. Sync the channel first.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.videoId}>
                <td>{r.title ?? r.videoId}</td>
                <td>{r.cliffTimeSec ? `${r.cliffTimeSec}s` : "—"}</td>
                <td>{r.cliffReason ?? "—"}</td>
                <td>
                  {r.context?.map((c) => `${c.second}s:${c.ratio}`).join(", ") ?? "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {hypothesis && (
        <div className={s.hypothesis}>
          <div className={s.subtle}>Hypothesis & fixes</div>
          <pre>{hypothesis}</pre>
        </div>
      )}
    </div>
  );
}
