"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import s from "./style.module.css";
import { ProfileEditor } from "@/components/channel-profile";
import { useChannelProfile } from "@/lib/hooks/use-channel-profile";
import { ChannelProfileAI } from "@/lib/channel-profile/types";

export default function ChannelProfileClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const channelId = searchParams.get("channelId");

  const {
    profile,
    loading,
    saving,
    generating,
    error,
    saveProfile,
    generateAI,
    clearError,
  } = useChannelProfile(channelId);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle successful save + generate
  const handleSave = async (input: any) => {
    const saved = await saveProfile(input);
    if (saved) {
      // Auto-generate AI profile after saving if it's new or input changed
      const ai = await generateAI(false);
      if (ai) {
        setSuccessMessage("Profile saved and AI summary generated!");
      } else {
        setSuccessMessage("Profile saved!");
      }
    }
    return saved;
  };

  // Handle regenerate
  const handleRegenerate = async () => {
    const ai = await generateAI(true);
    if (ai) {
      setSuccessMessage("AI summary regenerated!");
    }
  };

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear error when closing
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Redirect if no channel selected
  if (!channelId) {
    return (
      <main className={s.page}>
        <div className={s.container}>
          <div className={s.emptyState}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <path d="M20 8v6M23 11h-6" />
            </svg>
            <h2>No Channel Selected</h2>
            <p>Please select a channel from your dashboard first.</p>
            <Link href="/dashboard" className={s.backBtn}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={s.page}>
      <div className={s.container}>
        {/* Header */}
        <div className={s.header}>
          <Link
            href={`/dashboard?channelId=${channelId}`}
            className={s.backLink}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className={s.title}>Channel Profile</h1>
          <p className={s.subtitle}>
            Define your channel's niche, audience, and style. This helps us provide
            better video ideas, competitor suggestions, and personalized insights.
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className={s.successBanner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
            {successMessage}
          </div>
        )}

        {error && (
          <div className={s.errorBanner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
            {error}
            <button onClick={clearError} className={s.closeBannerBtn}>×</button>
          </div>
        )}

        {/* AI Profile Summary (if exists) */}
        {profile?.aiProfile && (
          <div className={s.aiSummary}>
            <div className={s.aiSummaryHeader}>
              <h2 className={s.aiSummaryTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                AI-Generated Summary
              </h2>
              <button
                className={s.regenBtn}
                onClick={handleRegenerate}
                disabled={generating}
              >
                {generating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
            <div className={s.aiSummaryContent}>
              <div className={s.nicheLabel}>{profile.aiProfile.nicheLabel}</div>
              <p className={s.nicheDesc}>{profile.aiProfile.nicheDescription}</p>

              {profile.aiProfile.contentPillars.length > 0 && (
                <div className={s.pillarsSection}>
                  <h4>Content Pillars</h4>
                  <div className={s.pillarsList}>
                    {profile.aiProfile.contentPillars.map((pillar, i) => (
                      <div key={i} className={s.pillarItem}>
                        <strong>{pillar.name}</strong>
                        <span>{pillar.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={s.aiMeta}>
                <span>Target: {profile.aiProfile.targetAudience}</span>
                {profile.lastGeneratedAt && (
                  <span>
                    Generated: {new Date(profile.lastGeneratedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className={s.editorSection}>
          <h2 className={s.sectionTitle}>
            {profile ? "Edit Your Profile" : "Create Your Profile"}
          </h2>

          {loading ? (
            <div className={s.loadingState}>
              <div className={s.spinner} />
              <p>Loading profile...</p>
            </div>
          ) : (
            <ProfileEditor
              initialInput={profile?.input}
              onSave={handleSave}
              onCancel={() => router.push(`/dashboard?channelId=${channelId}`)}
              onGenerate={handleRegenerate}
              saving={saving}
              generating={generating}
              hasAIProfile={!!profile?.aiProfile}
            />
          )}
        </div>
      </div>
    </main>
  );
}
