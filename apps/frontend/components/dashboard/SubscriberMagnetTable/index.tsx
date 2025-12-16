import s from "./style.module.css";
import { SubscriberMagnetRow } from "@/types/api";

export default function SubscriberMagnetTable({
  rows,
  summary,
}: {
  rows: SubscriberMagnetRow[];
  summary?: string;
}) {
  return (
    <div className={s.card}>
      <div className={s.header}>
        <div className={s.title}>Subscriber magnet audit</div>
        <div className={s.subtle}>Top 3 videos by subs gained per 1k views.</div>
      </div>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Video</th>
            <th>Views</th>
            <th>Subs gained</th>
            <th>Subs / 1k views</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className={s.subtle}>
                No data yet. Run a sync first.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.videoId ?? r.title}>
                <td>{r.title}</td>
                <td>{r.views}</td>
                <td>{r.subscribersGained}</td>
                <td>{r.subsPerThousand.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {summary && <div className={s.summary}>{summary}</div>}
    </div>
  );
}
