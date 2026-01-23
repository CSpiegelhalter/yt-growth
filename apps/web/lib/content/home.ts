/**
 * Home page content - SEO-optimized copy for the landing page
 * Additional content section to improve text-to-HTML ratio
 */

import { BRAND } from "@/lib/brand";

export const HOME_CONTENT = {
  seoSection: {
    title: `Grow Faster on YouTube with ${BRAND.name}`,
    intro: `${BRAND.name} is a complete YouTube growth platform built for creators who want to make data-driven content decisions. 
Instead of guessing what to post next, you get clear insights into what's working—and what isn't.`,

    paragraphs: [
      {
        heading: "Analytics That Actually Help You Grow",
        text: `Most YouTube analytics tools show you numbers without context. ${BRAND.name} goes deeper. We analyze your retention curves to show exactly where viewers drop off, compare your performance against similar channels in your niche, and identify which videos are converting viewers into subscribers. You'll finally understand why some videos perform better than others.`,
      },
      {
        heading: "Never Run Out of Video Ideas",
        text: `Creator's block is real. Our AI-powered video ideas engine analyzes what's trending in your niche, identifies gaps in the content landscape, and generates personalized ideas complete with title options, hook suggestions, and thumbnail concepts. Every idea is backed by data from videos that are actually performing well.`,
      },
      {
        heading: "Learn From Your Competition",
        text: `The fastest way to grow is to learn from channels that are already succeeding. ${BRAND.name} tracks competitor videos and surfaces outliers—videos that dramatically outperform a channel's average. When you see what topics, formats, and packaging are working for others, you can adapt those strategies for your own content.`,
      },
    ],

    whoItsFor: {
      title: "Who Uses ChannelBoost",
      items: [
        "YouTubers with 1K to 100K subscribers looking to accelerate growth",
        "Creators stuck at a plateau who need fresh strategies",
        "Channels launching new content formats or niches",
        "Video teams who want data to inform their content calendar",
        "Educators and course creators building authority on YouTube",
        "Gaming, tech, and lifestyle creators optimizing for the algorithm",
      ],
    },

    howItWorks: {
      title: "Start Growing in Three Steps",
      steps: [
        {
          title: "Connect Your Channel",
          description:
            "Link your YouTube channel with one click using secure Google OAuth. We only request read-only access to your analytics—we never post or modify anything on your channel.",
        },
        {
          title: "Get Personalized Insights",
          description:
            "Within minutes, you'll see a full audit of your channel including retention analysis, subscriber driver identification, and comparison against channels in your niche.",
        },
        {
          title: "Take Action and Grow",
          description:
            "Use our AI video ideas, competitor research, and actionable recommendations to create content that actually performs. Track your progress as your channel grows.",
        },
      ],
    },

    useCases: {
      title: "What Creators Use ChannelBoost For",
      items: [
        "Diagnosing why recent videos aren't getting impressions",
        "Finding the optimal video length for their audience",
        "Discovering trending topics before they saturate",
        "A/B testing thumbnail and title strategies",
        "Understanding which content converts viewers to subscribers",
        "Planning content calendars based on data, not hunches",
        "Identifying their most engaging video segments to replicate",
        "Benchmarking performance against competitors",
      ],
    },

    callout: {
      text: `Join thousands of creators who use ${BRAND.name} to make smarter content decisions. 
Connect your channel for free and see your first insights in under 2 minutes.`,
    },
  },

  additionalFaq: [
    {
      question: "Is ChannelBoost free to use?",
      answer:
        "You can connect your channel and see basic insights for free. Pro features like unlimited video ideas, advanced retention analysis, and competitor tracking require a subscription.",
    },
    {
      question: "How is ChannelBoost different from YouTube Studio?",
      answer:
        "YouTube Studio shows you raw data. ChannelBoost interprets that data and gives you specific, actionable recommendations. We also add competitor analysis, AI video ideas, and niche benchmarking that YouTube doesn't provide.",
    },
    {
      question: "Is my channel data secure?",
      answer:
        "Yes. We use OAuth 2.0 for authentication (we never see your password), request only read-only analytics access, and encrypt all stored data. We never share your information with third parties.",
    },
  ],
} as const;
