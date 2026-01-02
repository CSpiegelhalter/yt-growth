"use client";

import { useState } from "react";
import s from "../style.module.css";
import { CopyButton } from "./CopyButton";
import type { VideoInsightsLLM, HookFix, CTALines } from "@/types/api";

type LowDataModePanelProps = {
  views: number;
  impressions: number | null;
  analyticsConnected?: boolean;
  llmInsights: VideoInsightsLLM | null;
  onContextUpdate?: (context: UserContext) => void;
};

export type UserContext = {
  platform?: "mac" | "windows" | "linux" | "any";
  tooling?: string;
  audience?: "beginner" | "intermediate" | "advanced";
  topic?: string;
};

/**
 * LowDataModePanel - Shown when data is insufficient for high-confidence insights
 * Still provides value: packaging critique, hook suggestions, promo copy
 * All labeled as "Low confidence" with unlock hints
 */
export function LowDataModePanel({
  views,
  impressions,
  analyticsConnected = false,
  llmInsights,
  onContextUpdate,
}: LowDataModePanelProps) {
  const [showContextInput, setShowContextInput] = useState(false);
  const [context, setContext] = useState<UserContext>({});

  // Generate adaptive unlock guidance
  const getUnlockGuidance = () => {
    const parts: string[] = [];
    
    if (!analyticsConnected) {
      parts.push("Connect YouTube Analytics to measure impressions and CTR");
    } else if (impressions != null && impressions < 200) {
      parts.push(`${200 - impressions} more impressions for discovery insights`);
    }
    
    if (views < 100) {
      parts.push(`${100 - views} more views for engagement metrics`);
    }
    
    if (parts.length === 0) {
      return null;
    }
    
    return parts;
  };

  const unlockParts = getUnlockGuidance();

  const handleContextChange = (key: keyof UserContext, value: string) => {
    const newContext = { ...context, [key]: value || undefined };
    setContext(newContext);
  };

  const handleApplyContext = () => {
    onContextUpdate?.(context);
    setShowContextInput(false);
  };

  return (
    <section className={s.lowDataModePanel}>
      <div className={s.lowDataModeHeader}>
        <span className={s.lowDataModeIcon}>📊</span>
        <div>
          <h2 className={s.lowDataModeTitle}>Low-Data Mode</h2>
          <p className={s.lowDataModeDesc}>
            We have limited data for this video. The suggestions below are generated
            from your title and description—not measured performance.
          </p>
        </div>
      </div>

      {/* Adaptive unlock guidance */}
      {unlockParts && unlockParts.length > 0 && (
        <div className={s.unlockHint}>
          <strong>To unlock measured insights:</strong>
          <p className={s.unlockHintText}>
            {!analyticsConnected 
              ? "Connect YouTube Analytics to measure impressions and CTR. Until then, we can still generate packaging and promotion assets using your title and description."
              : unlockParts.join(" • ")}
          </p>
        </div>
      )}

      {/* Context Chips - Help improve suggestions */}
      {onContextUpdate && (
        <div className={s.contextSection}>
          {!showContextInput ? (
            <button 
              className={s.improveBtn}
              onClick={() => setShowContextInput(true)}
            >
              🎯 Improve suggestions with context
            </button>
          ) : (
            <div className={s.contextInputs}>
              <p className={s.contextNote}>
                Optional: Add context to get more relevant suggestions
              </p>
              <div className={s.contextChipsRow}>
                <div className={s.contextChip}>
                  <label>Platform</label>
                  <select 
                    value={context.platform ?? ""} 
                    onChange={(e) => handleContextChange("platform", e.target.value)}
                  >
                    <option value="">Any/Unknown</option>
                    <option value="mac">Mac</option>
                    <option value="windows">Windows</option>
                    <option value="linux">Linux</option>
                    <option value="any">Cross-platform</option>
                  </select>
                </div>
                <div className={s.contextChip}>
                  <label>Audience</label>
                  <select 
                    value={context.audience ?? ""} 
                    onChange={(e) => handleContextChange("audience", e.target.value)}
                  >
                    <option value="">Any level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className={s.contextChip}>
                  <label>Tooling (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Homebrew, Docker"
                    value={context.tooling ?? ""}
                    onChange={(e) => handleContextChange("tooling", e.target.value)}
                  />
                </div>
              </div>
              <div className={s.contextActions}>
                <button 
                  className={s.contextApplyBtn}
                  onClick={handleApplyContext}
                >
                  Apply & Refresh
                </button>
                <button 
                  className={s.contextCancelBtn}
                  onClick={() => setShowContextInput(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Packaging Critique */}
      {llmInsights?.titleAnalysis && (
        <div className={s.lowDataSection}>
          <div className={s.lowDataSectionHeader}>
            <h3>Packaging Notes</h3>
            <span className={s.generatedBadge}>
              <span className={s.badgeIcon}>✨</span> Generated
            </span>
          </div>
          <p className={s.lowDataNote}>
            Based on title/description analysis (no CTR data)
          </p>

          {llmInsights.titleAnalysis.weaknesses &&
            llmInsights.titleAnalysis.weaknesses.length > 0 && (
              <div className={s.lowDataList}>
                <h4>Areas to consider:</h4>
                <ul>
                  {/* Deduplicate weaknesses that might appear in both sections */}
                  {[...new Set(llmInsights.titleAnalysis.weaknesses)].map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

          {llmInsights.titleAnalysis.suggestions &&
            llmInsights.titleAnalysis.suggestions.length > 0 && (
              <div className={s.lowDataSuggestions}>
                <h4>Alternative titles to try:</h4>
                {llmInsights.titleAnalysis.suggestions.map((sug, i) => (
                  <div key={i} className={s.suggestionRow}>
                    <span>{sug}</span>
                    <CopyButton text={sug} />
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Hook Suggestions - Topic-specific */}
      {llmInsights?.hookFix && (
        <HookFixSection hookFix={llmInsights.hookFix} />
      )}

      {/* Generic hook suggestions if no specific ones */}
      {!llmInsights?.hookFix && (
        <div className={s.lowDataSection}>
          <div className={s.lowDataSectionHeader}>
            <h3>Hook Structure</h3>
            <span className={s.generatedBadge}>
              <span className={s.badgeIcon}>📝</span> Template
            </span>
          </div>
          <p className={s.lowDataNote}>
            General best practices — add context above for topic-specific hooks
          </p>

          <div className={s.lowDataList}>
            <h4>First 15 seconds structure:</h4>
            <ul>
              <li>Open with the promise or payoff (not "Hey guys")</li>
              <li>Create a curiosity gap or tension in the first sentence</li>
              <li>Show, don't tell — use a visual pattern interrupt</li>
            </ul>
          </div>

          <div className={s.lowDataList}>
            <h4>First minute beats:</h4>
            <ol>
              <li><strong>Hook (0-5s):</strong> State what they'll get</li>
              <li><strong>Proof (5-15s):</strong> Why should they trust you?</li>
              <li><strong>Preview (15-30s):</strong> What will they see/learn?</li>
              <li><strong>Stakes (30-45s):</strong> Why does this matter now?</li>
              <li><strong>Transition (45-60s):</strong> Lead into the main content</li>
            </ol>
          </div>
        </div>
      )}

      {/* CTA Suggestions */}
      {llmInsights?.ctaLines && (
        <CTASection ctaLines={llmInsights.ctaLines} />
      )}
    </section>
  );
}

function HookFixSection({ hookFix }: { hookFix: HookFix }) {
  return (
    <div className={s.lowDataSection}>
      <div className={s.lowDataSectionHeader}>
        <h3>Hook Suggestions</h3>
        <span className={s.generatedBadge}>
          <span className={s.badgeIcon}>✨</span> Generated
        </span>
      </div>
      <p className={s.lowDataNote}>
        Based on your title — these are topic-specific hooks
      </p>

      {hookFix.first15SecondsScripts.length > 0 && (
        <div className={s.lowDataSuggestions}>
          <h4>First 15 seconds scripts:</h4>
          {hookFix.first15SecondsScripts.map((script, i) => (
            <div key={i} className={s.hookScript}>
              <span className={s.hookScriptNumber}>Option {i + 1}</span>
              <p>{script}</p>
              <CopyButton text={script} />
            </div>
          ))}
        </div>
      )}

      {hookFix.firstMinuteOutline.length > 0 && (
        <div className={s.lowDataList}>
          <h4>First minute outline:</h4>
          <ol>
            {hookFix.firstMinuteOutline.map((beat, i) => (
              <li key={i}>{beat}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function CTASection({ ctaLines }: { ctaLines: CTALines }) {
  const allCtas = [
    ...(ctaLines.subscribe ?? []).map((t) => ({ type: "Subscribe", text: t })),
    ...(ctaLines.nextVideo ?? []).map((t) => ({ type: "Next Video", text: t })),
    ...(ctaLines.playlist ?? []).map((t) => ({ type: "Playlist", text: t })),
    ...(ctaLines.commentPrompt ?? []).map((t) => ({
      type: "Comment",
      text: t,
    })),
  ];

  if (allCtas.length === 0) return null;

  return (
    <div className={s.lowDataSection}>
      <div className={s.lowDataSectionHeader}>
        <h3>CTA Suggestions</h3>
        <span className={s.generatedBadge}>
          <span className={s.badgeIcon}>✨</span> Generated
        </span>
      </div>
      <p className={s.lowDataNote}>Copy-paste ready calls to action</p>

      <div className={s.ctaGrid}>
        {allCtas.slice(0, 8).map((cta, i) => (
          <div key={i} className={s.ctaItem}>
            <span className={s.ctaType}>{cta.type}</span>
            <p className={s.ctaText}>{cta.text}</p>
            <CopyButton text={cta.text} />
          </div>
        ))}
      </div>
    </div>
  );
}
