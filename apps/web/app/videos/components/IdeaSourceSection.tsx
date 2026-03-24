import { SourceVideoCard } from "@/components/features/ideas/source-video-card";
import type { SourceProvenance } from "@/lib/features/suggestions/types";

import s from "./idea-source-section.module.css";

type IdeaSourceSectionProps = {
  provenance: SourceProvenance | null;
};

export function IdeaSourceSection({ provenance }: IdeaSourceSectionProps) {
  if (!provenance) {return null;}

  return (
    <section className={s.section}>
      <h4 className={s.heading}>Source Intelligence</h4>
      <div className={s.videos}>
        {provenance.sourceVideos.map((video) => (
          <SourceVideoCard key={video.videoId} video={video} />
        ))}
      </div>
      <div className={s.details}>
        <p className={s.detail}>
          <strong>Pattern:</strong> {provenance.pattern}
        </p>
        <p className={s.detail}>
          <strong>Why it works:</strong> {provenance.rationale}
        </p>
        <p className={s.detail}>
          <strong>Adaptation angle:</strong> {provenance.adaptationAngle}
        </p>
      </div>
    </section>
  );
}
