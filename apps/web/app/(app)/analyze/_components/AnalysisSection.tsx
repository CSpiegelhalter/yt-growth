import type { ReactNode } from "react";

import { ReportAccordion } from "@/app/videos/components/full-report/ui/ReportAccordion";

type Props = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function AnalysisSection({ title, defaultOpen = false, children }: Props) {
  return (
    <ReportAccordion title={title} defaultOpen={defaultOpen} variant="section">
      {children}
    </ReportAccordion>
  );
}
