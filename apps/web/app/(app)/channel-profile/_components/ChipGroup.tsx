"use client";

import s from "./ChipGroup.module.css";

type Props = {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
};

export function ChipGroup({
  options,
  selected,
  onToggle,
  disabled = false,
  ariaLabel,
}: Props) {
  return (
    <div className={s.chipGroup} role="group" aria-label={ariaLabel}>
      {options.map((item) => (
        <button
          key={item}
          type="button"
          className={`${s.chip} ${selected.includes(item) ? s.chipSelected : ""}`}
          aria-pressed={selected.includes(item)}
          onClick={() => onToggle(item)}
          disabled={disabled}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
