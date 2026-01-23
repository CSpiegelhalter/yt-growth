"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./tags.module.css";

type TabItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
};

const TABS: TabItem[] = [
  {
    id: "extractor",
    label: "Tag Finder",
    href: "/tags/extractor",
    icon: (
      <svg
        className={s.tabIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    id: "generator",
    label: "Tag Generator",
    href: "/tags/generator",
    icon: (
      <svg
        className={s.tabIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
];

/**
 * Tab navigation for the Tags tools hub.
 * 
 * Design: Large, pill-style segmented control with clear active states.
 * Each tab navigates to its own URL for SEO and shareability.
 * Fully accessible with proper ARIA roles and keyboard navigation.
 */
export function TagsTabsNav() {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === "/tags/generator") return "generator";
    return "extractor";
  };

  const activeTab = getActiveTab();

  return (
    <nav className={s.tabsContainer} aria-label="Tags tools navigation">
      <div className={s.tabsWrapper} role="tablist">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${s.tabItem} ${isActive ? s.tabItemActive : ""}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
            >
              {tab.icon}
              <span className={s.tabLabel}>{tab.label}</span>
            </Link>
          );
        })}
        <div
          className={s.tabIndicator}
          style={{
            transform: `translateX(${activeTab === "generator" ? "0" : "100%"})`,
          }}
          aria-hidden="true"
        />
      </div>
    </nav>
  );
}
