"use client";

import s from "../style.module.css";

type Step = {
  action: string;
  reason: string;
  priority: "high" | "medium" | "low";
  expectedImpact?: string;
};

type VisibilityPlanData = {
  bottleneck: string;
  confidence: string;
  doNext?: Step[];
  promotionChecklist?: string[];
  whatToMeasureNext?: string[];
};

type VisibilityPlanProps = {
  plan: VisibilityPlanData;
};

/**
 * VisibilityPlan - Strategy for increasing video views
 */
export function VisibilityPlan({ plan }: VisibilityPlanProps) {
  return (
    <section className={s.actions}>
      <h2 className={s.sectionTitle}>Get More Views</h2>
      <p className={s.sectionDesc}>
        Your current bottleneck: <strong>{plan.bottleneck}</strong> (
        {plan.confidence} confidence)
      </p>

      <div className={s.actionsList}>
        {plan.doNext?.slice(0, 5).map((step, i) => (
          <div
            key={i}
            className={`${s.actionItem} ${
              step.priority === "high"
                ? s.actionHigh
                : step.priority === "medium"
                ? s.actionMed
                : s.actionLow
            }`}
          >
            <div className={s.actionNumber}>{i + 1}</div>
            <div className={s.actionContent}>
              <div className={s.actionTop}>
                <span className={s.actionLeverBadge}>Visibility</span>
                {step.priority === "high" && (
                  <span className={s.priorityBadge}>High Priority</span>
                )}
              </div>
              <p className={s.actionText}>{step.action}</p>
              <p className={s.actionReason}>{step.reason}</p>
              {step.expectedImpact && (
                <span className={s.actionImpact}>
                  Expected: {step.expectedImpact}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {(plan.promotionChecklist?.length ?? 0) > 0 && (
        <div style={{ marginTop: 14 }}>
          <p className={s.sectionDesc} style={{ marginBottom: 8 }}>
            Promotion checklist
          </p>
          <ul style={{ paddingLeft: 18 }}>
            {plan.promotionChecklist?.slice(0, 10).map((x, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {x}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(plan.whatToMeasureNext?.length ?? 0) > 0 && (
        <div style={{ marginTop: 14 }}>
          <p className={s.sectionDesc} style={{ marginBottom: 8 }}>
            What to measure next
          </p>
          <div className={s.tagChips}>
            {plan.whatToMeasureNext?.slice(0, 10).map((m) => (
              <span key={m} className={s.missingTagChip}>
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

