"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/ui";

const TABS = [
  {
    id: "extractor",
    label: "Tag Finder",
    href: "/tags/extractor",
    icon: (
      <svg
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
 * Uses the unified Tabs component for consistent styling.
 */
export function TagsTabsNav() {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === "/tags/generator") return "generator";
    return "extractor";
  };

  const activeTab = getActiveTab();

  return (
    <Tabs items={TABS} activeId={activeTab} ariaLabel="Tags tools navigation" />
  );
}
