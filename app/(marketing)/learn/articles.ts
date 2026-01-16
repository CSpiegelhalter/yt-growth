import { BRAND } from "@/lib/brand";

/**
 * Learn articles metadata - Single source of truth for all article data
 * Used for navigation, sitemap, schema generation, and article pages
 */
export const LEARN_ARTICLES = {
  "youtube-channel-audit": {
    slug: "youtube-channel-audit",
    title:
      "YouTube Channel Audit: How to Find and Fix What's Killing Your Growth (2026)",
    shortTitle: "Channel Audit",
    navLabel: "Channel Audit",
    description:
      "Your YouTube channel isn't growing and you don't know why. This step by step audit guide shows you how to analyze your analytics, diagnose the real problem, and fix it with a clear 30 day action plan.",
    metaDescription:
      "Why aren't your YouTube videos getting views? This channel audit guide walks you through YouTube Studio step by step, shows you what good metrics look like, and gives you a 30 day plan to fix your growth.",
    datePublished: "2024-01-15",
    dateModified: "2026-01-02",
    readingTime: "18 min read",
    category: "Analytics",
    keywords: [
      "youtube channel audit",
      "why are my youtube videos not getting views",
      "how to audit youtube channel",
      "youtube analytics",
      "youtube channel not growing",
      "youtube retention drops first 30 seconds",
      "low ctr youtube",
      "subscribers per 1000 views",
      "youtube traffic sources",
      "youtube studio analytics",
    ],
    toc: [
      { id: "what-is-audit", title: "What is a Channel Audit?" },
      { id: "key-metrics", title: "The 6 Metrics That Actually Matter" },
      {
        id: "youtube-studio-guide",
        title: "Where to Find Each Metric in YouTube Studio",
      },
      {
        id: "what-good-looks-like",
        title: "What Good Looks Like (Benchmarks)",
      },
      { id: "diagnose-problem", title: "Diagnose Your Problem" },
      { id: "checklist", title: "15 Minute Channel Audit Checklist" },
      { id: "common-issues", title: "Why Your Channel Isn't Growing" },
      { id: "quick-wins", title: "Quick Wins You Can Fix Today" },
      { id: "common-mistakes", title: "Mistakes Creators Make During Audits" },
      { id: "action-plan", title: "30 Day Action Plan" },
      { id: "case-study", title: "Example: Diagnosing a Stuck Channel" },
      { id: "youtube-seo", title: "YouTube SEO Basics" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "How often should I audit my YouTube channel?",
        answer:
          "Run a full audit every 3 to 6 months, or immediately when growth stalls for 4+ weeks. Between full audits, do a quick weekly check of your last video's retention curve and CTR. This takes 5 minutes and catches problems early.",
      },
      {
        question: "What is a good CTR for YouTube videos?",
        answer:
          "Most channels see CTR between 2% and 10%. For browse and suggested traffic, 4% to 6% is common. For search traffic, 5% to 10% is typical. More important than hitting a number is watching your trend over time. If CTR is dropping month over month, your thumbnails or titles need work.",
      },
      {
        question: "Why do viewers drop off in the first 30 seconds?",
        answer:
          "The most common causes are slow intros (too much setup before value), a mismatch between the thumbnail promise and the actual content, or weak hooks that don't create curiosity. Check your retention graph in YouTube Studio. If there's a cliff in the first 30 seconds, rewatch that segment and ask what would make you click away.",
      },
      {
        question: "How many subscribers should I get per 1,000 views?",
        answer:
          "A healthy channel converts about 1% to 3% of viewers into subscribers. That means 10 to 30 new subscribers per 1,000 views. If you're under 1%, your content may not be giving viewers a reason to come back, or you're not asking for the subscribe at the right moment.",
      },
      {
        question: "What's the difference between impressions and views?",
        answer:
          "Impressions count how many times your thumbnail was shown to potential viewers. Views count how many times someone actually clicked and watched. The ratio between them is your click through rate (CTR). Low impressions usually means YouTube isn't recommending your content. Low CTR with high impressions means your packaging (thumbnail and title) isn't compelling.",
      },
      {
        question: "Why is my channel getting impressions but no views?",
        answer:
          "This is a packaging problem. YouTube is showing your video to people, but they're scrolling past it. Your thumbnail might be hard to read, your title might be unclear, or the topic might not spark curiosity. Test new thumbnails on your recent videos and track if CTR improves.",
      },
      {
        question: "How do I get more suggested video traffic?",
        answer:
          "YouTube suggests videos that keep viewers on the platform. To improve suggested traffic, focus on retention (especially average view duration), make content similar to videos already getting suggested traffic in your niche, and use end screens to link to your other videos. Channels with high retention on related topics often get suggested alongside each other.",
      },
      {
        question: "Can I audit my channel with just YouTube Studio?",
        answer:
          "Yes. YouTube Studio provides all the data you need for a thorough audit. Go to Analytics, then check Overview for big picture trends, Reach for impressions and CTR, Engagement for retention and watch time, and Audience for who's watching. The advanced mode lets you compare videos and export data to a spreadsheet for deeper analysis.",
      },
      {
        question: "What is YouTube SEO?",
        answer:
          "YouTube SEO means optimizing your videos so they rank in YouTube search and get recommended. It includes writing clear titles with target keywords, creating thumbnails that get clicks, optimizing descriptions, and making content that keeps viewers watching. Unlike website SEO, retention and engagement matter as much as metadata.",
      },
      {
        question: "How do I improve SEO on my YouTube videos?",
        answer:
          "Start with titles: include the main keyword naturally in the first 60 characters. Write descriptions that explain what the video covers and include relevant keywords. Use 3 to 5 relevant tags. Most importantly, focus on retention since YouTube heavily weights how long people watch. High retention signals quality content.",
      },
      {
        question: "How do I get more views on YouTube?",
        answer:
          "Views come from impressions multiplied by click through rate. To get more views: improve your packaging (titles and thumbnails) to increase CTR, improve your retention to get more algorithmic reach, post consistently to build momentum, and promote new videos in the first 24 hours. Check your Analytics to see which traffic sources are strongest.",
      },
      {
        question: "What are the most important YouTube stats to track?",
        answer:
          "Track these five metrics regularly: CTR (click through rate) to measure packaging effectiveness, average view duration to measure content quality, subscriber conversion rate to measure audience building, traffic sources to understand where views come from, and impressions to see how much YouTube is promoting your content.",
      },
    ],
  },
  "youtube-retention-analysis": {
    slug: "youtube-retention-analysis",
    title: "YouTube Retention Analysis: How to Keep Viewers Watching (2026)",
    shortTitle: "Retention Analysis",
    navLabel: "Retention",
    description:
      "Master YouTube audience retention analysis. Learn to identify drop-off points, understand viewer behavior, and improve watch time with proven strategies.",
    metaDescription:
      "Master YouTube retention in 2026. Learn to read retention curves, identify drop-off points, and apply proven fixes to keep viewers watching longer.",
    datePublished: "2024-01-15",
    dateModified: "2026-01-15",
    readingTime: "7 min read",
    category: "Analytics",
    keywords: [
      "youtube retention",
      "audience retention",
      "watch time",
      "viewer drop-off",
    ],
    toc: [
      { id: "why-retention-matters", title: "Why Retention Matters" },
      { id: "reading-curves", title: "Reading Retention Curves" },
      { id: "drop-off-patterns", title: "Common Drop-Off Patterns" },
      { id: "improvement-strategies", title: "Strategies to Improve" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "What's a good audience retention rate on YouTube?",
        answer:
          "It varies by video length and niche, but 50%+ average view duration is generally good. For longer videos (15+ min), 40%+ is solid. Focus on improving your own baseline rather than comparing to others.",
      },
      {
        question: "How do I find where viewers drop off?",
        answer:
          "In YouTube Studio, go to Analytics → Engagement → Audience Retention. The graph shows exactly where viewers leave. Look for steep drops and investigate what's happening at those timestamps.",
      },
      {
        question: "Does video length affect retention?",
        answer:
          "Yes. Longer videos typically have lower percentage retention but can still have high absolute watch time. Make your video as long as it needs to be—no longer. Cut filler content ruthlessly.",
      },
    ],
  },
  "how-to-get-more-subscribers": {
    slug: "how-to-get-more-subscribers",
    title: "How to Get More Subscribers on YouTube: The Complete Guide (2026)",
    shortTitle: "Get More Subscribers",
    navLabel: "Subscribers",
    description:
      "Learn how to get more subscribers on YouTube with strategies that actually work. This guide covers analytics, traffic sources, posting times, and how to turn viewers into loyal subscribers.",
    metaDescription:
      "How to get more subscribers on YouTube in 2026. Learn how to see your subscriber count, read your analytics, find the best time to post, and turn viewers into subscribers.",
    datePublished: "2024-01-15",
    dateModified: "2026-01-02",
    readingTime: "22 min read",
    category: "Growth",
    keywords: [
      "how to get more subscribers on youtube",
      "how to get subscribers",
      "youtube subscriber count",
      "how to get more viewers",
      "analytics in youtube",
      "how to get traffic to your channel",
      "what is the best time to post on youtube",
      "how to find trending videos",
      "how to start a youtube channel",
      "youtube monetization requirements",
    ],
    toc: [
      { id: "why-subscribers-matter", title: "Why Subscribers Matter" },
      { id: "subscriber-checklist", title: "15 Minute Subscriber Checklist" },
      { id: "see-subscribers", title: "How to See Your Subscribers" },
      { id: "youtube-analytics", title: "Analytics That Predict Growth" },
      { id: "what-converts", title: "What Converts Viewers" },
      { id: "growth-strategies", title: "Proven Growth Strategies" },
      { id: "subscriber-drivers", title: "Finding Subscriber Drivers" },
      { id: "get-more-viewers", title: "Get More Viewers" },
      { id: "get-traffic", title: "Get Traffic to Your Channel" },
      { id: "trending-videos", title: "Find Trending Videos" },
      { id: "best-time-to-post", title: "Best Time to Post" },
      { id: "advertise-channel", title: "Advertise Your Channel" },
      { id: "start-channel", title: "Start a Channel That Grows" },
      { id: "rename-and-brand", title: "YouTube Names and Branding" },
      { id: "monetization", title: "Monetization Requirements" },
      { id: "most-views", title: "Most Views: What It Means" },
      { id: "tools", title: "Free Tools for Creators" },
      { id: "mistakes", title: "Mistakes to Avoid" },
      {
        id: "dont-buy-subscribers",
        title: "Why You Should Never Buy Subscribers",
      },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "How do I get more subscribers on YouTube?",
        answer:
          "Focus on content that gives viewers a reason to come back. Ask for the subscribe after delivering value, create series content, and use your analytics to find which videos already convert well. Then make more content like your top performers.",
      },
      {
        question: "How do I see my subscribers on YouTube?",
        answer:
          "Open YouTube Studio and click Analytics in the left menu. Your subscriber count shows on the Overview tab. For more detail, click Audience, then See More under Subscribers. You can see subscribers gained by video, but YouTube does not show a public list of who subscribed unless they made their subscriptions public.",
      },
      {
        question: "How do I check my subs on YouTube?",
        answer:
          "In YouTube Studio, go to Analytics and look at the Overview or Audience tab. You will see your total subscriber count, recent changes, and which videos drove the most new subscribers. The mobile YouTube Studio app also shows your subscriber count on the dashboard.",
      },
      {
        question: "What is the best time to post on YouTube?",
        answer:
          "Check your Analytics under Audience to see when your viewers are on YouTube. Most channels see good results posting 2 to 3 hours before their audience peak. Test different times over 2 weeks and compare the first 24 hour performance to find what works for your channel.",
      },
      {
        question: "How do I get traffic to my YouTube channel?",
        answer:
          "YouTube traffic comes from search, suggested videos, browse (homepage), Shorts, and external sources. Improve search traffic with clear titles. Improve suggested traffic with strong retention. External traffic from social media or communities can help new channels get initial momentum.",
      },
      {
        question: "How do I find trending videos on YouTube?",
        answer:
          "Check the Trending tab on YouTube, use the search filter for recent uploads with high views, and watch what competitors are posting. Look for topics getting unusual traction, then find your own angle instead of copying directly.",
      },
      {
        question: "What are the YouTube monetization requirements?",
        answer:
          "To join the YouTube Partner Program, you need 1,000 subscribers plus either 4,000 public watch hours in the last 12 months or 10 million Shorts views in the last 90 days. You also need to follow community guidelines and have an AdSense account.",
      },
      {
        question: "How do you make money on YouTube?",
        answer:
          "Most creators earn through ad revenue, sponsorships, affiliate links, merchandise, memberships, and selling their own products or services. Ad revenue requires the Partner Program. Other revenue streams can start earlier and often pay better per viewer.",
      },
      {
        question: "How do I rename my YouTube channel?",
        answer:
          "Go to YouTube Studio, click Customization, then Basic Info. Click the pencil icon next to your channel name to edit it. Changes can take a few days to appear everywhere. You can change your name a limited number of times, so choose carefully.",
      },
      {
        question: "Can I see who is subscribed to my YouTube channel?",
        answer:
          "You can only see subscribers who have set their subscriptions to public. In YouTube Studio, go to Analytics, then Audience, then See More under Subscribers. Most subscribers keep their subscriptions private, so you will typically only see a small portion.",
      },
      {
        question: "How long does it take to get subscribers on YouTube?",
        answer:
          "It depends on your niche, content quality, and consistency. Some channels reach 1,000 subscribers in a few months, others take a year or more. Focus on making content your specific audience values. Subscriber growth often accelerates once you find what works.",
      },
      {
        question: "What is a good subscriber count on YouTube?",
        answer:
          "There is no universal good number. What matters is whether your subscriber count is growing and whether subscribers actually watch your videos. A channel with 5,000 engaged subscribers often outperforms one with 50,000 inactive subscribers.",
      },
      {
        question: "How do I view my subscribers on YouTube?",
        answer:
          "In YouTube Studio, go to Analytics, then Audience. Click See More under Subscribers. You can see your subscriber count, recent gains and losses, and which videos drove new subscribers. The mobile app also shows your count on the dashboard. Note that you can only see subscribers who made their subscriptions public.",
      },
      {
        question: "Should I buy YouTube subscribers?",
        answer:
          "No. Buying subscribers violates YouTube Terms of Service and can result in channel termination. Purchased subscribers are fake accounts or bots that never watch your videos, which destroys your engagement rate. Low engagement signals to YouTube that your content is not worth recommending. Build subscribers through quality content instead.",
      },
      {
        question: "Can I get free YouTube subscribers from a service?",
        answer:
          "Services offering free subscribers use bots, fake accounts, or sub4sub schemes. All of these violate YouTube policies and hurt your channel. Fake subscribers do not watch your content, which tanks your engagement metrics. YouTube may remove fake subscribers and penalize your channel. Focus on earning real subscribers through valuable content.",
      },
      {
        question: "What is a youtube stats dashboard?",
        answer:
          "YouTube Studio is your stats dashboard. It shows subscriber count, views, watch time, revenue (if monetized), traffic sources, retention curves, and audience demographics. The Analytics section has four tabs: Overview, Reach, Engagement, and Audience. Use Advanced Mode to compare videos and export data.",
      },
    ],
  },
  "youtube-competitor-analysis": {
    slug: "youtube-competitor-analysis",
    title:
      "YouTube Competitor Analysis: How to Find What Works in Your Niche (2026)",
    shortTitle: "Competitor Analysis",
    navLabel: "Competitors",
    description:
      "Learn how to find competitors on YouTube, analyze their best videos, and spot trending topics in your niche. This guide covers outlier detection, title and thumbnail patterns, and a 30 day plan to turn competitor insights into more views for your channel.",
    metaDescription:
      "Learn how to find competitors on YouTube and analyze what works in your niche. Spot outlier videos, find trending topics, and steal patterns (not videos) to get more views.",
    datePublished: "2024-01-15",
    dateModified: "2026-01-02",
    readingTime: "18 min read",
    category: "Research",
    keywords: [
      "youtube competitor analysis",
      "how to find competitors on youtube",
      "youtube channel finder",
      "how to find similar channels on youtube",
      "how to analyze competitors on youtube",
      "how to find trending videos",
      "youtube stats",
      "analytics in youtube",
      "youtube title ideas",
      "youtube thumbnail ideas",
      "how to get more views on youtube",
    ],
    toc: [
      {
        id: "why-competitor-analysis",
        title: "Why Competitor Analysis Matters",
      },
      { id: "competitor-checklist", title: "15 Minute Checklist" },
      { id: "find-competitors", title: "How to Find Competitors" },
      { id: "find-trending", title: "Find Trending Videos" },
      { id: "outliers", title: "Find Outlier Videos" },
      { id: "what-to-track", title: "What to Track" },
      { id: "youtube-stats", title: "YouTube Stats to Compare" },
      { id: "title-thumbnail", title: "Titles and Thumbnails" },
      { id: "mistakes", title: "Common Mistakes" },
      { id: "30-day-plan", title: "30 Day Action Plan" },
      { id: "example", title: "Example: Insight to Video Plan" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "What is YouTube competitor analysis?",
        answer:
          "YouTube competitor analysis means studying channels in your niche to find what topics, formats, and packaging work best. You identify patterns from their successful videos and adapt those insights for your own content. The goal is to learn from their experiments, not to copy their videos.",
      },
      {
        question: "How do I find competitors on YouTube?",
        answer:
          "Search for your main topics and note which channels appear repeatedly. Check the suggested videos sidebar on videos similar to yours. Look at playlists in your niche and see which channels get featured. You can also ask your audience what other channels they watch.",
      },
      {
        question: "Is there a YouTube channel finder tool?",
        answer:
          "YouTube does not have a built in channel finder, but you can use search suggestions, the Explore page, and the suggested videos sidebar to discover channels. Some third party tools let you search by niche or topic. Focus on finding channels with similar audience size and upload frequency to yours.",
      },
      {
        question: "How do I find similar channels on YouTube?",
        answer:
          "Go to a channel you consider a competitor, then check which channels appear in their suggested videos and end screens. You can also search for your niche topic and filter by channel. Look for channels with comparable subscriber counts and content styles.",
      },
      {
        question: "How do I find trending videos in my niche?",
        answer:
          "Sort competitor uploads by most popular and filter by recent (last month or year). Look for videos that are gaining views faster than usual for that channel. Check the YouTube Trending page for your category. Trending in your niche often means a topic is getting more attention than normal, even if it is not on the main Trending page.",
      },
      {
        question: "What YouTube stats should I compare?",
        answer:
          "Focus on views per video, upload frequency, video length, and engagement signals you can see publicly (likes, comments). You cannot see a competitor's exact retention or CTR, but view velocity (how fast a video gains views after upload) gives you clues about algorithm performance.",
      },
      {
        question: "How can I see what tags other YouTubers use?",
        answer:
          "YouTube hides video tags by default. You can view page source or use a browser extension to see them, but tags have little impact on discovery in 2026. Title, thumbnail, and the actual content matter far more. Focus your analysis on those instead.",
      },
      {
        question: "What is a YouTube tag extractor?",
        answer:
          "A tag extractor is a browser extension or website that shows the hidden tags on YouTube videos. While these tools work, tags are not a major ranking factor anymore. Spend your research time on titles, thumbnails, and content structure instead.",
      },
      {
        question:
          "Can an AI YouTube title generator help with competitor analysis?",
        answer:
          "AI title generators can help you brainstorm angles after you have identified a pattern from competitors. Feed the generator a topic and a style you observed, then manually refine the results. Do not publish AI generated titles without editing them for your voice and audience.",
      },
      {
        question:
          "How do I get more views on YouTube using competitor insights?",
        answer:
          "Find topics that performed well for similar channels, then create your own version with a unique angle. Study their packaging (titles and thumbnails) to understand what gets clicks in your niche. Improve on their hooks and retention patterns. Competitor analysis shows you what the audience already wants.",
      },
      {
        question:
          "How do I get traffic to my channel from competitor research?",
        answer:
          "Identify which traffic sources drive views for competitors. If their top videos rank in search, optimize your titles for those keywords. If their videos appear in suggested, focus on retention and related content. External traffic strategies like communities or collaborations also become visible when you study how competitors promote.",
      },
      {
        question:
          "What does most views on a YouTube video mean for my strategy?",
        answer:
          "A video with millions of views often went viral for reasons that are hard to replicate. Instead of chasing outliers, look for repeatable patterns: topics that consistently perform above average across multiple videos and channels. Those patterns are more useful than one off viral hits.",
      },
    ],
  },
  "youtube-video-ideas": {
    slug: "youtube-video-ideas",
    title:
      "YouTube Video Ideas: How to Find Topics That Get Views (2026 Guide)",
    shortTitle: "Video Ideas",
    navLabel: "Video Ideas",
    description:
      "Learn how to find video ideas for YouTube that actually get views. This guide covers idea generation methods, trending topic research, Shorts ideas, keyword research, and a 30 day content plan to never run out of YouTube content ideas.",
    metaDescription:
      "How to find video ideas for YouTube that actually get views. Learn how to find trending videos, validate ideas before filming, and build a 30 day content plan you can repeat.",
    datePublished: "2024-01-15",
    dateModified: "2026-01-02",
    readingTime: "20 min read",
    category: "Content",
    keywords: [
      "youtube video ideas",
      "video ideas for youtube",
      "how to find video ideas for youtube",
      "how to come up with youtube video ideas",
      "youtube content ideas",
      "how to find trending videos",
      "youtube keyword research",
      "youtube shorts ideas",
      "youtube title ideas",
      "youtube thumbnail ideas",
      "youtube niche ideas",
    ],
    toc: [
      { id: "why-ideas-fail", title: "Why Most Ideas Fail" },
      { id: "ideas-checklist", title: "15 Minute Ideas Checklist" },
      { id: "idea-sources", title: "5 Data Driven Sources" },
      { id: "find-trending", title: "Find Trending Videos" },
      { id: "keyword-research", title: "YouTube Keyword Research" },
      { id: "shorts-ideas", title: "YouTube Shorts Ideas" },
      { id: "niche-ideas", title: "YouTube Niche Ideas" },
      { id: "validation", title: "Validate Before You Create" },
      { id: "idea-validation-scorecard", title: "Idea Validation Scorecard" },
      { id: "title-thumbnail", title: "Title and Thumbnail Ideas" },
      { id: "idea-to-video", title: "From Idea to Video" },
      { id: "content-plan", title: "30 Day Content Plan" },
      { id: "example", title: "Example: One Topic to 12 Ideas" },
      { id: "tools", title: "Tools for Ideas and Titles" },
      { id: "mistakes", title: "Common Mistakes" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "How do I find video ideas for YouTube?",
        answer:
          "Start with what already works. Check your own top performing videos, study competitor outliers, use YouTube search suggestions to find what people search for, read comments on popular videos for questions, and look at trending topics in adjacent niches. Combine these sources to build a backlog of validated ideas.",
      },
      {
        question:
          "How do I come up with YouTube video ideas when I feel stuck?",
        answer:
          "Run a 15 minute idea session: check your analytics for your best performers, scan 3 competitor channels for outliers, type 5 seed topics into YouTube search and note the suggestions, and read 20 comments on popular videos in your niche. You will usually find 3 to 5 solid ideas in that time.",
      },
      {
        question: "How do I find trending videos in my niche?",
        answer:
          "Sort competitor uploads by most popular, then filter by recent uploads (last month or year). Look for videos gaining views faster than usual for that channel. A video with double the typical views posted recently indicates a trending topic. Validate by checking if multiple competitors have similar performing videos.",
      },
      {
        question: "What is YouTube keyword research?",
        answer:
          "YouTube keyword research means finding what your audience actually searches for on YouTube. Use YouTube autocomplete: type your topic and note the suggestions. These are real queries. Check the results page to see competition. Look for topics where smaller channels still get views, not just mega channels.",
      },
      {
        question: "What are good YouTube Shorts ideas?",
        answer:
          "Shorts work well for quick tips, behind the scenes clips, surprising facts, mini tutorials, reaction moments, before and after reveals, day in the life snippets, and teases of longer content. The best Shorts ideas connect to a longer video you can link to, turning casual viewers into subscribers.",
      },
      {
        question: "How do I come up with YouTube title ideas?",
        answer:
          "Study titles of top performing videos in your niche and categorize them by structure: how to plus result, number lists, curiosity gaps, direct promises, questions, or personal stories. Apply those structures to your topics. Write 5 to 10 title options, then pick the one with the clearest benefit and strongest curiosity.",
      },
      {
        question: "What makes a good YouTube thumbnail?",
        answer:
          "Good thumbnails stand out in the feed. Study what works in your niche: faces vs no faces, text amount, color palettes, composition. The thumbnail should communicate the video promise in a split second. Test one variable at a time to learn what your audience responds to.",
      },
      {
        question: "Can an AI YouTube title generator help?",
        answer:
          "AI title generators can help you brainstorm angles quickly. Feed them a topic and a style you have seen work, then manually refine the output for clarity and your voice. Do not publish AI generated titles without editing. They often sound generic until you add personality and specificity.",
      },
      {
        question: "What does a YouTube tag extractor do?",
        answer:
          "A tag extractor shows the hidden tags on YouTube videos. While these tools work, tags have minimal impact on discovery in 2026. Your title, thumbnail, and retention matter far more. Spend your research time on those instead of obsessing over tags.",
      },
      {
        question: "How do I pick a YouTube niche?",
        answer:
          "Pick a niche where you have knowledge or genuine interest, a clear audience exists with real problems you can solve, other creators are succeeding (proof of demand), and you can create 50 plus video ideas without running dry. Monetization matters, but audience fit matters more for early growth.",
      },
      {
        question: "How do I get more views on YouTube with better ideas?",
        answer:
          "Better ideas lead to more views because you are making content people already want. Validate demand before filming, package ideas with compelling titles and thumbnails, and study what performs well for similar channels. Views come from matching proven demand with quality execution.",
      },
      {
        question: "How often should I brainstorm new video ideas?",
        answer:
          "Spend 30 minutes to 1 hour weekly on idea research. Keep a backlog of 10 to 20 validated ideas so you always have options. This prevents creative blocks and rushed decisions. A regular cadence beats occasional marathon brainstorming sessions.",
      },
    ],
  },
  "how-to-make-a-youtube-channel": {
    slug: "how-to-make-a-youtube-channel",
    title: "How to Make a YouTube Channel: Complete Setup Guide (2026)",
    shortTitle: "Make a Channel",
    navLabel: "Start a Channel",
    description:
      "Learn how to make a YouTube channel from scratch. This guide covers account setup, channel customization, branding basics, and your first upload. Get your channel ready to grow.",
    metaDescription:
      "How to make a YouTube channel in 2026. Step by step guide to creating your channel, setting up branding, and publishing your first video. Everything beginners need to start.",
    datePublished: "2026-01-02",
    dateModified: "2026-01-02",
    readingTime: "12 min read",
    category: "Getting Started",
    keywords: [
      "how to make a youtube channel",
      "how to create a youtube channel",
      "how to start a youtube channel",
      "youtube channel setup",
      "create youtube account",
      "youtube channel for beginners",
    ],
    toc: [
      { id: "why-start", title: "Why Start a YouTube Channel" },
      { id: "setup-checklist", title: "15 Minute Setup Checklist" },
      { id: "create-account", title: "Create Your Google Account" },
      { id: "create-channel", title: "Create Your YouTube Channel" },
      { id: "channel-customization", title: "Channel Customization" },
      { id: "branding-basics", title: "Branding Basics" },
      { id: "first-video", title: "Your First Video" },
      { id: "channel-settings", title: "Important Settings" },
      { id: "mistakes", title: "Common Beginner Mistakes" },
      { id: "next-steps", title: "What to Do After Setup" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "How do I make a YouTube channel?",
        answer:
          "Sign in to YouTube with a Google account, click your profile icon, select Create a channel, choose a channel name, and customize your profile picture and banner. The whole process takes about 10 minutes. You can start uploading videos immediately after setup.",
      },
      {
        question: "How do I create a YouTube channel for my business?",
        answer:
          "Create a Brand Account instead of a personal channel. Go to YouTube settings, click Create a new channel, and select Use a business or other name. Brand Accounts let multiple people manage the channel without sharing personal Google credentials.",
      },
      {
        question: "Is it free to make a YouTube channel?",
        answer:
          "Yes, creating a YouTube channel is completely free. You only need a Google account. There are no fees to upload videos or grow your audience. Monetization (earning money) requires meeting specific thresholds, but the channel itself costs nothing.",
      },
      {
        question: "What should I name my YouTube channel?",
        answer:
          "Pick a name that is easy to remember, spell, and search for. It should hint at your content type. Avoid numbers and special characters. Check that the name is available on other platforms too. You can change your channel name later, but consistent branding helps recognition.",
      },
      {
        question: "How do I start a YouTube channel with no experience?",
        answer:
          "Start by choosing a niche you know about and enjoy. Your first videos will not be perfect, and that is normal. Focus on providing value to viewers, improve with each upload, and study what works in your niche. Experience comes from doing.",
      },
      {
        question: "What equipment do I need to start a YouTube channel?",
        answer:
          "You can start with just a smartphone. Most modern phones shoot good quality video. As you grow, consider a basic microphone (audio quality matters more than video quality), lighting (a window or cheap ring light works), and eventually a dedicated camera. Start simple and upgrade as you learn what you need.",
      },
      {
        question: "How long does it take to grow a YouTube channel?",
        answer:
          "It varies widely. Some channels reach 1,000 subscribers in months, others take years. Consistency, content quality, and niche selection all matter. Focus on improving each video rather than hitting subscriber targets. Growth often accelerates once you find what resonates with your audience.",
      },
      {
        question: "Can I make money with a new YouTube channel?",
        answer:
          "Not immediately through ads. YouTube requires 1,000 subscribers and 4,000 watch hours (or 10M Shorts views) to join the Partner Program. However, you can earn through affiliate links, sponsorships, or selling products before reaching those thresholds.",
      },
    ],
  },
  "youtube-monetization-requirements": {
    slug: "youtube-monetization-requirements",
    title: "YouTube Monetization Requirements: How to Get Monetized in 2026",
    shortTitle: "Monetization",
    navLabel: "Monetization",
    description:
      "Learn the YouTube monetization requirements to join the Partner Program. This guide covers subscriber and watch hour thresholds, how to apply, what to do while you wait, and alternative ways to make money on YouTube.",
    metaDescription:
      "YouTube monetization requirements explained for 2026. Learn how to get monetized on YouTube, the subscriber and watch hour thresholds, and how to make money while you grow.",
    datePublished: "2026-01-02",
    dateModified: "2026-01-02",
    readingTime: "14 min read",
    category: "Monetization",
    keywords: [
      "youtube monetization requirements",
      "how to get monetized on youtube",
      "how to monetize youtube videos",
      "how to make money on youtube",
      "youtube partner program requirements",
      "youtube monetization 2026",
      "affiliate marketing for beginners",
    ],
    toc: [
      { id: "overview", title: "Monetization Overview" },
      { id: "requirements-checklist", title: "Requirements Checklist" },
      { id: "partner-program", title: "YouTube Partner Program" },
      { id: "how-to-apply", title: "How to Apply" },
      { id: "while-you-wait", title: "What to Do While You Wait" },
      { id: "revenue-streams", title: "Revenue Streams Explained" },
      { id: "affiliate-basics", title: "Affiliate Marketing Basics" },
      { id: "realistic-expectations", title: "Realistic Expectations" },
      { id: "mistakes", title: "Monetization Mistakes" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "What are the YouTube monetization requirements?",
        answer:
          "To join the YouTube Partner Program, you need 1,000 subscribers plus either 4,000 public watch hours in the last 12 months OR 10 million public Shorts views in the last 90 days. You also need to follow YouTube community guidelines, have no active strikes, live in an eligible country, and have an AdSense account.",
      },
      {
        question: "How do I get monetized on YouTube?",
        answer:
          "First, meet the eligibility requirements (1,000 subscribers + watch hours or Shorts views). Then go to YouTube Studio, click Earn in the left menu, and apply for the Partner Program. YouTube reviews your channel, which typically takes about a month. If approved, you can enable ads on your videos.",
      },
      {
        question: "How do I monetize YouTube videos?",
        answer:
          "Once in the Partner Program, go to YouTube Studio, select a video, click Monetization, and turn on ads. Choose which ad formats you want (skippable, non-skippable, bumper, etc.). You can also enable Super Chat for live streams and channel memberships if eligible.",
      },
      {
        question: "How do you make money on YouTube?",
        answer:
          "YouTube creators earn through multiple streams: ad revenue (requires Partner Program), channel memberships, Super Chat and Super Thanks, sponsored content, affiliate marketing, selling merchandise, and promoting their own products or services. Diversifying income is safer than relying only on ads.",
      },
      {
        question: "How long does it take to get monetized on YouTube?",
        answer:
          "The time to reach 1,000 subscribers and 4,000 watch hours varies enormously. Some channels do it in 3 months, others take 2 years or more. Once you apply, YouTube review typically takes 2 to 4 weeks. Focus on consistent quality content rather than timeline predictions.",
      },
      {
        question: "What is affiliate marketing for beginners on YouTube?",
        answer:
          "Affiliate marketing means promoting products in your videos and earning a commission when viewers buy through your link. Sign up for affiliate programs related to your niche (Amazon Associates is common). Disclose affiliate relationships clearly. This works before monetization since it does not require the Partner Program.",
      },
      {
        question: "Can I monetize YouTube Shorts?",
        answer:
          "Yes. Shorts can help you reach the 10 million Shorts views threshold for Partner Program eligibility. Once monetized, Shorts earn from the Shorts revenue pool based on views and engagement. Shorts generally earn less per view than long form content, but volume can add up.",
      },
      {
        question: "What happens if I lose monetization?",
        answer:
          "YouTube can suspend monetization if you violate community guidelines, get copyright strikes, or your watch time drops below thresholds. If suspended, you keep your channel but lose ad revenue until reinstated. Follow the rules and maintain content quality to protect your monetization status.",
      },
    ],
  },
  "how-much-does-youtube-pay": {
    slug: "how-much-does-youtube-pay",
    title: "How Much Does YouTube Pay? RPM, CPM, and Real Earnings (2026)",
    shortTitle: "YouTube Pay",
    navLabel: "YouTube Pay",
    description:
      "Learn how much YouTube pays per view, per 1,000 views, and per million views. Understand RPM vs CPM, what affects your earnings, and realistic income expectations for creators.",
    metaDescription:
      "How much does YouTube pay in 2026? Understand RPM vs CPM, what affects earnings per view, and realistic income expectations. No hype, just facts about YouTube creator pay.",
    datePublished: "2026-01-02",
    dateModified: "2026-01-02",
    readingTime: "10 min read",
    category: "Monetization",
    keywords: [
      "how much does youtube pay",
      "how much do youtubers make",
      "how much does youtube pay for 1 million views",
      "how much does youtube pay per view",
      "youtube rpm",
      "youtube cpm",
      "youtube earnings",
    ],
    toc: [
      { id: "overview", title: "How YouTube Pay Works" },
      { id: "rpm-vs-cpm", title: "RPM vs CPM Explained" },
      { id: "pay-per-view", title: "How Much Per View" },
      { id: "pay-per-million", title: "How Much for 1 Million Views" },
      { id: "what-affects-pay", title: "What Affects Your Earnings" },
      { id: "niche-differences", title: "Earnings by Niche" },
      { id: "realistic-numbers", title: "Realistic Expectations" },
      { id: "beyond-ads", title: "Income Beyond Ads" },
      { id: "mistakes", title: "Common Misconceptions" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "How much does YouTube pay per view?",
        answer:
          "YouTube does not pay a fixed amount per view. Earnings depend on your RPM (revenue per mille), which typically ranges from $1 to $10 per 1,000 views. That means roughly $0.001 to $0.01 per view. Niche, audience location, ad engagement, and seasonality all affect your actual rate.",
      },
      {
        question: "How much does YouTube pay for 1 million views?",
        answer:
          "At typical RPM rates of $2 to $5, 1 million views earns roughly $2,000 to $5,000. High RPM niches like finance or business can see $10,000 or more. Low RPM niches like gaming or entertainment might earn $1,000 to $2,000. These are estimates since actual earnings vary significantly.",
      },
      {
        question: "How much do YouTubers make?",
        answer:
          "YouTuber income varies enormously. Small channels might earn $0 to $100 per month. Mid-sized channels (100K subscribers) often earn $1,000 to $10,000 monthly from ads alone. Top creators can earn millions. Most YouTubers diversify with sponsorships, merchandise, and other revenue streams.",
      },
      {
        question: "What is the difference between RPM and CPM?",
        answer:
          "CPM (cost per mille) is what advertisers pay for 1,000 ad impressions. RPM (revenue per mille) is what you earn per 1,000 video views after YouTube takes its 45% cut and accounts for videos without ads. RPM is the number that matters for your actual earnings.",
      },
      {
        question: "Why is my YouTube RPM so low?",
        answer:
          "Low RPM can result from: audience in lower-paying regions, content in low-value ad categories, videos with low ad engagement, short videos with fewer ad slots, or content that advertisers avoid. Finance and business content pays more than entertainment or gaming.",
      },
      {
        question: "Do YouTube Shorts pay less than long videos?",
        answer:
          "Generally yes. Shorts earn from a separate revenue pool and typically pay less per view than long-form content. However, Shorts can drive volume and help grow your audience for longer content. Think of Shorts as a discovery tool, not a primary revenue source.",
      },
      {
        question: "How much does YouTube pay for 100,000 views?",
        answer:
          "At average RPM rates of $2 to $5, 100,000 views earns roughly $200 to $500. High-value niches might see $500 to $1,000. This assumes all views are monetized, which is rarely the case since some viewers use ad blockers or watch from non-monetized regions.",
      },
      {
        question: "When does YouTube pay creators?",
        answer:
          "YouTube pays monthly through AdSense, typically between the 21st and 26th of each month. You need to reach the $100 payment threshold before receiving your first payout. Earnings from one month are paid the following month.",
      },
    ],
  },
  "youtube-seo": {
    slug: "youtube-seo",
    title: "YouTube SEO: How to Rank Videos and Get More Views (2026)",
    shortTitle: "YouTube SEO",
    navLabel: "YouTube SEO",
    description:
      "Learn YouTube SEO to rank your videos higher in search and get more views. This guide covers title optimization, thumbnails, descriptions, tags, and the engagement signals that actually matter.",
    metaDescription:
      "YouTube SEO guide for 2026. Learn how to optimize titles, thumbnails, descriptions, and improve engagement signals to rank videos and get more views.",
    datePublished: "2026-01-02",
    dateModified: "2026-01-02",
    readingTime: "16 min read",
    category: "Growth",
    keywords: [
      "youtube seo",
      "how to improve seo",
      "seo optimization",
      "youtube video seo",
      "youtube search ranking",
      "youtube algorithm",
      "how to get more views on youtube",
    ],
    toc: [
      { id: "what-is-youtube-seo", title: "What is YouTube SEO" },
      { id: "seo-checklist", title: "15 Minute SEO Checklist" },
      { id: "how-youtube-ranks", title: "How YouTube Ranks Videos" },
      { id: "title-optimization", title: "Title Optimization" },
      { id: "thumbnail-optimization", title: "Thumbnail Optimization" },
      { id: "description-optimization", title: "Description Best Practices" },
      { id: "tags-explained", title: "Do Tags Still Matter" },
      { id: "engagement-signals", title: "Engagement Signals" },
      { id: "keyword-research", title: "YouTube Keyword Research" },
      { id: "mistakes", title: "SEO Mistakes to Avoid" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "What is YouTube SEO?",
        answer:
          "YouTube SEO is the process of optimizing your videos to rank higher in YouTube search and get recommended more often. It involves optimizing titles, thumbnails, descriptions, and most importantly, creating content that keeps viewers watching. Unlike traditional SEO, engagement signals matter as much as metadata.",
      },
      {
        question: "How do I improve SEO on my YouTube videos?",
        answer:
          "Focus on five areas: write clear titles with your target keyword in the first 60 characters, create thumbnails that stand out and communicate value, write descriptions that hook viewers and include relevant keywords, maintain high audience retention, and encourage engagement (likes, comments, shares).",
      },
      {
        question: "How do I get more views on YouTube with SEO?",
        answer:
          "SEO drives views through two paths: search (people finding your videos through queries) and suggested (YouTube recommending your content). Optimize titles and descriptions for search, then focus on retention and engagement to get suggested more. Both require creating content people want to watch.",
      },
      {
        question: "Do YouTube tags still matter in 2026?",
        answer:
          "Tags have minimal impact on ranking in 2026. YouTube uses them mainly to understand commonly misspelled words. Your title, thumbnail, and retention matter far more. Spend 30 seconds on tags (use 3 to 5 relevant terms) and invest your time in better content instead.",
      },
      {
        question: "What is the best way to do keyword research for YouTube?",
        answer:
          "Use YouTube autocomplete: type your topic and note the suggestions. These are real searches. Check the results page to gauge competition. Look for topics where smaller channels still rank. Google Trends can show search interest over time. Focus on specific queries over broad terms.",
      },
      {
        question: "How long should my YouTube title be?",
        answer:
          "Keep titles under 60 characters to avoid truncation in search results. Put your main keyword near the beginning. Make the title clear about what the video delivers. Curiosity helps, but clarity matters more. Avoid clickbait that disappoints viewers since they will leave early and hurt your retention.",
      },
      {
        question: "How do I write a good YouTube description?",
        answer:
          "Start with a compelling hook in the first 2 sentences since that is what shows in search results. Include your main keyword naturally. Add timestamps for longer videos. Include relevant links and calls to action. The full description can be 200 to 500 words, but front-load the important information.",
      },
      {
        question: "Does upload time affect YouTube SEO?",
        answer:
          "Upload time does not directly affect SEO, but it can affect early engagement. Publishing when your audience is active gives your video a better chance at early views and engagement, which can help it get recommended. Check your Analytics to see when your viewers are on YouTube.",
      },
    ],
  },
  "free-youtube-subscribers": {
    slug: "free-youtube-subscribers",
    title:
      "Free YouTube Subscribers and Views: Why These Services Hurt Your Channel",
    shortTitle: "Free Subscribers",
    navLabel: "Avoid Fake Growth",
    description:
      "Learn why services offering free YouTube subscribers, free views, or the ability to buy subscribers damage your channel. Understand the risks and discover safe alternatives for real growth.",
    metaDescription:
      "Why free YouTube subscribers and views services hurt your channel. Understand the risks of buying subscribers, policy violations, and safe alternatives for real growth.",
    datePublished: "2026-01-02",
    dateModified: "2026-01-02",
    readingTime: "8 min read",
    category: "Safety",
    keywords: [
      "free youtube subscribers",
      "free youtube views",
      "buy youtube subscribers",
      "fake youtube subscribers",
      "youtube subscriber bots",
      "sub4sub",
    ],
    toc: [
      { id: "overview", title: "The Problem with Fake Growth" },
      { id: "how-it-works", title: "How These Services Work" },
      { id: "why-harmful", title: "Why It Hurts Your Channel" },
      { id: "policy-violations", title: "YouTube Policy Violations" },
      { id: "real-consequences", title: "Real Consequences" },
      { id: "safe-alternatives", title: "Safe Alternatives That Work" },
      { id: "faq", title: "FAQ" },
    ],
    faqs: [
      {
        question: "Should I buy YouTube subscribers?",
        answer:
          "No. Buying subscribers violates YouTube Terms of Service and damages your channel. Purchased subscribers are fake accounts that never watch your videos, which destroys your engagement metrics. YouTube can remove fake subscribers and penalize or terminate your channel. Build subscribers through quality content instead.",
      },
      {
        question: "Are free YouTube subscriber services safe?",
        answer:
          "No. Services offering free subscribers use bots, fake accounts, or sub4sub schemes. All violate YouTube policies. Even if you do not pay, you risk channel penalties, subscriber purges, and damaged engagement rates. There is no safe way to artificially inflate subscriber counts.",
      },
      {
        question: "Can I get free YouTube views from a service?",
        answer:
          "Services promising free views use bots or click farms. These views do not watch your content, which signals to YouTube that your videos are not worth recommending. You may also violate Terms of Service and risk channel strikes. Real views come from real people finding value in your content.",
      },
      {
        question: "What happens if YouTube catches fake subscribers?",
        answer:
          "YouTube regularly audits channels and removes fake subscribers. You may see sudden drops in subscriber count. Repeated violations can result in strikes, monetization suspension, or channel termination. Even one cleanup can damage your credibility and momentum.",
      },
      {
        question: "Does sub4sub work for growing a YouTube channel?",
        answer:
          "No. Sub4sub means subscribing to others in exchange for them subscribing to you. These subscribers never watch your content, which destroys your engagement rate. YouTube can also penalize channels for artificial engagement schemes. Focus on attracting subscribers who actually want to watch your videos.",
      },
      {
        question: "How do I get real YouTube subscribers?",
        answer:
          "Create content your target audience wants. Improve your packaging (titles, thumbnails) so people click. Improve your retention so people watch. Ask for the subscribe after delivering value. Post consistently. Study what works in your niche. Real growth takes longer but builds a sustainable channel.",
      },
      {
        question:
          "Why do fake subscribers hurt my channel even if I do not get caught?",
        answer:
          "YouTube uses engagement rate to decide what to recommend. If you have 10,000 subscribers but only 100 views per video, YouTube sees that your audience does not care about your content. This reduces your reach to real viewers. Fake subscribers make your metrics look worse, not better.",
      },
      {
        question: "What if a competitor buys fake subscribers for my channel?",
        answer:
          "This is rare but can happen. If you notice suspicious subscriber spikes, document them and report to YouTube through the Help menu. YouTube generally does not penalize channels for unsolicited fake engagement, but keeping records helps if issues arise.",
      },
    ],
  },
} as const;

