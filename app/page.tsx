import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, FEATURES } from "@/lib/brand";
import { HeroCTAs } from "@/components/HeroCTAs";
import s from "./home.module.css";

export const metadata: Metadata = {
  title: "YouTube Growth Analytics and Video Ideas for Creators",
  description:
    "ChannelBoost is a YouTube growth tool that helps creators get more subscribers and views. Channel audits, retention analysis, competitor insights, and AI-powered video ideas.",
  alternates: {
    canonical: BRAND.url,
  },
  openGraph: {
    title: "YouTube Growth Analytics and Video Ideas for Creators",
    description:
      "Get more subscribers and views with data-driven content strategy. Channel audits, retention analysis, and AI-powered video ideas.",
    url: BRAND.url,
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main className={s.page}>
      {/* Hero Section - Primary Keyword in H1 */}
      <section className={s.hero}>
        <div className={s.badge}>YouTube Growth Tool for Creators</div>
        <h1 className={s.title}>
          YouTube Growth Analytics
          <br />
          <span className={s.highlight}>and Video Ideas for Creators</span>
        </h1>
        <p className={s.subtitle}>
          Stop guessing what to post. Get channel audits, retention analysis,
          competitor insights, and AI-powered video ideas to grow your YouTube
          channel faster.
        </p>
        <HeroCTAs />
      </section>

      {/* Social Proof */}
      <section className={s.socialProof}>
        <p className={s.proofText}>
          Trusted by <strong>2,000+</strong> YouTube creators to grow their
          channels
        </p>
      </section>

      {/* Feature Pillars - SEO-Rich Sections */}
      <section className={s.pillars} id="features">
        {/* Channel Audit */}
        <div className={s.pillar}>
          <div className={s.pillarIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className={s.pillarTitle}>{FEATURES.channelAudit.title}</h2>
          <p className={s.pillarDesc}>{FEATURES.channelAudit.description}</p>
          <ul className={s.pillarBenefits}>
            <li>
              Identify underperforming videos and why they're not getting views
            </li>
            <li>Get a content quality score with specific improvement areas</li>
            <li>
              See how your channel compares to similar creators in your niche
            </li>
          </ul>
          <Link href="/learn/youtube-channel-audit" className={s.pillarLink}>
            Learn about channel audits →
          </Link>
        </div>

        {/* Retention Analysis */}
        <div className={s.pillar}>
          <div className={s.pillarIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className={s.pillarTitle}>{FEATURES.retentionAnalysis.title}</h2>
          <p className={s.pillarDesc}>
            {FEATURES.retentionAnalysis.description}
          </p>
          <ul className={s.pillarBenefits}>
            <li>See exactly where viewers stop watching your videos</li>
            <li>Get AI-powered hypotheses for why drop-offs happen</li>
            <li>Improve watch time with specific, actionable fixes</li>
          </ul>
          <Link
            href="/learn/youtube-retention-analysis"
            className={s.pillarLink}
          >
            Learn about retention analysis →
          </Link>
        </div>

        {/* Subscriber Drivers */}
        <div className={s.pillar}>
          <div className={s.pillarIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className={s.pillarTitle}>{FEATURES.subscriberDrivers.title}</h2>
          <p className={s.pillarDesc}>
            {FEATURES.subscriberDrivers.description}
          </p>
          <ul className={s.pillarBenefits}>
            <li>
              Find your best-converting videos that turn viewers into
              subscribers
            </li>
            <li>Understand the patterns that drive subscriber growth</li>
            <li>Double down on content that builds your audience</li>
          </ul>
          <Link
            href="/learn/how-to-get-more-subscribers"
            className={s.pillarLink}
          >
            Learn how to get more subscribers →
          </Link>
        </div>

        {/* Competitor Analysis */}
        <div className={s.pillar}>
          <div className={s.pillarIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className={s.pillarTitle}>{FEATURES.competitorAnalysis.title}</h2>
          <p className={s.pillarDesc}>
            {FEATURES.competitorAnalysis.description}
          </p>
          <ul className={s.pillarBenefits}>
            <li>Monitor what's working for similar channels in your niche</li>
            <li>Find trending topics before they saturate</li>
            <li>Get alerts when outlier videos emerge in your space</li>
          </ul>
          <Link
            href="/learn/youtube-competitor-analysis"
            className={s.pillarLink}
          >
            Learn about competitor analysis →
          </Link>
        </div>

        {/* Video Ideas Engine */}
        <div className={s.pillar}>
          <div className={s.pillarIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className={s.pillarTitle}>{FEATURES.ideaEngine.title}</h2>
          <p className={s.pillarDesc}>{FEATURES.ideaEngine.description}</p>
          <ul className={s.pillarBenefits}>
            <li>Generate proven video ideas based on niche data</li>
            <li>Get title options, hooks, and thumbnail concepts</li>
            <li>Never run out of content ideas again</li>
          </ul>
          <Link href="/learn/youtube-video-ideas" className={s.pillarLink}>
            Learn about video ideas →
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className={s.howItWorks}>
        <h2 className={s.sectionTitle}>How {BRAND.name} Works</h2>
        <p className={s.sectionSubtitle}>
          Connect your channel and start getting insights in under 2 minutes
        </p>
        <div className={s.steps}>
          <div className={s.step}>
            <div className={s.stepNumber}>1</div>
            <h3 className={s.stepTitle}>Connect Your Channel</h3>
            <p className={s.stepDesc}>
              Securely link your YouTube channel with Google OAuth. We only
              request read-only access to your analytics data.
            </p>
          </div>

          <div className={s.step}>
            <div className={s.stepNumber}>2</div>
            <h3 className={s.stepTitle}>Get Your Analysis</h3>
            <p className={s.stepDesc}>
              We analyze your video performance, retention curves, subscriber
              patterns, and compare to similar channels.
            </p>
          </div>

          <div className={s.step}>
            <div className={s.stepNumber}>3</div>
            <h3 className={s.stepTitle}>Grow Faster</h3>
            <p className={s.stepDesc}>
              Get personalized video ideas and actionable recommendations based
              on what's actually working in your niche.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={s.faqSection} id="faq">
        <h2 className={s.sectionTitle}>Frequently Asked Questions</h2>
        <div className={s.faqGrid}>
          <FAQItem
            question="How do I get more subscribers on YouTube?"
            answer="Focus on content that converts viewers into subscribers. ChannelBoost identifies your highest-converting videos and shows you the patterns that drive subscriber growth. Create more content like your best performers, optimize your video packaging (titles, thumbnails), and improve retention to keep viewers watching longer."
          />
          <FAQItem
            question="What is a YouTube channel audit?"
            answer="A channel audit is a comprehensive analysis of your YouTube channel's performance. It examines your content quality, video performance patterns, audience retention, and growth trends. ChannelBoost provides automated channel audits that identify underperforming content and give you specific recommendations to improve."
          />
          <FAQItem
            question="How do I improve audience retention on YouTube?"
            answer="Improving retention starts with understanding where viewers drop off. ChannelBoost shows you exact timestamps where viewers leave and provides AI-powered hypotheses for why. Common fixes include stronger hooks in the first 30 seconds, better pacing, pattern interrupts, and delivering on your title promise faster."
          />
          <FAQItem
            question="How do I find competitor videos that are working?"
            answer="ChannelBoost monitors channels similar to yours and surfaces their top-performing videos. We track velocity (how fast videos gain views), outlier scores (videos performing above the channel's average), and trending topics. This helps you spot opportunities before they become saturated."
          />
          <FAQItem
            question="What are outlier videos on YouTube?"
            answer="Outlier videos are videos that perform significantly better than a channel's average. They often indicate topics or formats that resonate with audiences. ChannelBoost identifies outliers from competitors so you can learn from what's working and adapt those strategies for your channel."
          />
          <FAQItem
            question="How does ChannelBoost generate video ideas?"
            answer="Our video ideas engine analyzes what's working in your niche by looking at trending topics, competitor successes, and your own best performers. We then generate personalized ideas with title options, hook suggestions, and thumbnail concepts based on proven patterns."
          />
          <FAQItem
            question="Is my YouTube data secure?"
            answer="Yes. We use Google OAuth for authentication and only request read-only access to your analytics. We never post to your channel or modify anything. Your data is encrypted in transit and at rest, and you can revoke access anytime from your Google security settings."
          />
          <FAQItem
            question="Do I need a minimum number of videos or subscribers?"
            answer="ChannelBoost works best for channels with at least 10 videos and some view history. The more data we have, the better our insights. However, even newer channels can benefit from competitor analysis and video ideas based on niche trends."
          />
        </div>
        {/* FAQ JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How do I get more subscribers on YouTube?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Focus on content that converts viewers into subscribers. ChannelBoost identifies your highest-converting videos and shows you the patterns that drive subscriber growth.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is a YouTube channel audit?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "A channel audit is a comprehensive analysis of your YouTube channel's performance examining content quality, video performance patterns, audience retention, and growth trends.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I improve audience retention on YouTube?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Improving retention starts with understanding where viewers drop off. Common fixes include stronger hooks, better pacing, pattern interrupts, and delivering on your title promise faster.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I find competitor videos that are working?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "ChannelBoost monitors channels similar to yours and surfaces their top-performing videos, tracking velocity, outlier scores, and trending topics.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What are outlier videos on YouTube?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Outlier videos perform significantly better than a channel's average, often indicating topics or formats that resonate with audiences.",
                  },
                },
              ],
            }),
          }}
        />
      </section>

      {/* CTA Section */}
      <section className={s.ctaSection}>
        <h2 className={s.ctaTitle}>Ready to Grow Your YouTube Channel?</h2>
        <p className={s.ctaSubtitle}>
          Join thousands of creators using data-driven content strategy to get
          more subscribers and views.
        </p>
        <HeroCTAs />
      </section>
    </main>
  );
}

/* FAQ Item Component */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className={s.faqItem}>
      <h3 className={s.faqQuestion}>{question}</h3>
      <p className={s.faqAnswer}>{answer}</p>
    </div>
  );
}
