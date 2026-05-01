import type { PrioritiesList as PrioritiesListData } from "@/lib/features/full-report";

import s from "./priorities.module.css";
import { PriorityCard } from "./PriorityCard";

type PrioritiesListProps = {
  priorities: PrioritiesListData;
};

export function PrioritiesList({ priorities }: PrioritiesListProps) {
  if (priorities.items.length === 0) {
    return (
      <p className={s.emptyState}>
        No priorities surfaced for this video.
      </p>
    );
  }

  return (
    <section aria-labelledby="priorities-heading" className={s.section}>
      <h2 id="priorities-heading" className={s.sectionTitle}>
        Fix this first
      </h2>
      <div className={s.list}>
        {priorities.items.map((p) => (
          <PriorityCard key={p.rank} priority={p} />
        ))}
      </div>
    </section>
  );
}
