import { Fragment } from "react";

import type { RetentionAnalysis } from "@/lib/features/full-report";

import { DropOffBadge } from "./DropOffBadge";
import s from "./retention.module.css";

type RetentionTimelineProps = {
  retention: RetentionAnalysis;
};

export function RetentionTimeline({ retention }: RetentionTimelineProps) {
  if (retention.dropOffPoints.length === 0) {
    return (
      <p className={s.emptyState}>
        No drop-off data available — enable captions for retention analysis
      </p>
    );
  }

  return (
    <table className={s.retentionTable}>
      <thead>
        <tr>
          <th>Time</th>
          <th>Drop-off</th>
          <th>Why</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {retention.dropOffPoints.map((point, i) => (
          <Fragment key={`${point.timestamp}-${i}`}>
            <tr>
              <td className={s.retentionTime}>{point.timestamp}</td>
              <td><DropOffBadge percentDrop={point.percentDrop} /></td>
              <td>
                <span className={s.retentionIssue}>{point.issue}</span>
                {point.reasoning && (
                  <span className={s.retentionReasoning}>{point.reasoning}</span>
                )}
              </td>
              <td className={s.retentionAction}>{point.action}</td>
            </tr>
            {point.visualCue && (
              <tr>
                <td colSpan={4} className={s.retentionVisualCue}>
                  Visual: {point.visualCue}
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
