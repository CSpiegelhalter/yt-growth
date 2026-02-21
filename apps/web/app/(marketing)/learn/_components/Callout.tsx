import type { ReactNode } from "react";

type CalloutVariant = "tip" | "warning" | "info" | "example";

type Props = {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
};

const icons: Record<CalloutVariant, ReactNode> = {
  tip: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 2v1M4.22 4.22l.71.71M1 12h2M18.36 4.93l.71-.71M23 12h-2" />
      <path d="M15.5 15a3.5 3.5 0 10-7 0c0 1.57.75 2.97 1.91 3.85.34.26.59.63.59 1.06V21h4v-1.09c0-.43.25-.8.59-1.06A3.98 3.98 0 0015.5 15z" />
      <path d="M9 18h6" />
    </svg>
  ),
  warning: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  example: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
};

/**
 * Callout - Highlighted block for tips, warnings, info, and examples
 * Server-rendered, no JS required
 */
export function Callout({ variant = "info", title, children }: Props) {
  return (
    <aside className={`callout callout--${variant}`} role="note">
      <div className="callout__icon">{icons[variant]}</div>
      <div className="callout__content">
        {title && <p className="callout__title">{title}</p>}
        <div className="callout__body">{children}</div>
      </div>
    </aside>
  );
}
