"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import { BRAND } from "@/lib/shared/brand";

import styles from "../../style.module.css";

interface SocialShareProps {
  title: string;
}

export function SocialShare({ title }: SocialShareProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const url = `${BRAND.url}${pathname}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API unavailable */
    }
  }, [url]);

  return (
    <>
      {/* Desktop: vertical sticky sidebar */}
      <aside className={styles.shellSocial} aria-label="Share this article">
        <div className={styles.shellSocialInner}>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.shellSocialBtn}
            aria-label="Share on X"
          >
            <XIcon />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.shellSocialBtn}
            aria-label="Share on LinkedIn"
          >
            <LinkedInIcon />
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className={styles.shellSocialBtn}
            aria-label={copied ? "Link copied" : "Copy link"}
          >
            {copied ? <CheckIcon /> : <LinkIcon />}
          </button>
        </div>
      </aside>

      {/* Mobile: horizontal bar */}
      <div className={styles.shellMobileSocial} aria-label="Share this article">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shellSocialBtn}
          aria-label="Share on X"
        >
          <XIcon />
          <span>Share</span>
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shellSocialBtn}
          aria-label="Share on LinkedIn"
        >
          <LinkedInIcon />
          <span>LinkedIn</span>
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className={styles.shellSocialBtn}
          aria-label={copied ? "Link copied" : "Copy link"}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
          <span>{copied ? "Copied" : "Copy link"}</span>
        </button>
      </div>
    </>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
