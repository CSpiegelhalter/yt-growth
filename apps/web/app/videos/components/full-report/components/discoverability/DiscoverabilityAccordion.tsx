import type { Discoverability } from "@/lib/features/full-report";

import { ReportAccordion } from "../../ui/ReportAccordion";
import { DescriptionBlock } from "./DescriptionBlock";
import s from "./discoverability.module.css";
import { TagSelector } from "./TagSelector";
import { TitleOptionCard } from "./TitleOptionCard";

type DiscoverabilityAccordionProps = {
  discoverability: Discoverability;
};

export function DiscoverabilityAccordion({ discoverability }: DiscoverabilityAccordionProps) {
  return (
    <div className={s.discoverabilitySubAccordions}>
      {discoverability.titleOptions.length > 0 && (
        <ReportAccordion title="Titles" variant="sub">
          <div className={s.titleOptions}>
            {discoverability.titleOptions.map((option) => (
              <TitleOptionCard key={option.text} option={option} />
            ))}
          </div>
        </ReportAccordion>
      )}

      {discoverability.descriptionBlock && (
        <ReportAccordion title="Description" variant="sub">
          <DescriptionBlock description={discoverability.descriptionBlock} />
        </ReportAccordion>
      )}

      {discoverability.tags.length > 0 && (
        <ReportAccordion title="Tags" variant="sub">
          <TagSelector tags={discoverability.tags} />
        </ReportAccordion>
      )}

    </div>
  );
}
