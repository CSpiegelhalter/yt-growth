type Props = {
  readingTime: string;
};

/**
 * ArticleMeta - Display article metadata (reading time)
 * 
 * Shows estimated reading time for E-E-A-T signals.
 */
export function ArticleMeta({ readingTime }: Props) {
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
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        {readingTime}
      </span>
    </div>
  );
}

