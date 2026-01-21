import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, FEATURES } from "@/lib/brand";
import { HOME_CONTENT } from "@/lib/content/home";
import { HeroStaticCTAs } from "@/components/HeroStaticCTAs";
import { LEARN_ARTICLES } from "./learn/articles";

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
    <main className="landingPage">
      {/* Hero Section - Primary Keyword in H1 */}
      <section className="landingHero">
        <div className="landingBadge">YouTube Growth Tool for Creators</div>
        <h1 className="landingTitle">
          YouTube Growth Analytics
          <br />
          <span className="landingHighlight">and Video Ideas for Creators</span>
        </h1>
        <p className="landingSubtitle">
          Stop guessing what to post. Get channel audits, retention analysis,
          competitor insights, and video ideas to grow your YouTube channel
          faster.
        </p>
        <HeroStaticCTAs />
      </section>

      {/* Social Proof */}
      <section className="landingSocialProof">
        <p className="landingProofText">
          Trusted by <strong>2,000+</strong> YouTube creators to grow their
          channels
        </p>
      </section>

      {/* Feature Pillars - SEO-Rich Sections */}
      <section className="landingPillars" id="features">
        {/* Channel Audit */}
        <div className="landingPillar">
          <div className="landingPillarIcon">
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
          <h2 className="landingPillarTitle">{FEATURES.channelAudit.title}</h2>
          <p className="landingPillarDesc">
            {FEATURES.channelAudit.description}
          </p>
          <ul className="landingPillarBenefits">
            <li>
              Identify underperforming videos and why they're not getting views
            </li>
            <li>Get recommendations for specific improvement areas</li>
            <li>
              See how your channel compares to similar creators in your niche
            </li>
          </ul>
          <Link
            href="/learn/youtube-channel-audit"
            className="landingPillarLink"
          >
            Learn about channel audits →
          </Link>
        </div>

        {/* Retention Analysis */}
        <div className="landingPillar">
          <div className="landingPillarIcon">
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
          <h2 className="landingPillarTitle">
            {FEATURES.retentionAnalysis.title}
          </h2>
          <p className="landingPillarDesc">
            {FEATURES.retentionAnalysis.description}
          </p>
          <ul className="landingPillarBenefits">
            <li>See exactly where viewers stop watching your videos</li>
            <li>Compare your retention curves to top-performing videos</li>
            <li>Improve watch time with specific, actionable fixes</li>
          </ul>
          <Link
            href="/learn/youtube-retention-analysis"
            className="landingPillarLink"
          >
            Learn about retention analysis →
          </Link>
        </div>

        {/* Subscriber Drivers */}
        <div className="landingPillar">
          <div className="landingPillarIcon">
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
          <h2 className="landingPillarTitle">
            {FEATURES.subscriberDrivers.title}
          </h2>
          <p className="landingPillarDesc">
            {FEATURES.subscriberDrivers.description}
          </p>
          <ul className="landingPillarBenefits">
            <li>
              Find your best-converting videos that turn viewers into
              subscribers
            </li>
            <li>Understand the patterns that drive subscriber growth</li>
            <li>Double down on content that builds your audience</li>
          </ul>
          <Link
            href="/learn/how-to-get-more-subscribers"
            className="landingPillarLink"
          >
            Learn how to get more subscribers →
          </Link>
        </div>

        {/* Competitor Analysis */}
        <div className="landingPillar">
          <div className="landingPillarIcon">
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
          <h2 className="landingPillarTitle">
            {FEATURES.competitorAnalysis.title}
          </h2>
          <p className="landingPillarDesc">
            {FEATURES.competitorAnalysis.description}
          </p>
          <ul className="landingPillarBenefits">
            <li>Monitor what's working for similar channels in your niche</li>
            <li>Find trending topics before they saturate</li>
            <li>Get alerts when outlier videos emerge in your space</li>
          </ul>
          <Link
            href="/learn/youtube-competitor-analysis"
            className="landingPillarLink"
          >
            Learn about competitor analysis →
          </Link>
        </div>

        {/* Video Ideas Engine */}
        <div className="landingPillar">
          <div className="landingPillarIcon">
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
          <h2 className="landingPillarTitle">{FEATURES.ideaEngine.title}</h2>
          <p className="landingPillarDesc">{FEATURES.ideaEngine.description}</p>
          <ul className="landingPillarBenefits">
            <li>Generate proven video ideas based on niche data</li>
            <li>Get title options, hooks, and thumbnail concepts</li>
            <li>Never run out of content ideas again</li>
          </ul>
          <Link href="/learn/youtube-video-ideas" className="landingPillarLink">
            Learn about video ideas →
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="landingHowItWorks">
        <h2 className="landingSectionTitle">How {BRAND.name} Works</h2>
        <p className="landingSectionSubtitle">
          Connect your channel and start getting insights in under 2 minutes
        </p>
        <div className="landingSteps">
          <div className="landingStep">
            <div className="landingStepNumber">1</div>
            <h3 className="landingStepTitle">Connect Your Channel</h3>
            <p className="landingStepDesc">
              Securely link your YouTube channel with Google OAuth. We only
              request read-only access to your analytics data.
            </p>
          </div>

          <div className="landingStep">
            <div className="landingStepNumber">2</div>
            <h3 className="landingStepTitle">Get Your Analysis</h3>
            <p className="landingStepDesc">
              We analyze your video performance, retention curves, subscriber
              patterns, and compare to similar channels.
            </p>
          </div>

          <div className="landingStep">
            <div className="landingStepNumber">3</div>
            <h3 className="landingStepTitle">Grow Faster</h3>
            <p className="landingStepDesc">
              Get personalized video ideas and actionable recommendations based
              on what's actually working in your niche.
            </p>
          </div>
        </div>
      </section>

      {/* Popular Learn Guides - Internal links for SEO */}
      <PopularGuidesSection />

      {/* SEO Content Section - Additional text-rich content */}
      <section className="landingSeoSection">
        <h2 className="landingSeoTitle">{HOME_CONTENT.seoSection.title}</h2>
        <p className="landingSeoIntro">{HOME_CONTENT.seoSection.intro}</p>

        {/* Content Paragraphs */}
        <div className="landingSeoContent">
          {HOME_CONTENT.seoSection.paragraphs.map((para) => (
            <div key={para.heading} className="landingSeoBlock">
              <h3>{para.heading}</h3>
              <p>{para.text}</p>
            </div>
          ))}
        </div>

        {/* Who It's For + Use Cases */}
        <div className="landingSeoGrid">
          <div className="landingSeoGridSection">
            <h3>{HOME_CONTENT.seoSection.whoItsFor.title}</h3>
            <ul className="landingSeoList">
              {HOME_CONTENT.seoSection.whoItsFor.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="landingSeoGridSection">
            <h3>{HOME_CONTENT.seoSection.useCases.title}</h3>
            <ul className="landingSeoList">
              {HOME_CONTENT.seoSection.useCases.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Callout */}
        <div className="landingSeoCallout">
          <p>{HOME_CONTENT.seoSection.callout.text}</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="landingFaqSection" id="faq">
        <h2 className="landingSectionTitle">Frequently Asked Questions</h2>
        <div className="landingFaqGrid">
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
            answer="Improving retention starts with understanding where viewers drop off. ChannelBoost shows you exact timestamps where viewers leave and lets you compare against top-performing videos. Common fixes include stronger hooks in the first 30 seconds, better pacing, pattern interrupts, and delivering on your title promise faster."
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
            question="Do I need a minimum number of videos or subscribers?"
            answer="ChannelBoost works best for channels with at least 10 videos and some view history. The more data we have, the better our insights. However, even newer channels can benefit from competitor analysis and video ideas based on niche trends."
          />
          {/* Additional FAQs from content */}
          {HOME_CONTENT.additionalFaq.map((faq) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
        {/* FAQ JSON-LD Schema - All FAQ items for complete structured data */}
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
                    text: "Focus on content that converts viewers into subscribers. ChannelBoost identifies your highest-converting videos and shows you the patterns that drive subscriber growth. Create more content like your best performers, optimize your video packaging (titles, thumbnails), and improve retention to keep viewers watching longer.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is a YouTube channel audit?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "A channel audit is a comprehensive analysis of your YouTube channel's performance. It examines your content quality, video performance patterns, audience retention, and growth trends. ChannelBoost provides automated channel audits that identify underperforming content and give you specific recommendations to improve.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I improve audience retention on YouTube?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Improving retention starts with understanding where viewers drop off. ChannelBoost shows you exact timestamps where viewers leave and lets you compare against top-performing videos. Common fixes include stronger hooks in the first 30 seconds, better pacing, pattern interrupts, and delivering on your title promise faster.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I find competitor videos that are working?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "ChannelBoost monitors channels similar to yours and surfaces their top-performing videos. We track velocity (how fast videos gain views), outlier scores (videos performing above the channel's average), and trending topics. This helps you spot opportunities before they become saturated.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What are outlier videos on YouTube?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Outlier videos are videos that perform significantly better than a channel's average. They often indicate topics or formats that resonate with audiences. ChannelBoost identifies outliers from competitors so you can learn from what's working and adapt those strategies for your channel.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does ChannelBoost generate video ideas?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Our video ideas engine analyzes what's working in your niche by looking at trending topics, competitor successes, and your own best performers. We then generate personalized ideas with title options, hook suggestions, and thumbnail concepts based on proven patterns.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do I need a minimum number of videos or subscribers?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "ChannelBoost works best for channels with at least 10 videos and some view history. The more data we have, the better our insights. However, even newer channels can benefit from competitor analysis and video ideas based on niche trends.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is ChannelBoost free to use?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "You can connect your channel and see basic insights for free. Pro features like unlimited video ideas, advanced retention analysis, and competitor tracking require a subscription.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is ChannelBoost different from YouTube Studio?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "YouTube Studio shows you raw data. ChannelBoost interprets that data and gives you specific, actionable recommendations. We also add competitor analysis, AI video ideas, and niche benchmarking that YouTube doesn't provide.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is my channel data secure?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. We use OAuth 2.0 for authentication (we never see your password), request only read-only analytics access, and encrypt all stored data. We never share your information with third parties.",
                  },
                },
              ],
            }),
          }}
        />
      </section>

      {/* CTA Section */}
      <section className="landingCtaSection">
        <h2 className="landingCtaTitle">Ready to Grow Your YouTube Channel?</h2>
        <p className="landingCtaSubtitle">
          Join thousands of creators using data-driven content strategy to get
          more subscribers and views.
        </p>
        <HeroStaticCTAs />
      </section>
    </main>
  );
}

