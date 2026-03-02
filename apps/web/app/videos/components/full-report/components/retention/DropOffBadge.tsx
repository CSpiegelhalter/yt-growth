import s from "./retention.module.css";

type DropOffBadgeProps = {
  percentDrop: string;
};

export function DropOffBadge({ percentDrop }: DropOffBadgeProps) {
  const num = Number.parseInt(percentDrop.replaceAll(/[^0-9]/g, ""), 10);

  let colorClass = s.dropNeutral;
  if (num > 10) {
    colorClass = s.dropHigh;
  } else if (num >= 5) {
    colorClass = s.dropMedium;
  }

  return (
    <span className={`${s.dropOffBadge} ${colorClass}`}>
      {percentDrop}
    </span>
  );
}
