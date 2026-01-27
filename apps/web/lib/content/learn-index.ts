/**
 * Learn index page content - SEO-optimized copy for the learning center
 * Improves text-to-HTML ratio with category descriptions and FAQ
 */

import { BRAND } from "@/lib/brand";

export const LEARN_INDEX_CONTENT = {
  hero: {
    title: "YouTube Growth Guides",
    titleAccent: "With Data-Driven Strategies",
    subtitle: `Free guides and tutorials to help you understand your analytics, optimize your content, and grow faster. No fluff, just actionable insights from years of studying what works on the platform.`,
  },

  intro: {
    text: `Growing a YouTube channel takes more than just uploading videos. You need to understand your analytics, learn from what's working (and what isn't), and consistently create content your audience wants to watch. These guides break down the strategies that actually work—backed by data, not guesswork. Whether you're trying to get your first 1,000 subscribers, improve your retention rates, or understand why the algorithm isn't recommending your videos, you'll find practical answers here. Every guide is written by creators who have analyzed thousands of channels and millions of data points to identify what separates growing channels from stagnant ones.`,

    highlights: [
      "Written for creators at any level, from beginners to established channels with millions of views",
      "Practical advice you can apply to your next video, including step-by-step checklists",
      "Updated regularly with the latest algorithm insights and platform changes for 2026",
      "Free forever with no signup required—read everything without creating an account",
    ],
  },

  categories: [
    {
      id: "analytics",
      title: "Analytics & Auditing",
      description: `Your YouTube analytics tell a story—if you know how to read them. Learn to interpret retention curves, understand where your traffic comes from, and audit your channel for growth opportunities. Many creators upload videos without ever checking their analytics, missing critical insights about why some videos perform and others don't. These skills are the foundation of any successful content strategy, helping you make informed decisions instead of guessing what might work.`,
      relatedSlugs: ["youtube-channel-audit", "youtube-retention-analysis", "youtube-analytics-tools"],
    },
    {
      id: "growth",
      title: "Subscriber Growth",
      description: `Getting more subscribers isn't about tricks or shortcuts. It's about creating content that makes viewers want to come back for more. Subscribers are the lifeblood of a YouTube channel—they provide a baseline of views for every video you publish and signal to the algorithm that your content has ongoing value. Learn the proven strategies for converting casual viewers into loyal subscribers and building an audience that actually watches your videos when you upload them.`,
      relatedSlugs: ["how-to-get-more-subscribers", "free-youtube-subscribers", "how-to-see-your-subscribers-on-youtube"],
    },
    {
      id: "content",
      title: "Content Strategy & Ideas",
      description: `The best YouTubers don't run out of ideas—they have systems for generating them consistently. Running out of video ideas is one of the main reasons creators burn out or abandon their channels. Discover how to research your niche effectively, find trending topics before they become saturated, and develop a content strategy that keeps your audience engaged video after video. Good ideas validated by data perform better than random uploads every time.`,
      relatedSlugs: ["youtube-video-ideas", "youtube-shorts-strategy", "how-to-be-a-youtuber", "how-to-make-a-youtube-channel"],
    },
    {
      id: "seo",
      title: "SEO & Discovery",
      description: `YouTube is the world's second-largest search engine, processing over 3 billion searches per month. Learn how to optimize your titles, descriptions, and tags so your videos get found by people actively searching for content like yours. Understand how the algorithm decides which videos to recommend in browse and suggested feeds, and learn how to position your content for maximum reach across all traffic sources.`,
      relatedSlugs: ["youtube-seo", "youtube-tag-generator", "youtube-algorithm"],
    },
    {
      id: "competitors",
      title: "Competitor Research",
      description: `The fastest way to grow is to learn from channels that are already succeeding in your niche. Every video your competitors publish is an experiment—some work, most don't. By studying their successes and failures, you can identify proven topics, formats, and packaging strategies without spending months figuring them out yourself. These guides show you how to analyze competitors effectively, identify outlier videos that signal audience demand, and adapt winning strategies for your own content without copying.`,
      relatedSlugs: ["youtube-competitor-analysis"],
    },
    {
      id: "monetization",
      title: "Monetization & Revenue",
      description: `Turning your channel into a business requires understanding YouTube's monetization requirements and the full range of revenue opportunities available to creators. The Partner Program is just the starting point—successful creators diversify with sponsorships, affiliate marketing, memberships, and digital products. Learn about Partner Program eligibility thresholds, how to calculate your potential earnings, and strategies for maximizing your revenue per viewer.`,
      relatedSlugs: ["youtube-monetization-requirements", "how-much-does-youtube-pay", "youtube-shorts-monetization"],
    },
    {
      id: "formats",
      title: "Video Formats & Shorts",
      description: `Different video formats serve different purposes in your content strategy. Long-form videos build watch time and deeper engagement, YouTube Shorts drive discovery and reach new audiences quickly, and live streams build real-time community connection. Understanding when to use each format and how to optimize for their specific requirements—from aspect ratios to pacing to optimal length—helps you build a well-rounded channel that grows from multiple traffic sources.`,
      relatedSlugs: ["youtube-shorts-strategy", "youtube-shorts-length", "how-to-go-live-on-youtube", "how-to-promote-youtube-videos"],
    },
  ],

  startHere: {
    title: "New to YouTube Growth?",
    description: `If you're just getting started with data-driven content strategy, these three guides 
will give you the foundation you need. Start with the channel audit to understand where you are, 
then learn about retention to improve your content, and finally master subscriber growth to 
build your audience.`,
    guides: [
      {
        slug: "youtube-channel-audit",
        reason: "Understand your channel's strengths and weaknesses",
      },
      {
        slug: "youtube-retention-analysis",
        reason: "Learn why viewers stop watching and how to keep them engaged",
      },
      {
        slug: "how-to-get-more-subscribers",
        reason: "Turn viewers into a loyal audience",
      },
    ],
  },

  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        question: "Are these guides really free?",
        answer: `Yes, all guides in the Learning Center are completely free to read. We believe 
education shouldn't be paywalled. Our business model is based on ${BRAND.name}'s analytics 
tools, not content gating.`,
      },
      {
        question: "How often do you update the guides?",
        answer: `We review and update guides quarterly, or sooner when YouTube makes significant 
algorithm changes. Each guide shows its last updated date so you know the information is current.`,
      },
      {
        question: "I'm a complete beginner. Where should I start?",
        answer: `Start with "How to Make a YouTube Channel" if you haven't created your channel yet, 
or "YouTube Channel Audit" if you have some videos but aren't seeing growth. These guides 
assume no prior knowledge and build up from the basics.`,
      },
      {
        question: "Do I need to use ChannelBoost to apply these strategies?",
        answer: `No. The strategies in these guides work regardless of what tools you use. 
${BRAND.name} can automate much of the analysis and save you time, but the principles 
are applicable even if you're only using YouTube Studio.`,
      },
      {
        question: "Can I request a guide on a specific topic?",
        answer: `Absolutely. Reach out through our contact page with your suggestion. We prioritize 
new guides based on creator requests and common questions we receive.`,
      },
    ],
  },

  cta: {
    title: "Ready to Put This Into Practice?",
    description: `${BRAND.name} automates these analyses and gives you personalized 
insights for your channel. See your retention curves, track competitors, and get 
AI-powered video ideas—all in one dashboard.`,
    primaryButton: {
      label: "Get Started Free",
      href: "/dashboard",
    },
    secondaryButton: {
      label: "See ChannelBoost features",
      href: "/",
    },
  },
} as const;
