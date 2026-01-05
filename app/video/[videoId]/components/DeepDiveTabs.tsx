"use client";

import { useState, useCallback, useEffect } from "react";
import s from "../style.module.css";
import { CopyButton, TagChip } from "./index";

type TabId = "seo" | "comments" | "ideas";

type Tab = {
  id: TabId;
  label: string;
  icon: string;
  description: string;
};

const TABS: Tab[] = [
  { id: "seo", label: "SEO Analysis", icon: "📊", description: "Title, description & tags" },
  { id: "comments", label: "Viewer Insights", icon: "💬", description: "What your audience says" },
  { id: "ideas", label: "Content Ideas", icon: "💡", description: "Spinoff opportunities" },
];

type DeepDiveData = {
  seo?: any;
  comments?: any;
  ideas?: any;
};

type DeepDiveError = {
  message: string;
  code?: string;
};

type Props = {
  channelId: string;
  videoId: string;
  range: string;
  videoTitle?: string;
};

export function DeepDiveTabs({ channelId, videoId, range, videoTitle }: Props) {
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [data, setData] = useState<DeepDiveData>({});
  const [loading, setLoading] = useState<TabId | null>(null);
  const [error, setError] = useState<DeepDiveError | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Check if we recently tried OAuth (prevent loop) - do this outside effect for immediate check
  const recentOAuthAttempt = typeof window !== "undefined" 
    ? (() => {
        const lastAttempt = sessionStorage.getItem("lastOAuthAttempt");
        return lastAttempt && Date.now() - parseInt(lastAttempt) < 60000;
      })()
    : false;

  // Auto-redirect to Google OAuth for permission errors
  useEffect(() => {
    if (error?.code !== "youtube_permissions" || redirecting || recentOAuthAttempt) return;

    // Store OAuth attempt timestamp and redirect immediately
    sessionStorage.setItem("lastOAuthAttempt", Date.now().toString());
    setRedirecting(true);

    const reconnectUrl = `/api/integrations/google/start?channelId=${encodeURIComponent(channelId)}`;
    
    // Redirect immediately - no delay
    window.location.href = reconnectUrl;
  }, [error, channelId, redirecting, recentOAuthAttempt]);

  const handleTabClick = useCallback(async (tabId: TabId) => {
    // If clicking the same tab, collapse it
    if (activeTab === tabId) {
      setActiveTab(null);
      return;
    }

    setActiveTab(tabId);
    setError(null);

    // If we already have data, don't refetch
    if (data[tabId]) {
      return;
    }

    setLoading(tabId);
    try {
      const res = await fetch(
        `/api/me/channels/${channelId}/videos/${videoId}/insights/${tabId}?range=${range}`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        
        // Handle unified error format: { error: { code, message, requestId }, details: { code, ... } }
        // or legacy format: { error: "string", code: "string" }
        const errorObj = errData.error;
        const unifiedCode = typeof errorObj === "object" ? errorObj?.code : null;
        // Check details.code for the original error code (middleware puts it there)
        const detailsCode = errData.details?.code;
        const legacyCode = errData.code;
        const errorCode = detailsCode || legacyCode || unifiedCode;
        const errorMessage = typeof errorObj === "object" 
          ? errorObj?.message 
          : (typeof errorObj === "string" ? errorObj : "Failed to load");
        
        // Match youtube_permissions regardless of case
        const isYouTubePermissionError = 
          errorCode === "youtube_permissions" || 
          errorCode === "YOUTUBE_PERMISSIONS" ||
          (typeof errorMessage === "string" && errorMessage.toLowerCase().includes("google access"));
        
        if (isYouTubePermissionError) {
          // Check if we should auto-redirect (not a recent OAuth attempt)
          const lastAttempt = sessionStorage.getItem("lastOAuthAttempt");
          const isRecentAttempt = lastAttempt && Date.now() - parseInt(lastAttempt) < 60000;
          
          if (!isRecentAttempt) {
            // Auto-redirect immediately
            sessionStorage.setItem("lastOAuthAttempt", Date.now().toString());
            // Store where to return after OAuth completes
            sessionStorage.setItem("oauthReturnTo", window.location.href);
            setRedirecting(true);
            window.location.href = `/api/integrations/google/start?channelId=${encodeURIComponent(channelId)}`;
            return;
          }
          setError({ message: errorMessage, code: "youtube_permissions" });
        } else {
          setError({ message: errorMessage });
        }
        return;
      }
      const result = await res.json();
      setData((prev) => ({ ...prev, [tabId]: result }));
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Failed to load" });
    } finally {
      setLoading(null);
    }
  }, [activeTab, channelId, videoId, range, data]);

  return (
    <section className={s.deepDives}>
      <h2 className={s.sectionTitle}>Go Deeper</h2>
      <p className={s.sectionDesc}>Click to load detailed analysis</p>

      {/* Tab Buttons */}
      <div className={s.tabButtons}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${s.tabBtn} ${activeTab === tab.id ? s.tabBtnActive : ""}`}
            onClick={() => handleTabClick(tab.id)}
            disabled={loading !== null}
          >
            <span className={s.tabIcon}>{tab.icon}</span>
            <span className={s.tabLabel}>{tab.label}</span>
            <span className={s.tabDesc}>{tab.description}</span>
            {loading === tab.id && <span className={s.tabSpinner} />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab && (
        <div className={s.tabContent}>
          {error ? (
            <div className={s.tabError}>
              {error.code === "youtube_permissions" ? (
                // This only shows if auto-redirect failed (recent OAuth attempt)
                <>
                  <p>🔐 Google connection issue</p>
                  <p className={s.tabErrorSub}>
                    We tried to refresh your connection but it didn&apos;t work. 
                    Please try connecting with the Google account that owns this YouTube channel.
                  </p>
                  <a
                    href={`/api/integrations/google/start?channelId=${encodeURIComponent(channelId)}`}
                    className={s.reconnectBtn}
                  >
                    Connect Google Account
                  </a>
                </>
              ) : (
                <>
                  <p>{error.message}</p>
                  <button onClick={() => handleTabClick(activeTab)}>Try again</button>
                </>
              )}
            </div>
          ) : loading === activeTab ? (
            <DeepDiveLoading />
          ) : data[activeTab] ? (
            <DeepDiveContent
              type={activeTab}
              data={data[activeTab]}
              videoTitle={videoTitle}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}

function DeepDiveLoading() {
  return (
    <div className={s.tabLoading}>
      <div className={s.spinnerSmall} />
      <p>Generating analysis...</p>
    </div>
  );
}

type ContentProps = {
  type: TabId;
  data: any;
  videoTitle?: string;
};

function DeepDiveContent({ type, data, videoTitle }: ContentProps) {
  switch (type) {
    case "seo":
      return <SeoContent data={data.seo} videoTitle={videoTitle} />;
    case "comments":
      return <CommentsContent data={data.comments} />;
    case "ideas":
      return <IdeasContent data={data.ideas} />;
    default:
      return null;
  }
}

function SeoContent({ data, videoTitle }: { data: any; videoTitle?: string }) {
  if (!data) return null;

  const getScoreClass = (score: number) => {
    if (score >= 8) return s.scoreGreen;
    if (score >= 5) return s.scoreYellow;
    return s.scoreRed;
  };

  return (
    <div className={s.seoContent}>
      {/* Title Analysis */}
      {data.titleAnalysis && (
        <div className={s.packagingCard}>
          <div className={s.packagingHeader}>
            <span className={s.packagingLabel}>Title</span>
            <span className={`${s.packagingScore} ${getScoreClass(data.titleAnalysis.score)}`}>
              {data.titleAnalysis.score}/10
            </span>
          </div>
          {videoTitle && <p className={s.currentValue}>&quot;{videoTitle}&quot;</p>}

          {data.titleAnalysis.strengths?.length > 0 && (
            <div className={s.feedbackGroup}>
              <span className={s.feedbackLabel}>✓ Strengths</span>
              <ul>
                {data.titleAnalysis.strengths.map((str: string, i: number) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>
          )}

          {data.titleAnalysis.weaknesses?.length > 0 && (
            <div className={s.feedbackGroup}>
              <span className={s.feedbackLabelWarn}>✗ Could Improve</span>
              <ul>
                {data.titleAnalysis.weaknesses.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {data.titleAnalysis.suggestions?.length > 0 && (
            <div className={s.suggestions}>
              <span className={s.feedbackLabelAlt}>💡 Try Instead</span>
              {data.titleAnalysis.suggestions.map((sug: string, i: number) => (
                <div key={i} className={s.suggestionRow}>
                  <span>{sug}</span>
                  <CopyButton text={sug} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description Analysis */}
      {data.descriptionAnalysis && (
        <div className={s.packagingCard}>
          <div className={s.packagingHeader}>
            <span className={s.packagingLabel}>Description</span>
            <span className={`${s.packagingScore} ${getScoreClass(data.descriptionAnalysis.score)}`}>
              {data.descriptionAnalysis.score}/10
            </span>
          </div>

          {data.descriptionAnalysis.weaknesses?.length > 0 && (
            <p className={s.tagFeedback}>{data.descriptionAnalysis.weaknesses[0]}</p>
          )}

          {data.descriptionAnalysis.rewrittenOpening && (
            <div className={s.suggestions}>
              <span className={s.feedbackLabelAlt}>Stronger opening</span>
              <div className={s.suggestionRow}>
                <span>{data.descriptionAnalysis.rewrittenOpening}</span>
                <CopyButton text={data.descriptionAnalysis.rewrittenOpening} />
              </div>
            </div>
          )}

          {data.descriptionAnalysis.addTheseLines?.length > 0 && (
            <div className={s.suggestions} style={{ marginTop: 12 }}>
              <span className={s.feedbackLabelAlt}>Add these lines</span>
              {data.descriptionAnalysis.addTheseLines
                .filter(Boolean)
                .slice(0, 5)
                .map((line: string, i: number) => (
                  <div key={i} className={s.suggestionRow}>
                    <span>{line}</span>
                    <CopyButton text={line} />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Tag Analysis */}
      {data.tagAnalysis && (
        <div className={s.packagingCard}>
          <div className={s.packagingHeader}>
            <span className={s.packagingLabel}>
              Tags
              {data.tagAnalysis.impactLevel === "low" && (
                <span className={s.lowImpactBadge}>Low Impact</span>
              )}
            </span>
            {data.tagAnalysis.impactLevel !== "low" && (
              <span className={`${s.packagingScore} ${getScoreClass(data.tagAnalysis.score)}`}>
                {data.tagAnalysis.score}/10
              </span>
            )}
          </div>

          <p className={s.tagFeedback}>{data.tagAnalysis.feedback}</p>

          {data.tagAnalysis.missing?.length > 0 && (
            <div className={s.missingTagsSection}>
              <div className={s.missingTagsHeader}>
                <span className={s.feedbackLabelAlt}>Copy-paste SEO tags</span>
                <CopyButton text={data.tagAnalysis.missing.join(", ")} label="Copy all" />
              </div>
              <div className={s.tagChips}>
                {data.tagAnalysis.missing.slice(0, 20).map((tag: string) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommentsContent({ data }: { data: any }) {
  if (!data) return null;

  if (data.noComments) {
    return (
      <div className={s.emptyState}>
        <p>No comments available for this video yet.</p>
      </div>
    );
  }

  return (
    <div className={s.commentsContent}>
      {/* Sentiment Bar */}
      {data.sentiment && (
        <div className={s.voiceCard}>
          <h4 className={s.voiceCardTitle}>Sentiment</h4>
          <div className={s.sentimentBar}>
            <div
              className={s.sentimentPos}
              style={{ width: `${data.sentiment.positive}%` }}
            />
            <div
              className={s.sentimentNeutral}
              style={{ width: `${data.sentiment.neutral}%` }}
            />
            <div
              className={s.sentimentNeg}
              style={{ width: `${data.sentiment.negative}%` }}
            />
          </div>
          <div className={s.sentimentLabels}>
            <span>👍 {data.sentiment.positive}%</span>
            <span>😐 {data.sentiment.neutral}%</span>
            <span>👎 {data.sentiment.negative}%</span>
          </div>
        </div>
      )}

      {/* Themes */}
      {data.themes?.length > 0 && (
        <div className={s.voiceCard}>
          <h4 className={s.voiceCardTitle}>Common Themes</h4>
          <div className={s.themeChips}>
            {data.themes.map((theme: any, i: number) => (
              <span key={i} className={s.themeChip}>
                {theme.theme}
                <span className={s.themeCount}>×{theme.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* What Viewers Loved */}
      {data.viewerLoved?.length > 0 && (
        <div className={s.voiceCard}>
          <h4 className={s.voiceCardTitle}>What Viewers Loved</h4>
          <ul className={s.voiceCardList}>
            {data.viewerLoved.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* What Viewers Asked For */}
      {data.viewerAskedFor?.length > 0 && (
        <div className={s.voiceCard}>
          <h4 className={s.voiceCardTitle}>Future Content Requests</h4>
          <ul className={s.voiceCardList}>
            {data.viewerAskedFor.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Hook Inspiration */}
      {data.hookInspiration?.length > 0 && (
        <div className={s.voiceCard}>
          <h4 className={s.voiceCardTitle}>Hook-Worthy Quotes</h4>
          <ul className={s.voiceCardList}>
            {data.hookInspiration.map((item: string, i: number) => (
              <li key={i} className={s.hookQuote}>&quot;{item}&quot;</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function IdeasContent({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className={s.ideasContent}>
      {/* Remix Ideas */}
      {data.remixIdeas?.length > 0 && (
        <div className={s.remixGrid}>
          {data.remixIdeas.map((idea: any, i: number) => (
            <div key={i} className={s.remixCard}>
              <h4 className={s.remixTitle}>{idea.title}</h4>
              <p className={s.remixHook}>{idea.hook}</p>
              <p className={s.remixAngle}>{idea.angle}</p>
              <div className={s.remixKeywords}>
                {idea.keywords?.slice(0, 3).map((kw: string) => (
                  <span key={kw} className={s.keywordChip}>{kw}</span>
                ))}
              </div>
              <div className={s.remixActions}>
                <CopyButton text={idea.title} label="Copy title" />
                <CopyButton text={idea.hook} label="Copy hook" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Gaps */}
      {data.contentGaps?.length > 0 && (
        <div className={s.contentGaps}>
          <h4>Content Gaps to Fill</h4>
          <ul>
            {data.contentGaps.map((gap: string, i: number) => (
              <li key={i}>{gap}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DeepDiveTabs;
