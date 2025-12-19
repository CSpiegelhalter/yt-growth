import { redirect } from "next/navigation";

/**
 * Redirect from /similar to /competitors
 * The "Similar" page has been renamed to "Competitor Winners"
 */
export default function SimilarPage() {
  redirect("/competitors");
}
