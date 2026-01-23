import type { Metadata } from "next";
import { CANONICAL_ORIGIN } from "@/lib/brand";
import { TagExtractorClient } from "./TagExtractorClient";

export const metadata: Metadata = {
  title: "YouTube Tag Finder — Find Tags Used by Any Video",
  description:
    "Paste a YouTube video URL to discover the tags used by that video. Analyze competitor tags, find keyword opportunities, and improve your video SEO strategy.",
  alternates: {
    canonical: `${CANONICAL_ORIGIN}/tags/extractor`,
  },
  openGraph: {
    title: "YouTube Tag Finder — Find Tags Used by Any Video",
    description:
      "Paste a YouTube video URL to discover the tags used by that video. Analyze competitor tags and improve your SEO.",
    url: `${CANONICAL_ORIGIN}/tags/extractor`,
  },
};

// FAQ Schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I find tags on a YouTube video?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "YouTube doesn't publicly display video tags in the interface. However, you can use our Tag Finder tool to extract tags from any YouTube video by simply pasting the video URL. We use the YouTube Data API to retrieve the tags that creators have added to their videos.",
      },
    },
    {
      "@type": "Question",
      name: "Does YouTube show tags publicly?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No, YouTube removed public tag visibility in 2018. Tags are no longer visible on the video page or in the page source. To see a video's tags, you need to use external tools like our Tag Finder that access the YouTube Data API.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use competitor tags on my videos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you can use similar tags to your competitors, but only if they're genuinely relevant to your content. Never copy tags that don't accurately describe your video—YouTube may penalize misleading tags. Use competitor tags as inspiration to identify keywords you might have missed.",
      },
    },
    {
      "@type": "Question",
      name: "Why do tags matter on YouTube?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "YouTube tags help the algorithm understand your video's content and can improve discoverability, especially for misspelled searches. However, tags have a minor impact compared to title, description, and watch time. Focus on those first, then use tags to reinforce your main keywords.",
      },
    },
    {
      "@type": "Question",
      name: "How many tags should I use on YouTube?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "YouTube allows up to 500 characters of tags total. Most successful videos use 5-15 relevant tags. Quality matters more than quantity—focus on your primary keywords, common misspellings, and related terms. Avoid using irrelevant tags just to fill the limit.",
      },
    },
  ],
};

/**
 * Tag Finder (Extractor) page.
 * Allows users to paste a YouTube URL and extract the tags used by that video.
 * Public page - no auth required.
 */
export default function TagExtractorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <TagExtractorClient />
    </>
  );
}
