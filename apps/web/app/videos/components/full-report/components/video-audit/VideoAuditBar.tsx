import { useMemo } from "react";

import type { VideoAudit } from "@/lib/features/full-report";

import { AuditPill } from "./AuditPill";
import s from "./video-audit.module.css";

type VideoAuditBarProps = {
  audit: VideoAudit;
};

export function VideoAuditBar({ audit }: VideoAuditBarProps) {
  const { failed, passed } = useMemo(() => {
    const fail = audit.items.filter((i) => !i.passed);
    const pass = audit.items.filter((i) => i.passed);
    return { failed: fail, passed: pass };
  }, [audit.items]);

  return (
    <section className={s.section}>
      <div className={s.auditHeader}>
        <h3 className={s.sectionHeader}>Video Audit</h3>
        <span className={s.auditSummary}>
          {failed.length} Failed | {passed.length} Passed
        </span>
      </div>

      {audit.items.length > 0 ? (
        <>
          {failed.length > 0 && (
            <div className={s.auditGroup}>
              <span className={s.auditGroupLabel}>Priority Fixes</span>
              <div className={s.auditPillRow}>
                {failed.map((item) => (
                  <AuditPill key={item.criterion} item={item} />
                ))}
              </div>
            </div>
          )}
          {passed.length > 0 && (
            <div className={s.auditGroup}>
              <span className={s.auditGroupLabel}>Wins</span>
              <div className={s.auditPillRow}>
                {passed.map((item) => (
                  <AuditPill key={item.criterion} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className={s.emptyState}>No audit data available</p>
      )}
    </section>
  );
}
