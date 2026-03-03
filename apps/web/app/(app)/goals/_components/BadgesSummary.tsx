import type { BadgesSummaryProps } from "../goals-types";
import s from "../style.module.css";
import BadgeArt from "./BadgeArt";

export function BadgesSummary({ data, onBadgeClick }: BadgesSummaryProps) {
  return (
    <section className={s.summarySection}>
      <div className={s.summaryGrid}>
        <div className={s.summaryCard}>
          <div className={s.summaryIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M18 2H6v7a6 6 0 1012 0V2z" />
            </svg>
          </div>
          <div className={s.summaryValue}>
            {data.summary.unlockedCount}
            <span className={s.summaryTotal}>/ {data.summary.totalBadges}</span>
          </div>
          <div className={s.summaryLabel}>Badges Collected</div>
        </div>
        <div className={s.summaryCard}>
          <div className={`${s.summaryIcon} ${s.streakIcon}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
            </svg>
          </div>
          <div className={s.summaryValue}>{data.summary.weeklyStreak}</div>
          <div className={s.summaryLabel}>Week Streak</div>
        </div>
        {data.summary.nextBadge && (
          <div
            className={`${s.summaryCard} ${s.nextBadgeCard}`}
            onClick={() => onBadgeClick(data.summary.nextBadge!)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onBadgeClick(data.summary.nextBadge!);
              }
            }}
          >
            <div className={s.nextBadgePreview}>
              <BadgeArt
                badgeId={data.summary.nextBadge.id}
                icon={data.summary.nextBadge.icon}
                rarity={data.summary.nextBadge.rarity}
                unlocked={false}
                size="sm"
              />
            </div>
            <div className={s.nextBadgeInfo}>
              <div className={s.nextBadgeLabel}>Next Badge</div>
              <div className={s.nextBadgeName}>{data.summary.nextBadge.name}</div>
              <div className={s.nextBadgeProgress}>
                {data.summary.nextBadge.progress.percent}% complete
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
