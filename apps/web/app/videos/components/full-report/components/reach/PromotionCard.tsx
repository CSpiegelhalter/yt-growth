import type { PromotionAction } from "@/lib/features/full-report";

import { CopyButton } from "../../ui/CopyButton";
import { buildShareUrl } from "./build-share-url";
import { PlatformIcon } from "./PlatformIcon";
import s from "./reach.module.css";

type PromotionCardProps = {
  action: PromotionAction;
};

export function PromotionCard({ action }: PromotionCardProps) {
  const shareUrl = buildShareUrl(action.platform, action.target, action.draftText);

  const cardContent = (
    <>
      <div className={s.promoCardTop}>
        <span className={s.promoPlatformIcon}>
          <PlatformIcon platform={action.platform} size={16} />
        </span>
        <span className={s.promoActionText}>{action.action}</span>
      </div>
      {action.target && (
        <span className={s.promoTarget}>{action.target}</span>
      )}
      {action.draftText && (
        <div className={s.promoDraftArea}>
          <p className={s.promoDraftText}>{action.draftText}</p>
          <CopyButton text={action.draftText} variant="icon" />
        </div>
      )}
    </>
  );

  if (shareUrl) {
    return (
      <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${s.promoCardHorizontal} ${s.promoCardLink}`}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div className={s.promoCardHorizontal}>
      {cardContent}
    </div>
  );
}
