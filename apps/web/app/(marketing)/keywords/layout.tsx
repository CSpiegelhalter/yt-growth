import type { Metadata } from "next";
import { BRAND, CANONICAL_ORIGIN } from "@/lib/shared/brand";

export const metadata: Metadata = {
  title: `YouTube Keyword Research Tool | ${BRAND.name}`,
  description:
    "Free YouTube keyword research tool. Find video topics with search volume, difficulty, YouTube rankings, and AI-generated video ideas.",
  alternates: {
    canonical: `${CANONICAL_ORIGIN}/keywords`,
  },
  openGraph: {
    title: `YouTube Keyword Research Tool | ${BRAND.name}`,
    description:
      "Free YouTube keyword research tool. Find video topics with search volume, difficulty, and related keyword ideas.",
    url: `${CANONICAL_ORIGIN}/keywords`,
  },
};

/**
 * Layout for the unified Keywords research page.
 * The page itself handles all routing (no sub-routes needed).
 */
export default function KeywordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
