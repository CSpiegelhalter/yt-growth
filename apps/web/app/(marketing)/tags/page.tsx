import { permanentRedirect } from "next/navigation";

/**
 * Tags hub index page.
 * 301 permanent redirect to /tags/extractor (Tag Finder) as the default tool.
 */
export default function TagsPage() {
  permanentRedirect("/tags/extractor");
}
