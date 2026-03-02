import type { ReactNode } from "react";

import s from "./ui.module.css";

type ReportAccordionProps = {
  title: string;
  defaultOpen?: boolean;
  variant: "section" | "sub";
  badge?: ReactNode;
  children: ReactNode;
};

export function ReportAccordion({ title, defaultOpen, variant, badge, children }: ReportAccordionProps) {
  const itemClass = variant === "section" ? "accordion__item" : "accordion__item accordion__item--sub";

  return (
    <details className={itemClass} open={defaultOpen}>
      <summary className="accordion__trigger">
        <span className={badge ? `accordion__title ${s.accordionTitleFlex}` : "accordion__title"}>
          {title}
          {badge}
        </span>
        <svg
          className="accordion__chevron"
          width={variant === "sub" ? 14 : 18}
          height={variant === "sub" ? 14 : 18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div className="accordion__content">
        {children}
      </div>
    </details>
  );
}
