import type { ReactNode } from "react";

import s from "./tags.module.css";

type SeoAccordionProps = {
  title: string;
  children: ReactNode;
};

export function SeoAccordion({ title, children }: SeoAccordionProps) {
  return (
    <details className={s.seoAccordion}>
      <summary className={s.seoAccordionTrigger}>
        <svg
          className={s.seoAccordionChevron}
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
        <span className={s.seoAccordionTitle}>{title}</span>
      </summary>
      <div className={s.seoAccordionContent}>{children}</div>
    </details>
  );
}
