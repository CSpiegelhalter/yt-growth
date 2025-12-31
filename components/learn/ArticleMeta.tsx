type Props = {
  dateModified: string;
  readingTime: string;
};

/**
 * ArticleMeta - Display article metadata (date, reading time)
 * 
 * Shows last updated date and estimated reading time for E-E-A-T signals.
 */
export function ArticleMeta({ dateModified, readingTime }: Props) {
  // Format date for display: "Dec 30, 2025"
  const formattedDate = new Date(dateModified).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="articleMeta">
      <span className="articleMeta__item">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        Updated {formattedDate}
      </span>
      <span className="articleMeta__divider" aria-hidden="true">·</span>
      <span className="articleMeta__item">
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
          <path d="M12 6v6l4 2" />
        </svg>
        {readingTime}
      </span>
    </div>
  );
}

