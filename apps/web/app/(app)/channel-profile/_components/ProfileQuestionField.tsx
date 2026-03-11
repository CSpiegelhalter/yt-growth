"use client";

import type { ReactNode } from "react";

import s from "./ProfileQuestionField.module.css";

type Props = {
  label: string;
  showSuggest?: boolean;
  suggestLoading?: boolean;
  onSuggest?: () => void;
  children: ReactNode;
};

function SparkleIcon() {
  return (
    <svg
      className={s.suggestIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14z" />
    </svg>
  );
}

export function ProfileQuestionField({
  label,
  showSuggest = false,
  suggestLoading = false,
  onSuggest,
  children,
}: Props) {
  return (
    <div className={s.field}>
      <div className={s.header}>
        <h3 className={s.label}>{label}</h3>
        {showSuggest && (
          <button
            type="button"
            className={s.suggestBtn}
            onClick={onSuggest}
            disabled={suggestLoading}
            aria-label={`Get AI suggestion for ${label}`}
          >
            <SparkleIcon />
            {suggestLoading ? "Suggesting..." : "Suggest"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
