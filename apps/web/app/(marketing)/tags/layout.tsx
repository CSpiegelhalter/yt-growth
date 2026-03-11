import type { Metadata } from "next";

import { PageContainer } from "@/components/ui";
import { BRAND, CANONICAL_ORIGIN } from "@/lib/shared/brand";

export const metadata: Metadata = {
  title: `YouTube Tags Extractor — Find Tags From Any Video | ${BRAND.name}`,
  description:
    "Free YouTube tag extractor: Find the exact tags used by any YouTube video. Discover competitor keywords and improve your video SEO.",
  alternates: {
    canonical: `${CANONICAL_ORIGIN}/tags`,
  },
  openGraph: {
    title: `YouTube Tags Extractor — Find Tags From Any Video | ${BRAND.name}`,
    description:
      "Free YouTube tag extractor: Find the exact tags used by any YouTube video. Discover competitor keywords and improve your video SEO.",
    url: `${CANONICAL_ORIGIN}/tags`,
  },
};

/**
 * Layout for the /tags page.
 * This layout is public (no auth required) and renders within the marketing shell.
 */
export default function TagsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer>
      {children}
    </PageContainer>
  );
}
