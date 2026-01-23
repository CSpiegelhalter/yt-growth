type Props = {
  points: string[];
  timeEstimate?: string;
  audience?: string;
};

/**
 * QuickSummary - Hero card with 3-5 key points for scanners
 * Server-rendered, provides immediate value
 */
export function QuickSummary({ points, timeEstimate, audience }: Props) {
  return (
    <div className="quickSummary">
      <div className="quickSummary__header">
        <h2 className="quickSummary__title">Quick Summary</h2>
        {(timeEstimate || audience) && (
          <div className="quickSummary__meta">
            {timeEstimate && (
              <span className="quickSummary__metaItem">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {timeEstimate}
              </span>
            )}
            {audience && (
              <span className="quickSummary__metaItem">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                {audience}
              </span>
            )}
          </div>
        )}
      </div>
      <ul className="quickSummary__list">
        {points.map((point, i) => (
          <li key={i} className="quickSummary__point">
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
