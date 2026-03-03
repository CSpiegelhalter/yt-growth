import type { GoalCardProps } from "../goals-types";
import s from "../style.module.css";

export function GoalCard({ goal, badges }: GoalCardProps) {
  return (
    <div
      className={`${s.goalCard} ${
        goal.status === "completed" ? s.completed : ""
      } ${goal.status === "locked" ? s.goalLocked : ""}`}
    >
      <div className={s.goalInfo}>
        <h4 className={s.goalTitle}>{goal.title}</h4>
        <p className={s.goalDesc}>{goal.whyItMatters}</p>
        {goal.badgeIds.length > 0 && (
          <div className={s.goalBadges}>
            {goal.badgeIds.slice(0, 2).map((badgeId) => {
              const badge = badges.find((b) => b.id === badgeId);
              return badge ? (
                <span
                  key={badgeId}
                  className={s.goalBadgeChip}
                  data-rarity={badge.rarity}
                >
                  {badge.name}
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
      <div className={s.goalProgress}>
        {goal.status === "completed" ? (
          <span className={s.completedBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Done
          </span>
        ) : (goal.status === "locked" ? (
          <span className={s.lockedBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            {goal.lockedReason || "Locked"}
          </span>
        ) : (
          <div className={s.goalProgressWrap}>
            <div className={s.goalProgressBar}>
              <div
                className={s.goalProgressFill}
                style={{ width: `${goal.percentage}%` }}
              />
            </div>
            <span className={s.goalProgressText}>
              {goal.progressLabel} / {goal.targetLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
