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
    id: "generator",
    label: "Generator",
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
      >
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
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
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
];

/**
 * Tabs navigation for the Tags hub.
 * Uses client-side navigation for instant tab switching.
 * Maintains deep link compatibility (/tags/generator, /tags/extractor).
 */
export function TagsTabsNav() {
  const pathname = usePathname();

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname === "/tags/extractor") return "extractor";
    // Default to generator for /tags or /tags/generator
    return "generator";
  };

  const activeTab = getActiveTab();

  return (
    <nav className={s.tabsNav} role="tablist" aria-label="Tags tools">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`${s.tabButton} ${isActive ? s.tabButtonActive : ""}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
