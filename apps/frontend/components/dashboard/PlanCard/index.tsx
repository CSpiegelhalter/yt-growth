import s from "./style.module.css";
import { Plan } from "@/types/api";

export default function PlanCard({
  plan,
  onRegenerate,
  busy,
}: {
  plan: Plan;
  onRegenerate?: () => void;
  busy?: boolean;
}) {
  return (
    <div className={s.card}>
      <div className={s.header}>
        <div>
          <div className={s.title}>Decide-for-Me Plan</div>
          <div className={s.subtle}>
            Generated {new Date(plan.createdAt).toLocaleString()}
          </div>
        </div>
        {onRegenerate && (
          <button className={s.btn} onClick={onRegenerate} disabled={busy}>
            {busy ? "Working…" : "Regenerate"}
          </button>
        )}
      </div>
      <pre className={s.body}>{plan.outputMarkdown}</pre>
    </div>
  );
}
