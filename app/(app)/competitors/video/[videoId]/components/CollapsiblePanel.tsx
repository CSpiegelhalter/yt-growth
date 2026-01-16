"use client";

import { useState, type ReactNode } from "react";
import s from "./CollapsiblePanel.module.css";

type Props = {
  title: string;
  icon?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
};

/**
 * CollapsiblePanel - Reusable expandable section
 *
 * Used for Positioning & Packaging, Audience Demand, and Portable Structure panels.
 */
export default function CollapsiblePanel({
  title,
  icon,
  defaultExpanded = false,
  children,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={s.panel} data-expanded={isExpanded}>
      <button
        className={s.header}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={s.headerLeft}>
          {icon && <span className={s.icon}>{icon}</span>}
          <span className={s.title}>{title}</span>
        </span>
        <span className={s.chevron} data-expanded={isExpanded}>
          ›
        </span>
      </button>
      {isExpanded && <div className={s.content}>{children}</div>}
    </div>
  );
}
