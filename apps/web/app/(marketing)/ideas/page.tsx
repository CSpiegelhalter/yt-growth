import type { Metadata } from "next";
import { BRAND, CANONICAL_ORIGIN, STRUCTURED_DATA } from "@/lib/brand";
import { IdeasPublicClient } from "./IdeasPublicClient";

/**
 * SEO Metadata - optimized for "video ideas" keyword
 */
export const metadata: Metadata = {
  title: "Video Ideas Generator — Get Better YouTube Video Ideas Fast",
  description:
    "Generate unique video ideas backed by data from your niche. Get titles, hooks, and concepts that work. Free to try, no account required to browse.",
  keywords: [
    "video ideas",
    "youtube video ideas",
    "content ideas",
    "video topic ideas",
    "shorts ideas",
    "youtube content ideas",
    "video idea generator",
    "youtube video topic generator",
  ],
  alternates: {
    canonical: `${CANONICAL_ORIGIN}/ideas`,
  },
  openGraph: {
    title: "Video Ideas Generator — Get Better YouTube Video Ideas Fast",
    description:
      "Generate unique video ideas backed by data from your niche. Get titles, hooks, and concepts that work.",
    url: `${CANONICAL_ORIGIN}/ideas`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video Ideas Generator",
    description:
      "Generate unique video ideas backed by data from your niche. Get titles, hooks, and concepts that work.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

/**
 * FAQ Schema for SEO
 */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I come up with video ideas for YouTube?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The best video ideas come from understanding what's already working in your niche. Look at trending topics, analyze competitors' successful videos, and identify gaps you can fill with your unique perspective. Our Video Ideas Generator automates this research by analyzing what's performing well and suggesting data-backed ideas tailored to your content style.",
      },
    },
    {
      "@type": "Question",
      name: "What makes a good YouTube video idea?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A good YouTube video idea has three elements: proven demand (people are searching for it), a clear hook (why someone would click), and a unique angle (what makes your take different). The best ideas also match your channel's style and your ability to deliver quality content on that topic.",
      },
    },
    {
      "@type": "Question",
      name: "How do I find trending video topics in my niche?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Monitor similar channels for videos getting unusual view velocity, check YouTube's trending page filtered by your category, use tools like Google Trends for topic research, and pay attention to comments asking questions you could answer. Our tool analyzes recent winners from channels in your niche to surface what's working right now.",
      },
    },
    {
      "@type": "Question",
      name: "Should I make YouTube Shorts or long-form videos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Both formats have value. Shorts are great for growing reach and testing ideas quickly—they require less production time and can go viral more easily. Long-form videos build deeper engagement and typically generate more revenue. Many successful creators use Shorts to attract new viewers and long-form to convert them into loyal subscribers.",
      },
    },
    {
      "@type": "Question",
      name: "How often should I post new videos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Consistency matters more than frequency. Choose a schedule you can maintain—whether that's once a week or three times a week—and stick to it. Quality should never suffer for quantity. Most successful channels post 1-3 times per week, but some niches support daily uploads while others thrive with less frequent, higher-production content.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use competitor video ideas for my own channel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, but add your unique angle. Analyzing what works for competitors is smart research—the key is not to copy, but to understand why something worked and how you can approach the same topic differently. Add your expertise, personality, or a fresh perspective that the original didn't cover.",
      },
    },
  ],
};

/**
 * SoftwareApplication Schema
 */
const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: `${BRAND.name} Video Ideas Generator`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: `${CANONICAL_ORIGIN}/ideas`,
  description:
    "Generate data-backed video ideas for your YouTube channel. Get titles, hooks, and content concepts based on what's working in your niche.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to try with one generation",
  },
  aggregateRating: STRUCTURED_DATA.softwareApplication.aggregateRating,
};

/**
 * Breadcrumb Schema
 */
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: CANONICAL_ORIGIN,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Video Ideas Generator",
      item: `${CANONICAL_ORIGIN}/ideas`,
    },
  ],
};

/**
 * Video Ideas Generator - Public SEO Landing Page
 *
 * This page is publicly accessible for SEO purposes.
 * Users can view the page without authentication.
 * Generation requires sign-in and is gated by trial/subscription.
 */
export default function IdeasPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <IdeasPublicClient />
    </>
  );
}
