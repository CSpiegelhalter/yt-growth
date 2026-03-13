import "@/components/learn/learn-components.css";

import { StaticNav } from "@/components/navigation/StaticNav";

/**
 * Marketing layout for static pages.
 *
 * Renders only the marketing top nav (logo + Learn/Pricing/Get Started).
 * No sidebar, no AppShell, no channel/account controls.
 *
 * Pages rendered under this layout: /, /learn/**, /privacy, /terms, /contact
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StaticNav />
      <main>{children}</main>
    </>
  );
}
