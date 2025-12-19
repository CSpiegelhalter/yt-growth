"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import s from "./style.module.css";
import type { VideoWithRetention, ProofVideo } from "@/types/api";
import { formatReasonHuman } from "@/lib/retention-labels";

// Mock data for demo videos
const MOCK_VIDEO: VideoWithRetention = {
  id: 1,
  youtubeVideoId: "demo-vid-1",
  title: "How I Grew My Channel to 100K Subscribers in 6 Months",
  publishedAt: "2024-11-15T10:00:00Z",
  thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  retention: {
    hasData: true,
    cliffTimeSec: 45,
    cliffTimestamp: "0:45",
    cliffReason: "hook_end",
    cliffSlope: -0.08,
  },
};

const MOCK_COMPARABLE: ProofVideo[] = [
  {
    videoId: "similar-1",
    title: "I Quit My Job to Make YouTube Videos - Here's What Happened",
    channelId: "UCsimilar1",
    channelTitle: "Creator Stories",
    thumbnailUrl: "https://i.ytimg.com/vi/demo1/hqdefault.jpg",
    publishedAt: "2024-11-10T10:00:00Z",
    metrics: { views: 850000, viewsPerDay: 12500 },
    whyItWorked: ["Strong personal story hook", "Clear outcome promised in title"],
  },
  {
    videoId: "similar-2",
    title: "The Algorithm Secrets Big YouTubers Won't Tell You",
    channelId: "UCsimilar2",
    channelTitle: "Growth Tactics",
    thumbnailUrl: "https://i.ytimg.com/vi/demo2/hqdefault.jpg",
    publishedAt: "2024-11-12T10:00:00Z",
    metrics: { views: 1200000, viewsPerDay: 18000 },
    whyItWorked: ["Curiosity gap in title", "Exclusivity angle"],
  },
  {
    videoId: "similar-3",
    title: "50K to 500K Subscribers - My Exact Strategy",
    channelId: "UCsimilar3",
    channelTitle: "Scale Your Channel",
    thumbnailUrl: "https://i.ytimg.com/vi/demo3/hqdefault.jpg",
    publishedAt: "2024-11-08T10:00:00Z",
    metrics: { views: 650000, viewsPerDay: 9500 },
    whyItWorked: ["Specific numbers create credibility", "Promise of actionable strategy"],
  },
];

/**
 * VideoClient - Comprehensive video insights page
 * Shows drop-offs, comparable winners, and quick improvements
 * Falls back to mock data for demo purposes
 */
