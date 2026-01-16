import { ReactNode } from "react";

type AccordionItemProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

/**
 * AccordionItem - Single collapsible item using native details/summary
 * No JavaScript required, fully accessible
 */
export function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  return (
    <details className="accordion__item" open={defaultOpen}>
      <summary className="accordion__trigger">
        <span className="accordion__title">{title}</span>
        <svg
          className="accordion__chevron"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div className="accordion__content">{children}</div>
    </details>
  );
}

type LearnAccordionProps = {
  children: ReactNode;
};

/**
 * LearnAccordion - Container for accordion items
 * Uses native HTML details/summary for zero-JS accordion
 */
export function LearnAccordion({ children }: LearnAccordionProps) {
  return <div className="accordion">{children}</div>;
}
