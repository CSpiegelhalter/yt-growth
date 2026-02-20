"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "../../style.module.css";

interface TocItem {
  readonly id: string;
  readonly label: string;
  readonly level?: number;
}

interface ActiveTocProps {
  items: readonly TocItem[];
  title?: string;
}

export function ActiveToc({ items, title = "In this guide" }: ActiveTocProps) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${id}`);
      }
    },
    [],
  );

  useEffect(() => {
    const ids = items.map((item) => item.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    for (const el of elements) {
      observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <>
      {/* Desktop: sticky sidebar TOC */}
      <nav
        className={styles.shellSidebar}
        aria-label={title}
      >
        <div className={styles.shellSidebarInner}>
          <p className={styles.shellTocTitle}>{title}</p>
          <ol className={styles.shellTocList}>
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={`${styles.shellTocLink} ${activeId === item.id ? styles.shellTocLinkActive : ""}`}
                  data-level={item.level ?? 2}
                  aria-current={activeId === item.id ? "location" : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* Mobile: collapsible TOC */}
      <nav
        className={styles.shellMobileToc}
        aria-label={title}
      >
        <details className={styles.shellMobileTocDetails}>
          <summary className={styles.shellMobileTocSummary}>
            <span>{title}</span>
            <svg
              className={styles.shellMobileTocChevron}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <ol className={styles.shellMobileTocList}>
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={`${styles.shellTocLink} ${activeId === item.id ? styles.shellTocLinkActive : ""}`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </details>
      </nav>
    </>
  );
}
