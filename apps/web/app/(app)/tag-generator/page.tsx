import { permanentRedirect } from "next/navigation";

/**
 * Old TagGeneratorPage - Permanently redirects to /tags/generator
 * 
 * This page was moved to /tags/generator as part of the Tags hub consolidation.
 * We use permanentRedirect (301) for SEO to transfer any link equity.
 */
export default function TagGeneratorPage() {
  permanentRedirect("/tags/generator");
}
