type Props = {
  points: string[];
};

/**
 * KeyTakeaways - End-of-section summary (2-4 bullets)
 * Helps scanners get value without reading full section
 */
export function KeyTakeaways({ points }: Props) {
  if (points.length === 0) return null;

  return (
    <div className="keyTakeaways">
      <p className="keyTakeaways__label">Key takeaways</p>
      <ul className="keyTakeaways__list">
        {points.map((point, i) => (
          <li key={i}>{point}</li>
        ))}
      </ul>
    </div>
  );
}
