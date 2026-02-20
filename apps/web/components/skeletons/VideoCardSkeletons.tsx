/**
 * Skeleton placeholder for a grid of video cards.
 * Accepts page-specific CSS module styles so each loading page
 * can use its own sizing/spacing while sharing the same markup.
 */
export function VideoCardSkeletons({
  count = 6,
  s,
}: {
  count?: number;
  s: Record<string, string>;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={s.videoCardSkeleton}>
          <div className={s.skeletonThumb} />
          <div className={s.skeletonContent}>
            <div className={s.skeletonTitle} />
            <div className={s.skeletonMeta} />
          </div>
        </div>
      ))}
    </>
  );
}
