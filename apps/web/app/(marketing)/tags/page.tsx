import { redirect } from "next/navigation";

/**
 * Tags hub index page.
 * Redirects to /tags/extractor (Tag Finder) as the default tool.
 */
export default function TagsPage() {
  redirect("/tags/extractor");
}
