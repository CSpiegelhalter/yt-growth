/**
 * Contact page content - SEO-optimized copy for the contact page
 * Improves text-to-HTML ratio while providing helpful information
 */

import { BRAND } from "@/lib/brand";

export const CONTACT_CONTENT = {
  hero: {
    title: "Contact Us",
    subtitle: `Have questions about ${BRAND.name} or need help growing your YouTube channel? Our support team is here to help you succeed.`,
  },

  intro: `Whether you're troubleshooting an issue, requesting a feature, or just want to say hello, we read and respond to every message personally. Most inquiries get a reply within 24-48 hours during business days. We're a small team of YouTube creators and developers who built ${BRAND.name} because we needed it for our own channels, so we understand the challenges you face and take your feedback seriously. Your questions help us improve the product for everyone.`,

  sections: {
    whatWeHelp: {
      title: "What We Can Help With",
      items: [
        {
          label: "Technical Support",
          description:
            "Issues connecting your YouTube channel through OAuth, data sync problems, missing analytics data, or bugs in the dashboard. We can help troubleshoot why your channel data isn't updating or why certain features aren't working as expected.",
        },
        {
          label: "Account & Billing",
          description:
            "Subscription questions, payment issues, plan upgrades, downgrades, or cancellation requests. We offer a 30-day money-back guarantee on all plans, no questions asked.",
        },
        {
          label: "Feature Requests",
          description:
            "Ideas for new tools or improvements to existing features—we love hearing from creators about what would make their workflow easier. Many of our best features came directly from user suggestions.",
        },
        {
          label: "Partnerships & Press",
          description:
            "Business inquiries, affiliate programs, YouTube creator collaborations, or media coverage opportunities. We work with creators of all sizes and are always open to partnerships that help the community.",
        },
      ],
    },

    beforeContact: {
      title: "Before You Reach Out",
      description:
        "Many common questions are answered in our learning center, which contains free guides on YouTube growth, analytics, and content strategy. You might find your answer faster by checking these resources first:",
      links: [
        { href: "/learn/youtube-channel-audit", label: "How to audit your channel and diagnose growth issues" },
        { href: "/learn/youtube-retention-analysis", label: "Understanding retention analysis and watch time" },
        { href: "/learn/how-to-get-more-subscribers", label: "Proven strategies for growing your subscriber count" },
        { href: "/learn/youtube-competitor-analysis", label: "Researching competitors and finding content opportunities" },
      ],
    },

    expectations: {
      title: "What to Expect After Contacting Us",
      items: [
        "Response within 24-48 hours during business days, often much faster for urgent issues",
        "Personalized help from a real person who understands YouTube and creator needs, not automated responses",
        "Follow-up questions if we need more details to solve your specific issue correctly",
        "Clear next steps or a complete resolution in every reply, so you're never left wondering what happens next",
      ],
    },
  },

  faq: {
    title: "Frequently Asked Questions About Support",
    items: [
      {
        question: "How long does it take to get a response?",
        answer:
          "Most messages receive a response within 24 hours during business days (Monday through Friday). Complex technical issues that require investigation may take up to 48 hours. If your issue is urgent, mention that in your message and we'll prioritize it.",
      },
      {
        question: "Can I get a refund if I'm not satisfied?",
        answer:
          "Yes, absolutely. We offer a 30-day money-back guarantee on all subscription plans. If you're not happy with the product for any reason, contact us within 30 days of purchase and we'll process a full refund—no questions asked, no hoops to jump through.",
      },
      {
        question: "My YouTube channel isn't syncing. What should I do?",
        answer:
          "First, try disconnecting and reconnecting your channel in the dashboard settings. Make sure you're granting all the required permissions during the OAuth flow. If that doesn't work, contact us with your channel URL and a description of what's happening, and we'll investigate the issue on our end.",
      },
      {
        question: "Do you offer custom plans for agencies or large channels?",
        answer:
          "Yes, we offer custom enterprise plans for agencies managing multiple YouTube channels and large creators with specific needs. These plans include dedicated support, custom integrations, and volume pricing. Reach out through this form to discuss your requirements and we'll create a tailored solution.",
      },
      {
        question: "How can I request a new feature?",
        answer:
          "Use the contact form and select 'Feature Request' as the subject. Describe what you'd like to see and how it would help your workflow—the more detail you provide, the better we can understand your needs. We prioritize features based on creator feedback, and many of our most popular tools came directly from user suggestions.",
      },
      {
        question: "How do I cancel my subscription?",
        answer:
          "You can cancel your subscription at any time from the billing section of your dashboard. Your access will continue until the end of your current billing period. If you need help with cancellation or have questions about your account status, contact us through this form.",
      },
    ],
  },

  directEmail: {
    intro: "Prefer email? Reach us directly at",
    email: BRAND.email,
  },

  productBlurb: {
    title: `About ${BRAND.name}`,
    description: `${BRAND.name} is a YouTube growth platform built by creators, for creators. We help you make better content decisions by surfacing the analytics that actually matter and automating the research that would otherwise take hours. Our tools include comprehensive channel audits that diagnose why your videos aren't getting views, retention analysis that shows exactly where viewers drop off, competitor research that identifies trending topics in your niche, and AI-powered video idea generation based on what's actually working. Whether you're just starting out or you're an established creator looking to break through to the next level, our data-driven approach helps you grow faster by focusing on what works.`,
    cta: {
      label: "Explore our features",
      href: "/#features",
    },
  },
} as const;
