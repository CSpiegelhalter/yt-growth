"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import s from "./style.module.css";
import type { TrendingVideoAnalysis } from "@/types/api";
import { copyToClipboard } from "@/components/ui/Toast";

type Props = {
  videoId: string;
};

/**
 * TrendingDetailClient - Deep insights view for a trending video
 * Mobile-first layout with structured analysis
 */
export default function TrendingDetailClient({ videoId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<TrendingVideoAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("whyTrending");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const channelId = searchParams.get("channelId") || 
    (typeof window !== "undefined" ? localStorage.getItem("activeChannelId") : null);

  // Load video analysis
  useEffect(() => {
    async function loadAnalysis() {
      if (!channelId) {
        setError("No channel selected");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(
          `/api/me/trending/video/${videoId}?channelId=${channelId}`,
          { cache: "no-store" }
        );
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load analysis");
        }
        
        const data = await res.json();
        setAnalysis(data as TrendingVideoAnalysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    }
    
    loadAnalysis();
  }, [videoId, channelId]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  if (loading) {
    return (
      <main className={s.page}>
        <div className={s.loading}>
          <div className={s.spinner} />
          <p>Analyzing video...</p>
        </div>
      </main>
    );
  }

  if (error || !analysis) {
    return (
      <main className={s.page}>
        <div className={s.errorState}>
          <div className={s.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h2 className={s.errorTitle}>{error || "Video not found"}</h2>
          <p className={s.errorDesc}>We couldn't analyze this video.</p>
          <button onClick={() => router.back()} className={s.backBtn}>
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const { video, metrics, analysis: insights } = analysis;

  return (
    <main className={s.page}>
      {/* Back Link */}
      <Link href="/trending" className={s.backLink}>
        ← Back to Trending
      </Link>

      {/* Video Header */}
      <header className={s.videoHeader}>
        <div className={s.thumbnailWrap}>
          {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt="" className={s.thumbnail} />
          ) : (
            <div className={s.thumbnailPlaceholder}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className={s.videoInfo}>
          <h1 className={s.videoTitle}>{video.title}</h1>
          
          <a 
            href={video.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.channelLink}
          >
            {video.channelTitle}
          </a>
          
          <div className={s.metricRow}>
            <span className={s.metric}>
              <strong>{formatCompact(metrics.viewCount)}</strong> views
            </span>
            <span className={s.metricHighlight}>
              <strong>{formatCompact(metrics.viewsPerDay)}</strong>/day
            </span>
            {metrics.likeRate && (
              <span className={s.metric}>
                <strong>{metrics.likeRate.toFixed(1)}%</strong> likes
              </span>
            )}
            {metrics.commentRate && (
              <span className={s.metric}>
                <strong>{metrics.commentRate.toFixed(2)}%</strong> comments
              </span>
            )}
          </div>

          {/* Subscriber metrics note for competitor videos */}
          {!video.isUserVideo && (
            <p className={s.metricsNote}>
              Subscriber gain data is not publicly available for competitor videos. 
              Like and comment rates shown as engagement proxies.
            </p>
          )}
          
          <a
            href={video.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.watchBtn}
          >
            Watch on YouTube
          </a>
        </div>
      </header>

      {/* Analysis Sections */}
      <div className={s.sections}>
        {/* What It's About */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>What It's About</h2>
          <p className={s.aboutText}>{insights.whatItsAbout}</p>
        </section>

        {/* Why It's Trending */}
        <AccordionSection
          title="Why It's Trending"
          isOpen={expandedSection === "whyTrending"}
          onToggle={() => toggleSection("whyTrending")}
        >
          <ul className={s.bulletList}>
            {insights.whyTrending.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </AccordionSection>

        {/* What They Did Well */}
        <AccordionSection
          title="What They Did Well"
          isOpen={expandedSection === "whatTheyDidWell"}
          onToggle={() => toggleSection("whatTheyDidWell")}
        >
          <ul className={s.bulletList}>
            {insights.whatTheyDidWell.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </AccordionSection>

        {/* Themes to Remix */}
        <AccordionSection
          title="Themes You Can Remix"
          isOpen={expandedSection === "themes"}
          onToggle={() => toggleSection("themes")}
        >
          <div className={s.themesList}>
            {insights.themesToRemix.map((theme, i) => (
              <div key={i} className={s.themeCard}>
                <h4 className={s.themeTitle}>{theme.theme}</h4>
                <p className={s.themeWhy}>{theme.why}</p>
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* Patterns */}
        <AccordionSection
          title="Patterns to Learn"
          isOpen={expandedSection === "patterns"}
          onToggle={() => toggleSection("patterns")}
        >
          <div className={s.patternsGrid}>
            {insights.titlePatterns.length > 0 && (
              <div className={s.patternBlock}>
                <h4 className={s.patternBlockTitle}>Title Patterns</h4>
                <ul className={s.patternList}>
                  {insights.titlePatterns.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {insights.hookPatterns.length > 0 && (
              <div className={s.patternBlock}>
                <h4 className={s.patternBlockTitle}>Hook Patterns</h4>
                <ul className={s.patternList}>
                  {insights.hookPatterns.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {insights.thumbnailPatterns.length > 0 && (
              <div className={s.patternBlock}>
                <h4 className={s.patternBlockTitle}>Thumbnail Patterns</h4>
                <ul className={s.patternList}>
                  {insights.thumbnailPatterns.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Remix Ideas for You */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>Suggested Remixes for You</h2>
          <p className={s.sectionSubtitle}>Ideas inspired by this video, tailored for your channel</p>
          
          <div className={s.remixGrid}>
            {insights.remixIdeasForYou.map((remix, i) => (
              <div key={i} className={s.remixCard}>
                <h4 className={s.remixTitle}>{remix.title}</h4>
                <p className={s.remixAngle}>{remix.angle}</p>
                
                <div className={s.remixHook}>
                  <span className={s.hookLabel}>Hook:</span>
                  <span className={s.hookText}>"{remix.hook}"</span>
                </div>
                
                <div className={s.remixOverlay}>
                  <span className={s.overlayLabel}>Thumbnail Text:</span>
                  <span className={s.overlayText}>{remix.overlayText}</span>
                </div>
                
                <button
                  className={s.copyBtn}
                  onClick={() => handleCopy(
                    `Title: ${remix.title}\nHook: ${remix.hook}\nThumbnail: ${remix.overlayText}\nAngle: ${remix.angle}`,
                    `remix-${i}`
                  )}
                >
                  {copiedId === `remix-${i}` ? "Copied!" : "Copy Idea"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Tags/Metadata */}
        {(analysis.tags?.length || analysis.category) && (
          <AccordionSection
            title="Video Metadata"
            isOpen={expandedSection === "metadata"}
            onToggle={() => toggleSection("metadata")}
          >
            {analysis.category && (
              <div className={s.metadataItem}>
                <span className={s.metadataLabel}>Category:</span>
                <span className={s.metadataValue}>{analysis.category}</span>
              </div>
            )}
            
            {analysis.tags && analysis.tags.length > 0 && (
              <div className={s.metadataItem}>
                <span className={s.metadataLabel}>Tags:</span>
                <div className={s.tagsList}>
                  {analysis.tags.slice(0, 15).map((tag, i) => (
                    <span key={i} className={s.tag}>{tag}</span>
                  ))}
                  {analysis.tags.length > 15 && (
                    <span className={s.tagMore}>+{analysis.tags.length - 15} more</span>
                  )}
                </div>
              </div>
            )}
          </AccordionSection>
        )}
      </div>
    </main>
  );
}

/* ---------- Accordion Section ---------- */
function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={`${s.accordionSection} ${isOpen ? s.accordionOpen : ""}`}>
      <button className={s.accordionHeader} onClick={onToggle}>
        <h2 className={s.accordionTitle}>{title}</h2>
        <span className={s.accordionIcon}>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <div className={s.accordionContent}>{children}</div>}
    </section>
  );
}

/* ---------- Helpers ---------- */
function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

