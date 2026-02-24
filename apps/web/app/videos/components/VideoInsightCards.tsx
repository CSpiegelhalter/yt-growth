import type { InsightItem } from "@/lib/features/video-insights/types";

import s from "./video-insight-cards.module.css";

type VideoInsightCardsProps = {
  insights: InsightItem[];
};

export function VideoInsightCards({ insights }: VideoInsightCardsProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div className={s.stack}>
      {insights.map((item, idx) => (
        <article key={idx} className={s.card}>
          <h4 className={s.title}>{item.title}</h4>
          <p className={s.explanation}>{item.explanation}</p>
          <p className={s.fix}>{item.fix}</p>
        </article>
      ))}
    </div>
  );
}
