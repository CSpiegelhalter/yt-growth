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
  const encodedTitle = encodeURIComponent(videoTitle);
  const encodedUrl = encodeURIComponent(shareUrl);

  // Prefilled share links
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=Check%20out%20this%20video:%20${encodedUrl}`,
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
            𝕏 Twitter
          </a>
          <a
            href={shareLinks.reddit}
            target="_blank"
            rel="noopener noreferrer"
            className={s.shareLink}
          >
            Reddit
          </a>
          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={s.shareLink}
          >
            LinkedIn
          </a>
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className={s.shareLink}
          >
            Facebook
          </a>
          <a
            href={shareLinks.email}
            target="_blank"
            rel="noopener noreferrer"
            className={s.shareLink}
          >
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
