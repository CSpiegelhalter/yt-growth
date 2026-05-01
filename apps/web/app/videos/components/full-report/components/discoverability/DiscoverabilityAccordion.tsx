import type { Discoverability } from "@/lib/features/full-report";

import { DescriptionBlock } from "./DescriptionBlock";
import s from "./discoverability.module.css";
import { TagSelector } from "./TagSelector";
import { TitleOptionCard } from "./TitleOptionCard";

type DiscoverabilityAccordionProps = {
  discoverability: Discoverability;
};

export function DiscoverabilityAccordion({ discoverability }: DiscoverabilityAccordionProps) {
  const hasTitles = discoverability.titleOptions.length > 0;
  const hasDescription = Boolean(discoverability.descriptionBlock);
  const hasTags = discoverability.tags.length > 0;
  const hasThumbnails = discoverability.thumbnailConcepts.length > 0;

  if (!hasTitles && !hasDescription && !hasTags && !hasThumbnails) {
    return (
      <p className={s.flatEmpty}>
        No discoverability suggestions available.
      </p>
    );
  }

  return (
    <div className={s.flatPanel}>
      {hasTitles && (
        <section className={s.flatBlock}>
          <h4 className={s.blockTitle}>Title alternatives</h4>
          <div className={s.titleOptions}>
            {discoverability.titleOptions.map((option) => (
              <TitleOptionCard key={option.text} option={option} />
            ))}
          </div>
        </section>
      )}

      {hasDescription && (
        <section className={s.flatBlock}>
          <h4 className={s.blockTitle}>Description</h4>
          <DescriptionBlock description={discoverability.descriptionBlock} />
        </section>
      )}

      {hasTags && (
        <section className={s.flatBlock}>
          <h4 className={s.blockTitle}>Tags</h4>
          <TagSelector tags={discoverability.tags} />
        </section>
      )}

      {hasThumbnails && (
        <section className={s.flatBlock}>
          <h4 className={s.blockTitle}>Thumbnail concepts</h4>
          <ul className={s.thumbnailList}>
            {discoverability.thumbnailConcepts.map((concept) => (
              <li key={concept.name} className={s.thumbnailItem}>
                <div className={s.thumbnailHead}>
                  <span className={s.thumbnailName}>{concept.name}</span>
                  {concept.overlayText && (
                    <span className={s.thumbnailOverlay}>{concept.overlayText}</span>
                  )}
                </div>
                <p className={s.thumbnailDetail}>
                  <span className={s.thumbnailDetailLabel}>Composition: </span>
                  {concept.composition}
                </p>
                {concept.colorScheme && (
                  <p className={s.thumbnailDetail}>
                    <span className={s.thumbnailDetailLabel}>Colors: </span>
                    {concept.colorScheme}
                  </p>
                )}
                {concept.emotionToConvey && (
                  <p className={s.thumbnailDetail}>
                    <span className={s.thumbnailDetailLabel}>Feeling: </span>
                    {concept.emotionToConvey}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
