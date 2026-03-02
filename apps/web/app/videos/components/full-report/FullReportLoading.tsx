import { Skeleton } from "@/components/ui/Skeleton";

import s from "./full-report.module.css";

export function FullReportLoading() {
  return (
    <div className={s.reportSkeleton}>
      <Skeleton variant="rect" height="80px" width="100%" />
      <Skeleton variant="rect" height="52px" width="100%" />
      <Skeleton variant="rect" height="52px" width="100%" />
      <Skeleton variant="rect" height="52px" width="100%" />
      <Skeleton variant="rect" height="52px" width="100%" />
      <span className={s.skeletonLabel}>Generating full report...</span>
    </div>
  );
}
