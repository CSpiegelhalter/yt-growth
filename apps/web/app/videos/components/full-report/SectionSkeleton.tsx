import { Skeleton } from "@/components/ui/Skeleton";
import type { ReportSectionKey } from "@/lib/features/full-report";

import s from "./full-report.module.css";

type SectionSkeletonProps = {
  variant: ReportSectionKey;
};

const HEIGHT_MAP: Record<ReportSectionKey, string> = {
  videoAudit: "80px",
  discoverability: "52px",
  promotionPlaybook: "52px",
  retention: "52px",
  hookAnalysis: "52px",
};

export function SectionSkeleton({ variant }: SectionSkeletonProps) {
  return (
    <div className={s.reportSkeleton}>
      <Skeleton variant="rect" height={HEIGHT_MAP[variant]} width="100%" />
    </div>
  );
}
