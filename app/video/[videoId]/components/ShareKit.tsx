"use client";

import { useState, useMemo } from "react";
import s from "../style.module.css";
import { CopyButton } from "./CopyButton";
import type { PromoPack } from "@/types/api";
import {
  sanitizeUtmParam,
  validateUtmParam,
  normalizeUtmMedium,
  generateDefaultCampaign,
  UTM_MEDIUM_OPTIONS,
} from "@/lib/utm-sanitizer";

type ShareKitProps = {
  videoId: string;
  videoTitle: string;
  promoPack?: PromoPack | null;
};

type PromoLength = "short" | "long";

/**
 * ShareKit - Premium "Promote It Now" features
 * Includes copy-paste promo copy, prefilled share links, UTM builder
 */
export function ShareKit({ videoId, videoTitle, promoPack }: ShareKitProps) {
  const defaultCampaign = useMemo(
    () => generateDefaultCampaign(videoTitle),
    [videoTitle]
  );

  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState<string>("social");
  const [utmCampaign, setUtmCampaign] = useState(defaultCampaign);
  const [copied, setCopied] = useState<string | null>(null);
  const [promoLength, setPromoLength] = useState<PromoLength>("short");

  const videoUrl = `https://youtu.be/${videoId}`;

  // Validate inputs
  const sourceError = validateUtmParam(utmSource);
  const campaignError = validateUtmParam(utmCampaign);

  // Generate UTM link with sanitized values
  const utmLink = useMemo(() => {
    const params = new URLSearchParams();
    if (utmSource) {
      params.set("utm_source", sanitizeUtmParam(utmSource));
    }
    if (utmMedium) {
      const normalizedMedium = normalizeUtmMedium(utmMedium);
      params.set("utm_medium", sanitizeUtmParam(normalizedMedium));
    }
    if (utmCampaign) {
      params.set("utm_campaign", sanitizeUtmParam(utmCampaign));
    }
    const queryString = params.toString();
    return queryString ? `${videoUrl}?${queryString}` : videoUrl;
  }, [videoUrl, utmSource, utmMedium, utmCampaign]);

  // Use UTM link for share intents if available
  const shareUrl = utmSource || utmCampaign !== defaultCampaign ? utmLink : videoUrl;
  const encodedUrl = encodeURIComponent(shareUrl);

  // Use promo pack text when available, otherwise fall back to video title
  const twitterText = promoPack?.xPost || videoTitle;
  const redditTitle = promoPack?.redditPostTitle || videoTitle;
  const emailSubject = videoTitle;
  const emailBody = promoPack?.discordMessage || `Check out this video: ${shareUrl}`;
  // Note: LinkedIn doesn't support pre-filled text in share URLs (uses OG metadata)

  // Prefilled share links using promo pack text
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodedUrl}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(redditTitle)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`,
  };

  const handleCopyAll = async () => {
    if (!promoPack) return;
    const allText = [
      `X/Twitter:\n${promoPack.xPost}`,
      `\nReddit Title: ${promoPack.redditPostTitle}`,
      `Reddit Body:\n${promoPack.redditPostBody}`,
      promoPack.linkedinPost ? `\nLinkedIn:\n${promoPack.linkedinPost}` : "",
      `\nDiscord:\n${promoPack.discordMessage}`,
      `\nYouTube Community:\n${promoPack.youtubeCommunityPost}`,
    ]
      .filter(Boolean)
      .join("\n");

    await navigator.clipboard.writeText(allText);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadTxt = () => {
    if (!promoPack) return;
    const content = [
      `Promotion Copy for: ${videoTitle}`,
      `Video URL: ${shareUrl}`,
      `\n${"=".repeat(50)}\n`,
      `X/TWITTER (280 chars):\n${promoPack.xPost}\n`,
      `REDDIT TITLE:\n${promoPack.redditPostTitle}\n`,
      `REDDIT BODY:\n${promoPack.redditPostBody}\n`,
      promoPack.linkedinPost
        ? `LINKEDIN:\n${promoPack.linkedinPost}\n`
        : "",
      `DISCORD:\n${promoPack.discordMessage}\n`,
      `YOUTUBE COMMUNITY:\n${promoPack.youtubeCommunityPost}\n`,
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promo-${videoId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setUtmSource("");
    setUtmMedium("social");
    setUtmCampaign(defaultCampaign);
  };

  // Generate short variants of promo copy
  const getShortVariant = (text: string, maxLength = 100): string => {
    if (text.length <= maxLength) return text;
    const shortened = text.slice(0, maxLength - 3).trim();
    const lastSpace = shortened.lastIndexOf(" ");
    return lastSpace > maxLength * 0.6 
      ? shortened.slice(0, lastSpace) + "..."
      : shortened + "...";
  };

  return (
    <section className={s.shareKit}>
      <h2 className={s.sectionTitle}>Share Kit</h2>
      <p className={s.sectionDesc}>
        Ready-to-use promotion copy and share links
      </p>

      {/* Promo Pack */}
      {promoPack && (
        <div className={s.promoPackSection}>
          <div className={s.promoPackHeader}>
            <h3 className={s.promoPackTitle}>Promotion Copy</h3>
            <div className={s.promoPackActions}>
              <div className={s.promoLengthToggle}>
                <button
                  className={`${s.promoLengthBtn} ${promoLength === "short" ? s.active : ""}`}
                  onClick={() => setPromoLength("short")}
                >
                  Short
                </button>
                <button
                  className={`${s.promoLengthBtn} ${promoLength === "long" ? s.active : ""}`}
                  onClick={() => setPromoLength("long")}
                >
                  Full
                </button>
              </div>
              <button
                className={s.promoPackBtn}
                onClick={handleCopyAll}
                aria-label="Copy all promo text"
              >
                {copied === "all" ? "✓ Copied" : "Copy All"}
              </button>
              <button
                className={s.promoPackBtn}
                onClick={handleDownloadTxt}
                aria-label="Download promo text file"
              >
                Download .txt
              </button>
            </div>
          </div>

          <p className={s.generatedBadge}>
            <span className={s.badgeIcon}>✨</span> Generated — customize before posting
          </p>

          <div className={s.promoPackGrid}>
            <PromoItem
              platform="X/Twitter"
              text={promoLength === "short" ? getShortVariant(promoPack.xPost, 140) : promoPack.xPost}
              charLimit={280}
            />
            <PromoItem
              platform="Reddit Title"
              text={promoPack.redditPostTitle}
            />
            <PromoItem 
              platform="Reddit Body" 
              text={promoLength === "short" ? getShortVariant(promoPack.redditPostBody, 150) : promoPack.redditPostBody} 
            />
            {promoPack.linkedinPost && (
              <PromoItem 
                platform="LinkedIn" 
                text={promoLength === "short" ? getShortVariant(promoPack.linkedinPost, 150) : promoPack.linkedinPost} 
              />
            )}
            <PromoItem 
              platform="Discord" 
              text={promoLength === "short" ? getShortVariant(promoPack.discordMessage, 100) : promoPack.discordMessage} 
            />
            <PromoItem
              platform="YouTube Community"
              text={promoPack.youtubeCommunityPost}
            />
          </div>
        </div>
      )}

      {/* Prefilled Share Links */}
      <div className={s.shareLinksSection}>
        <h3 className={s.shareLinksTitle}>Quick Share</h3>
        <p className={s.shareLinksDesc}>
          Opens compose window with prefilled text
          {utmSource && " (using your UTM link)"}
        </p>
        <div className={s.shareLinksGrid}>
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className={s.shareLink}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Twitter
          </a>
          <a
            href={shareLinks.reddit}
            target="_blank"
            rel="noopener noreferrer"
            className={s.shareLink}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
            </svg>
            Reddit
          </a>
          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={s.shareLink}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </a>
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className={s.shareLink}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </a>
          <a
            href={shareLinks.email}
            target="_blank"
            rel="noopener noreferrer"
            className={s.shareLink}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            Email
          </a>
        </div>
      </div>

      {/* UTM Builder */}
      <div className={s.utmSection}>
        <h3 className={s.utmTitle}>UTM Link Builder</h3>
        <p className={s.utmDesc}>Track where your external traffic comes from</p>
        <div className={s.utmForm}>
          <div className={s.utmField}>
            <label htmlFor="utm-source">Source</label>
            <input
              id="utm-source"
              type="text"
              placeholder="e.g., twitter, newsletter"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              className={sourceError ? s.utmInputError : ""}
            />
            {sourceError && <span className={s.utmError}>{sourceError}</span>}
          </div>
          <div className={s.utmField}>
            <label htmlFor="utm-medium">Medium</label>
            <select
              id="utm-medium"
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              className={s.utmSelect}
            >
              {UTM_MEDIUM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className={s.utmField}>
            <label htmlFor="utm-campaign">Campaign</label>
            <input
              id="utm-campaign"
              type="text"
              placeholder="e.g., launch-week"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              className={campaignError ? s.utmInputError : ""}
            />
            {campaignError && <span className={s.utmError}>{campaignError}</span>}
          </div>
        </div>
        <div className={s.utmResult}>
          <code className={s.utmLink}>{utmLink}</code>
          <div className={s.utmActions}>
            <button
              className={s.utmResetBtn}
              onClick={handleReset}
              type="button"
            >
              Reset
            </button>
            <CopyButton text={utmLink} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PromoItem({
  platform,
  text,
  charLimit,
}: {
  platform: string;
  text: string;
  charLimit?: number;
}) {
  const isOverLimit = charLimit && text.length > charLimit;

  return (
    <div className={s.promoItem}>
      <div className={s.promoItemHeader}>
        <span className={s.promoItemPlatform}>{platform}</span>
        {charLimit && (
          <span
            className={`${s.promoItemCharCount} ${isOverLimit ? s.overLimit : ""}`}
          >
            {text.length}/{charLimit}
          </span>
        )}
        <CopyButton text={text} />
      </div>
      <p className={s.promoItemText}>{text}</p>
    </div>
  );
}
