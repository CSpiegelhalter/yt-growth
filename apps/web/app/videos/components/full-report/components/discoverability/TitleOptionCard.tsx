import type { TitleOption } from "@/lib/features/full-report";

import { CopyButton } from "../../ui/CopyButton";
import s from "./discoverability.module.css";
import { getStatClass } from "./get-stat-class";
import { parseTitleStats } from "./parse-title-stats";

type TitleOptionCardProps = {
  option: TitleOption;
};

export function TitleOptionCard({ option }: TitleOptionCardProps) {
  const stats = parseTitleStats(option.stats);

  return (
    <div className={s.titleOptionCard}>
      <div className={s.titleOptionTop}>
        <span className={s.titleLabel}>{option.type}</span>
        <div className={s.titleStats}>
          {stats.map((stat) => (
            <span
              key={stat.key}
              className={`${s.statChip} ${getStatClass(stat.key, stat.value, s)}`}
            >
              {stat.key}: <strong>{stat.value}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className={s.titleOptionBottom}>
        <span className={s.titleText}>{option.text}</span>
        <CopyButton text={option.text} variant="icon" />
      </div>
    </div>
  );
}
