import type { ActionableInsight } from "@/lib/features/channel-audit";

import s from "./insight-card.module.css";

type InsightCardProps = {
  insight: ActionableInsight;
};

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <article className={s.card}>
      <h3 className={s.title}>{insight.title}</h3>
      <p className={s.explanation}>{insight.explanation}</p>
      <p className={s.fix}>{insight.fix}</p>
    </article>
  );
}
