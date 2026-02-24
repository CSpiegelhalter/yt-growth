import Image from "next/image";

import { Tag } from "@/components/ui";

import s from "./metric-pills.module.css";
import type { PillMetric } from "./pill-metric-types";

type MetricPillsProps = {
  goingWell: PillMetric[];
  needsWork: PillMetric[];
};

function MetricPill({ pill }: { pill: PillMetric }) {
  const isPositive = pill.direction === "up";
  const variant = isPositive ? "positive" : "negative";
  const arrowSrc = isPositive ? "/positive_arrow.svg" : "/negative_arrow.svg";

  return (
    <Tag variant={variant}>
      <span className={s.pillInner}>
        {pill.label}
        <Image src={arrowSrc} alt="" width={16} height={16} />
        {pill.displayValue}
      </span>
    </Tag>
  );
}

export function MetricPills({ goingWell, needsWork }: MetricPillsProps) {
  if (goingWell.length === 0 && needsWork.length === 0) {
    return null;
  }

  return (
    <div className={s.container}>
      {goingWell.length > 0 && (
        <section className={s.section}>
          <h3 className={s.sectionTitle}>Going well!</h3>
          <div className={s.pillRow}>
            {goingWell.map((p) => (
              <MetricPill key={p.key} pill={p} />
            ))}
          </div>
        </section>
      )}

      {needsWork.length > 0 && (
        <section className={s.section}>
          <h3 className={s.sectionTitle}>Needs work?</h3>
          <div className={s.pillRow}>
            {needsWork.map((p) => (
              <MetricPill key={p.key} pill={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