export default function VideoClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoId = params.videoId as string;
  const channelId = searchParams.get("channelId") || 
    (typeof window !== "undefined" ? localStorage.getItem("activeChannelId") : null);

  const [video, setVideo] = useState<VideoWithRetention | null>(null);
  const [comparableVideos, setComparableVideos] = useState<ProofVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Load video data from retention endpoint or use mock data
  useEffect(() => {
    async function loadVideo() {
      setLoading(true);
      
      // If no channel ID or video starts with "demo-", use mock data
      if (!channelId || videoId.startsWith("demo-")) {
        setVideo({
          ...MOCK_VIDEO,
          youtubeVideoId: videoId,
          title: decodeVideoTitle(videoId),
        });
        setComparableVideos(MOCK_COMPARABLE);
        setIsDemo(true);
        setLoading(false);
        return;
      }
      
      try {
        // Get video details from retention endpoint
        const res = await fetch(
          `/api/me/channels/${channelId}/retention`,
          { cache: "no-store" }
        );
        
        if (!res.ok) {
          // Fall back to mock data
          setVideo({
            ...MOCK_VIDEO,
            youtubeVideoId: videoId,
          });
          setComparableVideos(MOCK_COMPARABLE);
          setIsDemo(true);
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        
        // Find the specific video - try both videoId and youtubeVideoId
        const foundVideo = data.videos?.find(
          (v: VideoWithRetention & { videoId?: string }) => 
            v.youtubeVideoId === videoId || v.videoId === videoId
        );
        
        if (!foundVideo) {
          // Fall back to mock data
          setVideo({
            ...MOCK_VIDEO,
            youtubeVideoId: videoId,
          });
          setComparableVideos(MOCK_COMPARABLE);
          setIsDemo(true);
          setLoading(false);
          return;
        }
        
        setVideo(foundVideo);
        
        // Try to get comparable videos from similar channels
        try {
          const similarRes = await fetch(
            `/api/me/channels/${channelId}/similar?range=7d`,
            { cache: "no-store" }
          );
          if (similarRes.ok) {
            const similarData = await similarRes.json();
            // Flatten winners from similar channels
            const winners: ProofVideo[] = [];
            similarData.similarChannels?.forEach((sc: { recentWinners?: Array<{ videoId: string; title: string; publishedAt: string; thumbnailUrl: string | null; views: number; viewsPerDay: number }>; channelId: string; channelTitle: string }) => {
              sc.recentWinners?.forEach((w) => {
                winners.push({
                  videoId: w.videoId,
                  title: w.title,
                  channelId: sc.channelId,
                  channelTitle: sc.channelTitle,
                  thumbnailUrl: w.thumbnailUrl ?? "",
                  publishedAt: w.publishedAt,
                  metrics: {
                    views: w.views,
                    viewsPerDay: w.viewsPerDay,
                  },
                });
              });
            });
            setComparableVideos(winners.length > 0 ? winners.slice(0, 6) : MOCK_COMPARABLE);
          } else {
            setComparableVideos(MOCK_COMPARABLE);
          }
        } catch {
          setComparableVideos(MOCK_COMPARABLE);
        }
      } catch {
        // Fall back to mock data on any error
        setVideo({
          ...MOCK_VIDEO,
          youtubeVideoId: videoId,
        });
        setComparableVideos(MOCK_COMPARABLE);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    }
    loadVideo();
  }, [videoId, channelId]);

  if (loading) {
    return (
      <main className={s.page}>
        <div className={s.loading}>
          <div className={s.spinner} />
          <p>Loading video insights...</p>
        </div>
      </main>
    );
  }

  if (!video) {
    return (
      <main className={s.page}>
        <div className={s.errorState}>
          <div className={s.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h2 className={s.errorTitle}>Video not found</h2>
          <p className={s.errorDesc}>We couldn&apos;t find insights for this video.</p>
          <button onClick={() => router.back()} className={s.backBtn}>
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const reasonInfo = formatReasonHuman(video.retention?.cliffReason);
  const hasRetention = video.retention?.hasData && video.retention?.cliffTimestamp;

  return (
    <main className={s.page}>
      {/* Back Link */}
      <Link href="/dashboard" className={s.backLink}>
        ← Back to Videos
      </Link>

      {/* Demo Banner */}
      {isDemo && (
        <div className={s.demoBanner}>
          <span className={s.demoBadge}>Demo Data</span>
          <span>This is sample data. Connect your channel to see real insights.</span>
        </div>
      )}

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
          <a
            href={`https://youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={s.watchBtn}
          >
            Watch on YouTube
          </a>
        </div>
        <div className={s.videoMeta}>
          <h1 className={s.videoTitle}>{video.title ?? "Untitled Video"}</h1>
          <div className={s.metaRow}>
            {video.publishedAt && (
              <span className={s.metaItem}>
                Published {formatDate(video.publishedAt)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Content Sections */}
      <div className={s.sections}>
        {/* Section 1: Drop-offs */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>Where Viewers Left</h2>
          {hasRetention ? (
            <div className={s.dropOffCard}>
              <div className={s.dropOffHeader}>
                <span className={s.dropOffTime}>{video.retention.cliffTimestamp}</span>
                <SeverityBadge reason={video.retention.cliffReason} />
              </div>
              
              <div className={s.insightBlock}>
                <h3 className={s.insightLabel}>{reasonInfo.label}</h3>
                <p className={s.insightText}>{reasonInfo.description}</p>
              </div>

              <div className={s.insightBlock}>
                <h3 className={s.insightLabel}>Why It Matters</h3>
                <p className={s.insightText}>{reasonInfo.whyItMatters}</p>
              </div>

              <div className={s.insightBlock}>
                <h3 className={s.insightLabel}>What to Try</h3>
                <p className={s.insightText}>{reasonInfo.whatToDo}</p>
              </div>

              {!isDemo && (
                <a
                  href={`https://youtube.com/watch?v=${videoId}&t=${parseTimestamp(video.retention.cliffTimestamp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.watchAtBtn}
                >
                  Watch at drop-off point →
                </a>
              )}
            </div>
          ) : (
            <div className={s.emptyCard}>
              <p>No retention data available for this video yet.</p>
            </div>
          )}
        </section>

        {/* Section 2: Quick Improvements */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>Quick Improvements</h2>
          <div className={s.improvementsGrid}>
            <ImprovementCard
              title="Hook"
              tip={getHookTip(video.retention?.cliffTimestamp)}
            />
            <ImprovementCard
              title="Title"
              tip={getTitleTip(video.title)}
            />
            <ImprovementCard
              title="Thumbnail"
              tip="Ensure high contrast, readable text, and a clear focal point that matches your title's promise."
            />
          </div>
        </section>

        {/* Section 3: Comparable Winners */}
        {comparableVideos.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>What Winners Are Doing</h2>
            <p className={s.sectionSubtitle}>Similar videos from channels in your niche</p>
            <div className={s.comparableGrid}>
              {comparableVideos.slice(0, 6).map((cv) => (
                <ComparableCard key={cv.videoId} video={cv} isDemo={isDemo} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* ---------- Sub-components ---------- */

function SeverityBadge({ reason }: { reason: string | null | undefined }) {
  let severity = "Mild";
  let className = s.severityMild;
  
  if (reason === "steepest_drop") {
    severity = "Sharp";
    className = s.severitySharp;
  } else if (reason === "crossed_50") {
    severity = "Moderate";
    className = s.severityModerate;
  }

  return <span className={`${s.severityBadge} ${className}`}>{severity}</span>;
}

function ImprovementCard({ title, tip }: { title: string; tip: string }) {
  return (
    <div className={s.improvementCard}>
      <h4 className={s.improvementTitle}>{title}</h4>
      <p className={s.improvementTip}>{tip}</p>
    </div>
  );
}

function ComparableCard({ video, isDemo }: { video: ProofVideo; isDemo?: boolean }) {
  const href = isDemo ? "#" : `https://youtube.com/watch?v=${video.videoId}`;
  
  return (
    <a
      href={href}
      target={isDemo ? undefined : "_blank"}
      rel={isDemo ? undefined : "noopener noreferrer"}
      className={s.comparableCard}
      onClick={isDemo ? (e) => e.preventDefault() : undefined}
    >
      <div className={s.comparableThumbWrap}>
        <div className={s.comparableThumbPlaceholder}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <span className={s.comparableViews}>
          {formatCompact(video.metrics.viewsPerDay)}/day
        </span>
      </div>
      <h4 className={s.comparableTitle}>{truncate(video.title, 60)}</h4>
      <span className={s.comparableChannel}>{video.channelTitle}</span>
    </a>
  );
}

/* ---------- Helpers ---------- */

function decodeVideoTitle(videoId: string): string {
  // Generate a reasonable title from the video ID for demo purposes
  const cleanId = videoId.replace(/-/g, " ").replace(/demo|vid/gi, "").trim();
  if (!cleanId) return "How I Grew My Channel to 100K Subscribers";
  return `Demo Video: ${cleanId.charAt(0).toUpperCase() + cleanId.slice(1)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseTimestamp(timestamp: string | null | undefined): number {
  if (!timestamp) return 0;
  const parts = timestamp.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 3) + "...";
}

function getHookTip(timestamp: string | null | undefined): string {
  if (!timestamp) return "Start with your boldest claim or most surprising fact in the first 5 seconds.";
  const seconds = parseTimestamp(timestamp);
  if (seconds < 30) {
    return "Your hook needs work. Lead with immediate value - show the outcome, make a bold claim, or ask a provocative question.";
  }
  if (seconds < 60) {
    return "Your hook is okay but could be stronger. Consider front-loading a 'mini payoff' before diving into setup.";
  }
  return "Your hook held attention well. Focus on maintaining energy and adding pattern interrupts in the middle section.";
}

function getTitleTip(title: string | null | undefined): string {
  if (!title) return "Create a title that sparks curiosity and makes a clear promise.";
  if (title.length > 60) {
    return "Your title is long. YouTube truncates around 60 characters - front-load the key value.";
  }
  if (title.length < 30) {
    return "Consider adding specificity to your title - numbers, timeframes, or outcomes boost clicks.";
  }
  return "Good title length. Test variations with different emotional hooks (curiosity, fear of missing out, exclusivity).";
}
