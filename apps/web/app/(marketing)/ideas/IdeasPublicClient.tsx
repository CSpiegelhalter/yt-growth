"use client";

import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useMemo,useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { useToast } from "@/components/ui/Toast";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import { formatUsd,SUBSCRIPTION } from "@/lib/shared/product";

import s from "./ideas.module.css";

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
// HELPERS
// ============================================

function redirectToLogin(pathname: string, router: ReturnType<typeof useRouter>) {
  const returnUrl = encodeURIComponent(pathname);
  router.push(`/auth/login?redirect=${returnUrl}`);
}

function mergeNewIdeas(existing: VideoIdea[], incoming: VideoIdea[]): VideoIdea[] {
  const existingTitles = new Set(existing.map((i) => i.title.toLowerCase()));
  return incoming.filter((i) => !existingTitles.has(i.title.toLowerCase()));
}

function toUsageInfo(usage: NonNullable<GenerateResponse["usage"]>): UsageInfo {
  return {
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    resetAt: usage.resetAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

function handleGenerateError(
  error: unknown,
  pathname: string,
  router: ReturnType<typeof useRouter>,
  setError: (msg: string) => void,
) {
  console.error("Generate error:", error);

  if (isApiClientError(error)) {
    if (error.status === 401) {
      redirectToLogin(pathname, router);
      return;
    }
    setError(error.message || "Failed to generate ideas");
    return;
  }

  setError("Failed to generate ideas. Please try again.");
}

// ============================================
// SUB-COMPONENTS
// ============================================

function IdeaCard({ idea }: { idea: VideoIdea }) {
  return (
    <article className={s.ideaCard}>
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
  );
}

function IdeasForm({
  topic, setTopic, formatPreference, loading, loadingMore,
  isAuthenticated, isAuthLoading, hasReachedLimit, pathname,
  onToggleShorts, onGenerate,
}: {
  topic: string;
  setTopic: (v: string) => void;
  formatPreference: string;
  loading: boolean;
  loadingMore: boolean;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  hasReachedLimit: boolean;
  pathname: string;
  onToggleShorts: () => void;
  onGenerate: () => void;
}) {
  const isBusy = loading || loadingMore;
  const isDisabled = isBusy || isAuthLoading || (hasReachedLimit && isAuthenticated);

  return (
    <section className={s.toolCard}>
      <div className={s.formSection}>
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
            disabled={isBusy}
            rows={3}
            aria-describedby="topic-hint"
          />
          <p id="topic-hint" className={s.fieldHint}>
            Be specific about your niche, audience, or content style for better ideas
          </p>
        </div>
        <div className={s.controlsRow}>
          <div className={s.toggleLabel}>
            <span id="shorts-toggle-label" className={s.toggleText}>Shorts only</span>
            <button
              type="button"
              role="switch"
              aria-checked={formatPreference === "shorts"}
              aria-labelledby="shorts-toggle-label"
              className={`${s.toggle} ${formatPreference === "shorts" ? s.toggleActive : ""}`}
              onClick={onToggleShorts}
              disabled={isBusy}
            >
              <span className={s.toggleThumb} />
            </button>
          </div>
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
              onClick={onGenerate}
              disabled={isDisabled}
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
  );
}

function IdeasResults({
  ideas, isAuthenticated, hasReachedLimit, hasGenerated, isFreePlan,
  loadingMore, loading, usageInfo, onGenerateMore,
}: {
  ideas: VideoIdea[];
  isAuthenticated: boolean;
  hasReachedLimit: boolean;
  hasGenerated: boolean;
  isFreePlan: boolean;
  loadingMore: boolean;
  loading: boolean;
  usageInfo: UsageInfo | null;
  onGenerateMore: () => void;
}) {
  const showGenerateMore = isAuthenticated && !hasReachedLimit;
  const showUpgradeBanner = isAuthenticated && hasGenerated && isFreePlan && hasReachedLimit;

  return (
    <section className={s.resultsSection}>
      <div className={s.resultsHeader}>
        <h3 className={s.resultsTitle}>Your Video Ideas</h3>
        <span className={s.resultsCount}>{ideas.length} ideas</span>
      </div>
      <div className={s.ideaGrid}>
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
      {showGenerateMore && (
        <div className={s.generateMoreArea}>
          <button
            type="button"
            onClick={onGenerateMore}
            disabled={loadingMore || loading}
            className={s.generateMoreBtn}
          >
            {loadingMore ? (
              <><span className={s.spinner} aria-hidden="true" />Generating more...</>
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
      {showUpgradeBanner && (
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
  );
}

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

  const hasReachedLimit = useMemo(() => {
    if (!usageInfo) {return false;}
    return usageInfo.remaining <= 0;
  }, [usageInfo]);

  const isFreePlan = useMemo(() => {
    if (!usageInfo) {return true;}
    return usageInfo.limit <= FREE_PLAN_LIMIT;
  }, [usageInfo]);

  const toggleShorts = useCallback(() => {
    setFormatPreference((prev) => (prev === "shorts" ? "mixed" : "shorts"));
  }, []);

  const handleGenerate = useCallback(async (isMore = false) => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic || trimmedTopic.length < 3) {
      setError("Please describe what kind of videos you want ideas for (at least 3 characters)");
      return;
    }

    setError(null);
    if (isMore) { setLoadingMore(true); } else { setLoading(true); }

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

      if (response.needsAuth) {
        redirectToLogin(pathname, router);
        return;
      }

      if (response.needsUpgrade) {
        setUsageInfo({ used: 0, limit: 0, remaining: 0, resetAt: "" });
        setError("You've reached your daily limit. Upgrade for more generations.");
        return;
      }

      if (isMore) {
        const newIdeas = mergeNewIdeas(ideas, response.ideas);
        setIdeas((prev) => [...prev, ...newIdeas]);
        toast(`Generated ${newIdeas.length} more video ideas!`, "success");
      } else {
        setIdeas(response.ideas);
        setHasGenerated(true);
        toast(`Generated ${response.ideas.length} video ideas backed by keyword data!`, "success");
      }

      if (response.usage) {
        setUsageInfo(toUsageInfo(response.usage));
      }
    } catch (error_) {
      handleGenerateError(error_, pathname, router, setError);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pathname, router, topic, formatPreference, ideas, toast]);

  // Generate more ideas
  const handleGenerateMore = useCallback(() => {
    void handleGenerate(true);
  }, [handleGenerate]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    void handleGenerate(false);
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

      <IdeasForm
        topic={topic}
        setTopic={setTopic}
        formatPreference={formatPreference}
        loading={loading}
        loadingMore={loadingMore}
        isAuthenticated={isAuthenticated}
        isAuthLoading={isAuthLoading}
        hasReachedLimit={hasReachedLimit}
        pathname={pathname}
        onToggleShorts={toggleShorts}
        onGenerate={() => handleGenerate(false)}
      />

      {/* Error State */}
      {error && (
        <ErrorState
          title="Something went wrong"
          description={error}
          actions={
            <button type="button" onClick={handleRetry} className={s.retryBtn}>
              Try again
            </button>
          }
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className={s.loadingState}>
          <div className={s.loadingSpinner} />
          <p className={s.loadingText}>Analyzing keyword data and generating ideas...</p>
          <p className={s.loadingSubtext}>This may take a few seconds</p>
        </div>
      )}

      {!loading && !error && ideas.length > 0 && (
        <IdeasResults
          ideas={ideas}
          isAuthenticated={isAuthenticated}
          hasReachedLimit={hasReachedLimit}
          hasGenerated={hasGenerated}
          isFreePlan={isFreePlan}
          loadingMore={loadingMore}
          loading={loading}
          usageInfo={usageInfo}
          onGenerateMore={handleGenerateMore}
        />
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
          <Link href="/tags" className={s.relatedLink}>
            Tag Finder
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
