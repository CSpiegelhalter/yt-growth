/**
 * Contact page content - SEO-optimized copy for the contact page
 * Improves text-to-HTML ratio while providing helpful information
 */

import { BRAND } from "@/lib/brand";

export const CONTACT_CONTENT = {
  hero: {
    title: "Contact Us",
    subtitle: `Have questions about ${BRAND.name} or need help growing your YouTube channel? We're here to help.`,
  },

  intro: `Whether you're troubleshooting an issue, requesting a feature, or just want to say hello, 
we read and respond to every message. Most inquiries get a reply within 24-48 hours.`,

  sections: {
    whatWeHelp: {
      title: "What We Can Help With",
      items: [
        {
          label: "Technical Support",
          description:
            "Issues connecting your YouTube channel, data sync problems, or bugs in the dashboard",
        },
        {
          label: "Account & Billing",
          description:
            "Subscription questions, payment issues, plan upgrades, or cancellation requests",
        },
        {
          label: "Feature Requests",
          description:
            "Ideas for new tools or improvements to existing features—we love hearing from creators",
        },
        {
          label: "Partnerships & Press",
          description:
            "Business inquiries, affiliate programs, or media coverage opportunities",
        },
      ],
    },

    beforeContact: {
      title: "Before You Reach Out",
      description:
        "Many common questions are answered in our learning center. Check these guides first:",
      links: [
        { href: "/learn/youtube-channel-audit", label: "How to audit your channel" },
        { href: "/learn/youtube-retention-analysis", label: "Understanding retention analysis" },
        { href: "/learn/how-to-get-more-subscribers", label: "Growing your subscriber count" },
        { href: "/learn/youtube-competitor-analysis", label: "Researching competitors" },
      ],
    },

    expectations: {
      title: "What to Expect",
      items: [
        "Response within 24-48 hours (usually faster)",
        "Personalized help from a real person, not automated responses",
        "Follow-up if we need more details to solve your issue",
        "Clear next steps or resolution in every reply",
      ],
    },
  },

  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        question: "How long does it take to get a response?",
        answer:
          "Most messages receive a response within 24 hours during business days. Complex technical issues may take up to 48 hours as we investigate.",
      },
      {
        question: "Can I get a refund if I'm not satisfied?",
        answer:
          "Yes. If you're not happy with your subscription, contact us within 30 days of purchase and we'll process a full refund—no questions asked.",
      },
      {
        question: "My YouTube channel isn't syncing. What should I do?",
        answer:
          "First, try disconnecting and reconnecting your channel in the dashboard settings. If that doesn't work, contact us with your channel URL and we'll investigate.",
      },
      {
        question: "Do you offer custom plans for agencies or large channels?",
        answer:
          "Yes, we offer custom enterprise plans for agencies managing multiple channels and large creators with specific needs. Reach out to discuss your requirements.",
      },
      {
        question: "How can I request a new feature?",
        answer:
          "Use the contact form and select 'Feature Request' as the subject. Describe what you'd like to see and how it would help your workflow. We prioritize features based on creator feedback.",
      },
    ],
  },

  directEmail: {
    intro: "Prefer email? Reach us directly at",
    email: BRAND.email,
  },

  productBlurb: {
    title: `About ${BRAND.name}`,
    description: `${BRAND.name} is a YouTube growth platform that helps creators make better content decisions with data. 
Our tools include channel audits, retention analysis, competitor research, and AI-powered video ideas—everything you need to grow faster.`,
    cta: {
      label: "Explore our features",
      href: "/#features",
    },
  },
} as const;