/* FAQ Item Component */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="landingFaqItem">
      <h3 className="landingFaqQuestion">{question}</h3>
      <p className="landingFaqAnswer">{answer}</p>
    </div>
  );
}

/**
 * Popular Learn Guides - Internal links section for SEO
 * Links to 10 high-value learn articles to improve internal linking
 */
const POPULAR_GUIDE_SLUGS = [
  "youtube-channel-audit",
  "youtube-retention-analysis",
  "how-to-get-more-subscribers",
  "youtube-video-ideas",
  "youtube-competitor-analysis",
  "youtube-seo",
  "youtube-algorithm",
  "youtube-monetization-requirements",
  "how-to-make-a-youtube-channel",
  "youtube-tag-generator",
] as const;

function PopularGuidesSection() {
  const guides = POPULAR_GUIDE_SLUGS.map((slug) => {
    const article = LEARN_ARTICLES[slug];
    return {
      slug,
      title: article.shortTitle,
      description: article.description.slice(0, 120) + "...",
    };
  });

  return (
    <section className="landingGuidesSection">
      <h2 className="landingSectionTitle">Free YouTube Growth Guides</h2>
      <p className="landingSectionSubtitle">
        Learn proven strategies to grow your channel with our free guides
      </p>
      <div className="landingGuidesGrid">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/learn/${guide.slug}`}
            className="landingGuideCard"
          >
            <h3 className="landingGuideTitle">{guide.title}</h3>
            <p className="landingGuideDesc">{guide.description}</p>
            <span className="landingGuideLink">Read guide →</span>
          </Link>
        ))}
      </div>
      <div className="landingGuidesMore">
        <Link href="/learn" className="landingGuidesMoreLink">
          View all YouTube growth guides →
        </Link>
      </div>
    </section>
  );
}
