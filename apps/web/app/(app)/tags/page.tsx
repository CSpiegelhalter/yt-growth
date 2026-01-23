import { redirect } from "next/navigation";

/**
 * Tags hub index page.
 * Redirects to /tags/generator as the default tool.
 */
export default function TagsPage() {
  redirect("/tags/generator");
}
