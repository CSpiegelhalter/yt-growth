import type { Metadata } from "next";
import { BRAND, CANONICAL_ORIGIN } from "@/lib/shared/brand";
import { TagsTabsNav } from "./TagsTabsNav";
import s from "./tags.module.css";

export const metadata: Metadata = {
  title: `YouTube Tags Tools — Generator & Tag Finder | ${BRAND.name}`,
  description:
    "Free YouTube tag tools: Generate optimized tags for your videos or find tags used by any YouTube video. Improve discoverability with the right keywords.",
  alternates: {
    canonical: `${CANONICAL_ORIGIN}/tags`,
  },
  openGraph: {
    title: `YouTube Tags Tools — Generator & Tag Finder | ${BRAND.name}`,
    description:
      "Free YouTube tag tools: Generate optimized tags for your videos or find tags used by any YouTube video.",
    url: `${CANONICAL_ORIGIN}/tags`,
  },
};

/**
 * Shared layout for Tags hub pages.
 * Provides consistent header and tab navigation across /tags, /tags/generator, /tags/extractor.
 * 
 * This layout is public (no auth required) and renders within the marketing shell.
 */
export default function TagsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={s.pageWrapper}>
      <TagsTabsNav />
      <div className={s.pageContent}>
        {children}
      </div>
    </div>
  );
}
