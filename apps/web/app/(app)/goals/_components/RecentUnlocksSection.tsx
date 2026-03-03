import type { RecentUnlocksSectionProps } from "../goals-types";
import s from "../style.module.css";
import BadgeArt from "./BadgeArt";

export function RecentUnlocksSection({ data, onBadgeClick }: RecentUnlocksSectionProps) {
  if (data.recentUnlocks.length === 0) {
    return null;
  }

  return (
    <section className={s.recentSection}>
      <h2 className={s.sectionTitle}>Recent Unlocks</h2>
      <div className={s.recentList}>
        {data.recentUnlocks.slice(0, 5).map((unlock) => {
          const badge = data.badges.find((b) => b.id === unlock.badgeId);
          if (!badge) {
            return null;
          }
          return (
            <div
              key={unlock.badgeId}
              className={s.recentItem}
              onClick={() => onBadgeClick(badge)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onBadgeClick(badge);
                }
              }}
            >
              <BadgeArt
                badgeId={badge.id}
                icon={badge.icon}
                rarity={badge.rarity}
                unlocked={true}
                size="sm"
              />
              <div className={s.recentInfo}>
                <span className={s.recentName}>{badge.name}</span>
                <span className={s.recentDate}>
                  {new Date(unlock.unlockedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
