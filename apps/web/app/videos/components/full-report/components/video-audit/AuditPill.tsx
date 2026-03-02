import { Tag } from "@/components/ui/Tag";
import type { AuditItem } from "@/lib/features/full-report";

import s from "./video-audit.module.css";

type AuditPillProps = {
  item: AuditItem;
};

export function AuditPill({ item }: AuditPillProps) {
  const intent = item.passed ? "pass" : "fail";

  return (
    <span className={s.auditPillWrap} data-tooltip={item.detail || undefined}>
      <Tag size="sm" intent={intent}>
        <span className={`${s.auditPillDot} ${item.passed ? s.auditPillDotPass : s.auditPillDotFail}`} aria-hidden="true" />
        {item.criterion}
      </Tag>
    </span>
  );
}
