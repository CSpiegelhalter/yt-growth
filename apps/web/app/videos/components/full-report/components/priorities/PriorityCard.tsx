import type { Priority, PrioritySource } from "@/lib/features/full-report";

import s from "./priorities.module.css";

type PriorityCardProps = {
  priority: Priority;
};

const SOURCE_LABEL: Record<PrioritySource, string> = {
  retention: "Retention",
  hook: "Hook",
  audit: "Audit",
  discoverability: "Discoverability",
  promotion: "Promotion",
  score: "Performance",
};

const SOURCE_TONE_CLASS: Record<PrioritySource, string> = {
  retention: "tagRetention",
  hook: "tagHook",
  audit: "tagAudit",
  discoverability: "tagDiscoverability",
  promotion: "tagPromotion",
  score: "tagScore",
};

const RANK_LABEL: Record<1 | 2 | 3, string> = {
  1: "①",
  2: "②",
  3: "③",
};

export function PriorityCard({ priority }: PriorityCardProps) {
  const tagClass = s[SOURCE_TONE_CLASS[priority.sourceSection]] ?? "";

  return (
    <article className={s.card}>
      <header className={s.cardHead}>
        <span className={s.rankChip} aria-label={`Priority ${priority.rank}`}>
          {RANK_LABEL[priority.rank]}
        </span>
        <h3 className={s.title}>{priority.title}</h3>
        <span className={`${s.sourceTag} ${tagClass}`}>
          {SOURCE_LABEL[priority.sourceSection]}
        </span>
      </header>

      <div className={s.body}>
        <Row label="What" body={priority.what} />
        {priority.why && <Row label="Why" body={priority.why} />}
        {priority.evidence && (
          <p className={s.evidence}>
            <span className={s.evidenceMetric}>{priority.evidence.metric}:</span>{" "}
            <span className={s.evidenceValue}>{priority.evidence.value}</span>
            {priority.evidence.baseline && (
              <span className={s.evidenceBaseline}> · {priority.evidence.baseline}</span>
            )}
          </p>
        )}
        <div className={s.doRow}>
          <span className={s.rowLabel}>Do</span>
          <ul className={s.doList}>
            {priority.doThis.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function Row({ label, body }: { label: string; body: string }) {
  return (
    <div className={s.row}>
      <span className={s.rowLabel}>{label}</span>
      <p className={s.rowBody}>{body}</p>
    </div>
  );
}
