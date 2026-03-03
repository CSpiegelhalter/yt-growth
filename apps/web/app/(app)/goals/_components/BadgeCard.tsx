import type { BadgeCardProps } from "../goals-types";
import s from "../style.module.css";
import BadgeArt from "./BadgeArt";

export function BadgeCard({ badge, onBadgeClick }: BadgeCardProps) {
  return (
    <button
      className={`${s.badgeCard} ${badge.unlocked ? s.unlocked : ""} ${
        badge.progress.lockedReason ? s.locked : ""
      }`}
      onClick={() => onBadgeClick(badge)}
      aria-label={`${badge.name} badge - ${
        badge.unlocked
          ? "Unlocked"
          : badge.progress.lockedReason || `${badge.progress.percent}% complete`
      }`}
    >
      <div className={s.badgeArtWrap}>
        <BadgeArt
          badgeId={badge.id}
          icon={badge.icon}
          rarity={badge.rarity}
          unlocked={badge.unlocked}
          size="md"
        />
        {badge.unlocked && !badge.seen && (
          <span className={s.newPill}>NEW</span>
        )}
      </div>
      <div className={s.badgeName}>{badge.name}</div>
      <div className={s.badgeRarity} data-rarity={badge.rarity}>
        {badge.rarity}
      </div>
      {!badge.unlocked && !badge.progress.lockedReason && (
        <div className={s.badgeProgressBar}>
          <div
            className={s.badgeProgressFill}
            style={{ width: `${badge.progress.percent}%` }}
          />
        </div>
      )}
    </button>
  );
}
