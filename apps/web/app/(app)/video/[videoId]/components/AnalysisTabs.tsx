"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import styles from "./AnalysisTabs.module.css";

export type TabId = "overview" | "retention" | "seo" | "comments" | "ideas";

type Tab = {
  id: TabId;
  label: string;
};

const TABS: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "retention", label: "Retention" },
  { id: "seo", label: "SEO" },
  { id: "comments", label: "Comments" },
  { id: "ideas", label: "Ideas" },
];

type AnalysisTabsProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  disabledTabs?: TabId[];
  loadingTabs?: Partial<Record<TabId, boolean>>;
};

/**
 * AnalysisTabs - Sticky tab bar for analysis sections
 * Clean, plain text with subtle active indicator
 */
export function AnalysisTabs({
  activeTab,
  onTabChange,
  disabledTabs = [],
  loadingTabs = {},
}: AnalysisTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  // Track sticky state for visual treatment
  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) {return;}

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 1, rootMargin: "-1px 0px 0px 0px" }
    );

    observer.observe(tabs);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={tabsRef}
      className={`${styles.tabsContainer} ${isSticky ? styles.sticky : ""}`}
    >
      <div className={styles.tabsInner}>
        <nav className={styles.tabs} role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = disabledTabs.includes(tab.id);
            const isLoading = loadingTabs[tab.id] ?? false;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-disabled={isDisabled}
                disabled={isDisabled}
                onClick={() => onTabChange(tab.id)}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""} ${
                  isDisabled ? styles.tabDisabled : ""
                }`}
                type="button"
              >
                <span className={styles.tabLabel}>{tab.label}</span>
                {isLoading && <span className={styles.tabLoader} />}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

type TabPanelProps = {
  id: TabId;
  activeTab: TabId;
  children: ReactNode;
};

/**
 * TabPanel - Container for tab content
 */
export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (id !== activeTab) {return null;}

  return (
    <div role="tabpanel" aria-labelledby={`tab-${id}`} className={styles.panel}>
      {children}
    </div>
  );
}