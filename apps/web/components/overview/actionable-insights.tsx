import type { ActionableInsight } from "@/lib/features/channel-audit";

import s from "./actionable-insights.module.css";
import { InsightCard } from "./insight-card";

type ActionableInsightsProps = {
  insights: ActionableInsight[];
  loading?: boolean;
};

export function ActionableInsights({
  insights,
  loading = false,
}: ActionableInsightsProps) {
  if (insights.length === 0 && !loading) {
    return (
      <div className={s.empty}>
        <p>
          Upload more videos to unlock personalized insights. We need at least 3
          videos with analytics data to start.
        </p>
      </div>
    );
  }

  return (
    <div className={s.stack}>
      {loading && insights.length > 0 && (
        <div className={s.loadingHint}>
          <div className={s.dotPulse} />
          <span>Analyzing your channel for deeper insights...</span>
        </div>
      )}
      {loading && insights.length === 0 && (
        <div className={s.loadingHint}>
          <div className={s.dotPulse} />
          <span>Generating personalized insights...</span>
        </div>
      )}
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}