// Array version for iteration (nav, sitemap)
export const learnArticles = Object.values(LEARN_ARTICLES).map((article) => ({
  slug: article.slug,
  label: article.navLabel,
  title: article.shortTitle,
  description: article.description,
  readingTime: article.readingTime,
  category: article.category,
}));

// Type exports
export type LearnArticleSlug = keyof typeof LEARN_ARTICLES;
export type LearnArticle = (typeof LEARN_ARTICLES)[LearnArticleSlug];

/**
 * Generate FAQPage JSON-LD schema from article FAQs
 */
export function generateFaqSchema(faqs: LearnArticle["faqs"]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Article JSON-LD schema
 */
export function generateLearnArticleSchema(article: LearnArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    url: `${BRAND.url}/learn/${article.slug}`,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      "@type": "Organization",
      name: `${BRAND.name} Team`,
      url: BRAND.url,
    },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: BRAND.url,
      logo: {
        "@type": "ImageObject",
        url: `${BRAND.url}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BRAND.url}/learn/${article.slug}`,
    },
    keywords: article.keywords.join(", "),
  };
}

/**
 * Get all other articles for cross-linking (excludes current)
 */
export function getRelatedArticles(currentSlug: string) {
  return learnArticles.filter((a) => a.slug !== currentSlug);
}
