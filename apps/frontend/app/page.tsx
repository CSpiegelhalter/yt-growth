import Script from "next/script";
import styles from "./home.module.css";

export const metadata = {
  title: "YouTube Growth — Audit, Insights & Actionable Recommendations",
  description:
    "Turn views into fans. Get an AI-powered audit of your YouTube channel, see audience insights (age, CTR, retention), and get step-by-step recommendations for titles, thumbnails, and topics.",
  openGraph: {
    title: "YouTube Growth — Audit, Insights & Actionable Recommendations",
    description:
      "Turn views into fans. Audit your channel, uncover audience insights, and get concrete actions to grow faster.",
    url: "https://yourdomain.com/",
    siteName: "YouTube Growth",
    images: [
      { url: "https://yourdomain.com/og-image.jpg", width: 1200, height: 630 },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Growth — Audit, Insights & Actionable Recommendations",
    description:
      "AI-powered audits, CTR & retention insights, and concrete actions to grow your channel.",
    images: ["https://yourdomain.com/og-image.jpg"],
  },
};

export default function Home() {
  const jsonLdApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "YouTube Growth",
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    description:
      "AI-powered audits and recommendations to grow your YouTube channel: CTR, retention, audience insights, and content strategy.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "FreeTrial",
    },
  };

  const jsonLdFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does YouTube Growth work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Connect your channel. We analyze your videos and analytics to surface opportunities and generate specific actions: better titles, descriptions, thumbnails, topics, and publishing cadence.",
        },
      },
      {
        "@type": "Question",
        name: "Will this help small or brand-new channels?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. We tailor suggestions to your current stage—early channels get discovery-focused guidance; growing channels get optimization and retention playbooks.",
        },
      },
      {
        "@type": "Question",
        name: "Is this safe for my account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. We use read-only YouTube permissions. You’re always in control and can disconnect anytime.",
        },
      },
    ],
  };

  return (
    <main>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.title}>
            Become a YouTuber people can’t stop watching.
          </h1>
          <p className={styles.subtitle}>
            Audit your channel, understand your audience, and get{" "}
            <strong>step-by-step</strong> actions to grow—better titles,
            thumbnails, topics, and publishing cadence. No guesswork.
          </p>

          <div className={styles.ctaRow}>
            <a
              href="/api/integrations/google/start"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Connect your channel
            </a>
            <a href="/dashboard" className={`${styles.btn} ${styles.btnGhost}`}>
              View dashboard →
            </a>
          </div>

          <div className={styles.trust}>
            <span>⚡ AI-powered insights</span>
            <span>🔍 Read-only access</span>
            <span>🎯 Actionable playbooks</span>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className={styles.section}>
        <h2 className={styles.h2}>Everything you need to grow on YouTube</h2>
        <div className={styles.grid3}>
          <Feature
            title="Smart Channel Audit"
            desc="Scan your entire catalog. We benchmark performance, identify what’s working, and expose blind spots in seconds."
          />
          <Feature
            title="Audience Insights"
            desc="See who’s really watching: age bands, geography, session starts, CTR, AVD, retention drops, and binge drivers."
          />
          <Feature
            title="CTR Uplift Plan"
            desc="Get title and thumbnail suggestions aligned to search intent and browsing behavior—engineered to increase clicks."
          />
          <Feature
            title="Retention Playbook"
            desc="Hook ideas, pacing fixes, and structural edits at exact drop-off timestamps to improve watch time and session depth."
          />
          <Feature
            title="SEO & Topic Strategy"
            desc="Keyword gaps, competitor overlap, and content clusters so your next 10 uploads are positioned to win."
          />
          <Feature
            title="Description & Metadata"
            desc="Auto-generated descriptions, chapters, tags, and CTAs that boost discoverability without keyword stuffing."
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles.sectionAlt}>
        <h2 className={styles.h2}>How it works</h2>
        <ol className={styles.steps}>
          <li>
            <strong>Connect:</strong> Link your YouTube channel with read-only
            access.
          </li>
          <li>
            <strong>Analyze:</strong> We pull analytics (CTR, retention,
            audience) and review your titles, thumbnails, and descriptions.
          </li>
          <li>
            <strong>Act:</strong> Follow clear, prioritized recommendations
            tailored to your niche and growth stage.
          </li>
        </ol>
        <div className={styles.ctaCenter}>
          <a
            href="/api/integrations/google/start"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            Start free audit
          </a>
        </div>
      </section>

      {/* EXTRA GROWTH METHODS */}
      <section className={styles.section}>
        <h2 className={styles.h2}>More ways we help you grow</h2>
        <div className={styles.grid2}>
          <Card
            title="Title & Thumbnail A/B Ideas"
            desc="Generate 10+ data-driven variations per video with rationales tied to search vs. browse behavior."
          />
          <Card
            title="Content Calendar"
            desc="A rhythm you can sustain—publish cadence and topic clustering to compound momentum."
          />
          <Card
            title="Community & Shorts Expansion"
            desc="Turn long-form hits into short-form hooks and community posts to boost session starts and return viewers."
          />
          <Card
            title="Competitor Gap Analysis"
            desc="Find topics your competitors rank for that you don’t, and get outlines to close the gap quickly."
          />
          <Card
            title="Hook & Structure Generator"
            desc="Cold open scripts, hook lines, and pacing frameworks calibrated to your average view duration."
          />
          <Card
            title="End-screen & CTA Tuning"
            desc="Sequence end-screens and playlists that lift session depth and recommended traffic."
          />
        </div>
      </section>

      {/* SOCIAL PROOF / BANNER */}
      <section className={styles.banner}>
        <p>
          “This is the clearest roadmap I’ve had for my channel—my CTR went from
          3.8% to 6.1% in three uploads.”{" "}
          <span className={styles.muted}>— Creator, Tech Niche</span>
        </p>
      </section>

      {/* FAQ */}
      <section className={styles.sectionAlt}>
        <h2 className={styles.h2}>Frequently asked questions</h2>
        <div className={styles.faqGrid}>
          <FAQ
            q="Will this work if I’m just starting?"
            a="Yes. We optimize for your stage—early channels get discovery and conversion fundamentals; growing channels get retention and scaling playbooks."
          />
          <FAQ
            q="Do you post on my behalf?"
            a="No. Permissions are read-only. You stay in control and can disconnect any time."
          />
          <FAQ
            q="How quickly will I see results?"
            a="Many creators see an uplift in CTR and watch time on their next 2-3 uploads when they implement title, thumbnail, and hook recommendations."
          />
          <FAQ
            q="What data do you analyze?"
            a="We use YouTube Analytics data (CTR, impressions, retention, audience) and content data (titles, descriptions, topics) to generate tailored actions."
          />
        </div>
        <div className={styles.ctaCenter}>
          <a
            href="/api/integrations/google/start"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            Connect your channel
          </a>
        </div>
      </section>

      {/* JSON-LD for SEO */}
      <Script
        id="jsonld-app"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
      />
      <Script
        id="jsonld-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
      />
    </main>
  );
}

/* --- tiny presentational components --- */
function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className={styles.feature}>
      <h3 className={styles.h3}>{title}</h3>
      <p className={styles.p}>{desc}</p>
    </div>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.h3}>{title}</h3>
      <p className={styles.p}>{desc}</p>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className={styles.faq}>
      <summary className={styles.faqQ}>{q}</summary>
      <p className={styles.faqA}>{a}</p>
    </details>
  );
}
