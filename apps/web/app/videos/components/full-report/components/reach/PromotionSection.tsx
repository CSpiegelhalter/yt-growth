import type { PromotionAction } from "@/lib/features/full-report";

import { PromotionCard } from "./PromotionCard";
import s from "./reach.module.css";

type PromotionSectionProps = {
  actions: PromotionAction[];
};

export function PromotionSection({ actions }: PromotionSectionProps) {
  if (actions.length === 0) { return null; }

  return (
    <div className={s.promoList}>
      {actions.map((action, i) => (
        <PromotionCard key={`${action.type}-${action.platform}-${i}`} action={action} />
      ))}
    </div>
  );
}
