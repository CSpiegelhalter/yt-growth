"use client";

import s from "../style.module.css";

type Action = {
  lever: string;
  action: string;
  reason: string;
  priority: "high" | "medium" | "low";
  expectedImpact?: string;
};

type PriorityActionsProps = {
  actions: Action[];
};

/**
 * PriorityActions - List of prioritized next steps
 */
export function PriorityActions({ actions }: PriorityActionsProps) {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <section className={s.actions}>
      <h2 className={s.sectionTitle}>What To Do Next</h2>
      <p className={s.sectionDesc}>
        Prioritized actions based on this video{"'"}s data
      </p>

      <div className={s.actionsList}>
        {actions.slice(0, 5).map((action, i) => (
          <div
            key={i}
            className={`${s.actionItem} ${
              action.priority === "high"
                ? s.actionHigh
                : action.priority === "medium"
                ? s.actionMed
                : s.actionLow
            }`}
          >
            <div className={s.actionNumber}>{i + 1}</div>
            <div className={s.actionContent}>
              <div className={s.actionTop}>
                <span className={s.actionLeverBadge}>{action.lever}</span>
                {action.priority === "high" && (
                  <span className={s.priorityBadge}>High Priority</span>
                )}
              </div>
              <p className={s.actionText}>{action.action}</p>
              <p className={s.actionReason}>{action.reason}</p>
              {action.expectedImpact && (
                <span className={s.actionImpact}>
                  Expected: {action.expectedImpact}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

