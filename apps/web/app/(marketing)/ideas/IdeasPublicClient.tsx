"use client";

import { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import s from "./ideas.module.css";
import { useToast } from "@/components/ui/Toast";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import { SUBSCRIPTION, formatUsd } from "@/lib/product";

// ============================================
// TYPES
// ============================================

type VideoIdea = {
  id: string;
  title: string;
  hook: string;
  format: "shorts" | "longform";
  targetKeyword: string;
  whyItWins: string;
  outline: string[];
  seoNotes: {
    primaryKeyword: string;
    supportingKeywords: string[];
  };
};

type GenerateResponse = {
  ideas: VideoIdea[];
  meta?: {
    topicDescription: string;
    location: string;
    generatedAt: string;
    cached?: boolean;
  };
  usage?: {
    used: number;
    limit: number;
    remaining: number;
    resetAt: string;
  };
  needsAuth?: boolean;
  needsUpgrade?: boolean;
};

type UsageInfo = {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
};

// Free plan limit - used to determine if user should see upgrade prompt
const FREE_PLAN_LIMIT = 10;

// ============================================
// COMPONENT
// ============================================

export function IdeasPublicClient() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Form state
  const [topic, setTopic] = useState("");
  const [formatPreference, setFormatPreference] = useState<"mixed" | "shorts" | "longform">("mixed");

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Derived state
  const isAuthenticated = authStatus === "authenticated";
  const isAuthLoading = authStatus === "loading";

  // Check if user has used their free generation (only for FREE users)
  const hasReachedLimit = useMemo(() => {
    if (!usageInfo) return false;
    return usageInfo.remaining <= 0;
  }, [usageInfo]);

  // Check if user is on FREE plan (limit <= FREE_PLAN_LIMIT)
  const isFreePlan = useMemo(() => {
    if (!usageInfo) return true; // Assume free until we know
    return usageInfo.limit <= FREE_PLAN_LIMIT;
  }, [usageInfo]);

  // Toggle shorts format
  const toggleShorts = useCallback(() => {
    setFormatPreference((prev) => (prev === "shorts" ? "mixed" : "shorts"));
  }, []);

  // Handle generate action
  const handleGenerate = useCallback(async (isMore = false) => {
    // Validate topic
    const trimmedTopic = topic.trim();
    if (!trimmedTopic || trimmedTopic.length < 3) {
      setError("Please describe what kind of videos you want ideas for (at least 3 characters)");
      return;
    }

    setError(null);
    if (isMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await apiFetchJson<GenerateResponse>(
        "/api/keywords/ideas",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicDescription: trimmedTopic,
            locationCode: "us",
            formatPreference,
          }),
        }
      );

      // Handle auth-on-action response
      if (response.needsAuth) {
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/auth/login?redirect=${returnUrl}`);
        return;
      }

      // Handle upgrade required
      if (response.needsUpgrade) {
        setUsageInfo({
          used: 0,
          limit: 0,
          remaining: 0,
          resetAt: "",
        });
        setError("You've reached your daily limit. Upgrade for more generations.");
        return;
      }

      // Success - update state
      if (isMore) {
        // Append new ideas, avoiding duplicates by title
        const existingTitles = new Set(ideas.map((i) => i.title.toLowerCase()));
        const newIdeas = response.ideas.filter(
          (i) => !existingTitles.has(i.title.toLowerCase())
        );
        setIdeas((prev) => [...prev, ...newIdeas]);
        toast(`Generated ${newIdeas.length} more video ideas!`, "success");
      } else {
        setIdeas(response.ideas);
        setHasGenerated(true);
        toast(`Generated ${response.ideas.length} video ideas backed by keyword data!`, "success");
      }

      if (response.usage) {
        setUsageInfo({
          used: response.usage.used,
          limit: response.usage.limit,
          remaining: response.usage.remaining,
          resetAt: response.usage.resetAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    } catch (err) {
      console.error("Generate error:", err);

      if (isApiClientError(err)) {
        if (err.status === 401) {
          const returnUrl = encodeURIComponent(pathname);
          router.push(`/auth/login?redirect=${returnUrl}`);
          return;
        }

        setError(err.message || "Failed to generate ideas");
        return;
      }

      setError("Failed to generate ideas. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pathname, router, topic, formatPreference, ideas, toast]);

  // Generate more ideas
  const handleGenerateMore = useCallback(() => {
    handleGenerate(true);
  }, [handleGenerate]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    handleGenerate(false);
  }, [handleGenerate]);

  return (
    <div className={s.pageWrapper}>
      {/* Hero */}
      <header className={s.hero}>
        <h1 className={s.heroTitle}>
          <span className={s.heroTitleAccent}>Video Ideas</span> Generator
        </h1>
        <p className={s.heroSubtitle}>
          Get data-backed video ideas based on real keyword demand in your niche.
        </p>
      </header>

      {/* Tool Card */}
      <section className={s.toolCard}>
        <div className={s.formSection}>
          {/* Topic Input */}
          <div className={s.field}>
            <label htmlFor="topic" className={s.label}>
              What kind of videos do you want ideas for?
            </label>
            <textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Tech reviews for budget smartphones, cooking tutorials for college students, fitness tips for busy professionals..."
              className={s.textarea}
              disabled={loading || loadingMore}
              rows={3}
              aria-describedby="topic-hint"
            />
            <p id="topic-hint" className={s.fieldHint}>
              Be specific about your niche, audience, or content style for better ideas
            </p>
          </div>

          {/* Controls Row: Toggle + Button */}
          <div className={s.controlsRow}>
            {/* Shorts Toggle */}
            <label className={s.toggleLabel}>
              <span className={s.toggleText}>Shorts only</span>
              <button
                type="button"
                role="switch"
                aria-checked={formatPreference === "shorts"}
                className={`${s.toggle} ${formatPreference === "shorts" ? s.toggleActive : ""}`}
                onClick={toggleShorts}
                disabled={loading || loadingMore}
              >
                <span className={s.toggleThumb} />
              </button>
            </label>

            {/* Generate Button */}
            <div className={s.actionGroup}>
              {!isAuthenticated && !isAuthLoading && (
                <p className={s.signInHint}>
                  <Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`} className={s.signInLink}>
                    Sign in
                  </Link>
                  {" "}to generate
                </p>
              )}
              <button
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={loading || loadingMore || isAuthLoading || (hasReachedLimit && isAuthenticated)}
                className={s.generateBtn}
              >
                {loading ? (
                  <>
                    <span className={s.spinner} aria-hidden="true" />
                    Analyzing keywords...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Generate Ideas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className={s.errorState}>
          <svg className={s.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 className={s.errorTitle}>Something went wrong</h3>
          <p className={s.errorText}>{error}</p>
          <button type="button" onClick={handleRetry} className={s.retryBtn}>
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={s.loadingState}>
          <div className={s.loadingSpinner} />
          <p className={s.loadingText}>Analyzing keyword data and generating ideas...</p>
          <p className={s.loadingSubtext}>This may take a few seconds</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && ideas.length > 0 && (
        <section className={s.resultsSection}>
          <div className={s.resultsHeader}>
            <h3 className={s.resultsTitle}>Your Video Ideas</h3>
            <span className={s.resultsCount}>{ideas.length} ideas</span>
          </div>

          <div className={s.ideaGrid}>
            {ideas.map((idea) => (
              <article key={idea.id} className={s.ideaCard}>
                <div className={s.ideaCardHeader}>
                  <span className={`${s.formatBadge} ${idea.format === "shorts" ? s.formatBadgeShorts : ""}`}>
                    {idea.format === "shorts" ? "Short" : "Long-form"}
                  </span>
                  {idea.targetKeyword && (
                    <span className={s.keywordBadge} title="Target keyword">
                      {idea.targetKeyword}
                    </span>
                  )}
                </div>
                <h4 className={s.ideaCardTitle}>{idea.title}</h4>
                {idea.hook && (
                  <p className={s.ideaCardHook}>&ldquo;{idea.hook}&rdquo;</p>
                )}
                {idea.whyItWins && (
                  <p className={s.ideaCardWhy}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {idea.whyItWins}
                  </p>
                )}
                {idea.outline && idea.outline.length > 0 && (
                  <details className={s.outlineDetails}>
                    <summary className={s.outlineSummary}>
                      View outline ({idea.outline.length} points)
                    </summary>
                    <ul className={s.outlineList}>
                      {idea.outline.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </article>
            ))}
          </div>

          {/* Generate More Button */}
          {isAuthenticated && !hasReachedLimit && (
            <div className={s.generateMoreArea}>
              <button
                type="button"
                onClick={handleGenerateMore}
                disabled={loadingMore || loading}
                className={s.generateMoreBtn}
              >
                {loadingMore ? (
                  <>
                    <span className={s.spinner} aria-hidden="true" />
                    Generating more...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Generate More Ideas
                  </>
                )}
              </button>
              {usageInfo && usageInfo.remaining > 0 && (
                <span className={s.usageHint}>
                  {usageInfo.remaining} generation{usageInfo.remaining !== 1 ? "s" : ""} remaining today
                </span>
              )}
            </div>
          )}

          {/* Upgrade Banner */}
          {isAuthenticated && hasGenerated && isFreePlan && hasReachedLimit && (
            <div className={s.upgradeBanner}>
              <div className={s.upgradeBannerContent}>
                <h3>You&apos;ve used your daily free generations</h3>
                <p>Upgrade to Pro for 200 generations per day, plus channel analysis and more.</p>
              </div>
              <a href="/api/integrations/stripe/checkout" className={s.upgradeBtn}>
                Upgrade to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/{SUBSCRIPTION.PRO_INTERVAL}
              </a>
            </div>
          )}
        </section>
      )}

      {/* FAQ - More prominent, useful for both users and SEO */}
      <section className={s.faqSection}>
        <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
        <div className={s.faqList}>
          <details className={s.faqItem}>
            <summary>
              <span>How does the keyword-backed idea generation work?</span>
              <svg className={s.faqChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <p className={s.faqAnswer}>
              Our generator analyzes real search data to find topics with high demand and low competition. We first identify
              relevant keywords in your niche, then generate video ideas specifically targeting those opportunities. Each idea
              shows why it has potential based on actual keyword metrics.
            </p>
          </details>

          <details className={s.faqItem}>
            <summary>
              <span>What makes a good YouTube video idea?</span>
              <svg className={s.faqChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <p className={s.faqAnswer}>
              A good YouTube video idea has three elements: proven demand (people are searching for it), a clear hook
              (why someone would click), and a unique angle (what makes your take different). The best ideas also match
              your channel&apos;s style and your ability to deliver quality content on that topic.
            </p>
          </details>

          <details className={s.faqItem}>
            <summary>
              <span>Should I make YouTube Shorts or long-form videos?</span>
              <svg className={s.faqChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <p className={s.faqAnswer}>
              Both formats have value. Shorts are great for growing reach and testing ideas quickly—they require less
              production time and can go viral more easily. Long-form videos build deeper engagement and typically
              generate more revenue. Many successful creators use Shorts to attract new viewers and long-form to convert
              them into loyal subscribers.
            </p>
          </details>

          <details className={s.faqItem}>
            <summary>
              <span>How often should I post new videos?</span>
              <svg className={s.faqChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <p className={s.faqAnswer}>
              Consistency matters more than frequency. Choose a schedule you can maintain—whether that&apos;s once a week
              or three times a week—and stick to it. Quality should never suffer for quantity. Most successful channels
              post 1-3 times per week, but some niches support daily uploads while others thrive with less frequent,
              higher-production content.
            </p>
          </details>
        </div>
      </section>

      {/* Related Links */}
      <section className={s.relatedSection}>
        <h3 className={s.relatedTitle}>Related Resources</h3>
        <div className={s.relatedLinks}>
          <Link href="/keywords" className={s.relatedLink}>
            Keyword Research Tool
          </Link>
          <Link href="/learn/how-to-get-more-subscribers" className={s.relatedLink}>
            How to Get More Subscribers
          </Link>
          <Link href="/learn/youtube-competitor-analysis" className={s.relatedLink}>
            Competitor Analysis Guide
          </Link>
          <Link href="/tags/generator" className={s.relatedLink}>
            Tag Generator
          </Link>
        </div>
      </section>

      {/* SEO Content - Moved to bottom, compact */}
      <section className={s.seoSection}>
        <details className={s.seoDetails}>
          <summary className={s.seoSummary}>
            <h2 className={s.seoTitle}>About the Video Ideas Generator</h2>
            <svg className={s.seoChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div className={s.seoContent}>
            <p className={s.seoText}>
              Coming up with <strong>video ideas</strong> consistently is one of the biggest challenges YouTube creators face.
              Our Video Ideas Generator helps you break through creative blocks by analyzing real keyword data and
              suggesting data-backed ideas you might not have considered.
            </p>
            <p className={s.seoText}>
              Your video idea is the foundation of everything that follows—the title, thumbnail, script, and edit all flow from
              the core concept. We focus on finding topics with proven demand and lower competition, giving you a
              starting point you can make your own.
            </p>
            <p className={s.seoText}>
              <strong>YouTube Shorts</strong> are great for reach and testing ideas quickly.
              <strong> Long-form videos</strong> build deeper engagement and typically perform better for revenue.
              Our generator supports both formats so you can find ideas optimized for how you want to create.
            </p>
          </div>
        </details>
      </section>
    </div>
  );
}
