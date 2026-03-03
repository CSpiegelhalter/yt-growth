"use client";

import s from "../style.module.css";

type SuccessAlertProps = {
  message: string;
  onDismiss: () => void;
};

export function SuccessAlert({ message, onDismiss }: SuccessAlertProps) {
  return (
    <button
      type="button"
      className={s.successAlert}
      onClick={onDismiss}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
      {message}
    </button>
  );
}
