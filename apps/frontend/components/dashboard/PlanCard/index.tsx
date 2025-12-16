"use client";

import { useState } from "react";
import s from "./style.module.css";
import type { Plan } from "@/types/api";

type Props = {
  plan: Plan | null;
  channelId: string;
  isSubscribed: boolean;
  onGenerate: () => Promise<void>;
  loading?: boolean;
};

export default function PlanCard({
  plan,
  channelId,
  isSubscribed,
  onGenerate,
  loading = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate();
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className={s.card}>
        <div className={s.skeleton} style={{ height: 24, width: "60%" }} />
        <div className={s.skeleton} style={{ height: 16, width: "40%", marginTop: 8 }} />
        <div className={s.skeleton} style={{ height: 100, marginTop: 16 }} />
      </div>
    );
  }

  return (
    <div className={s.card}>
      <div className={s.header}>
        <div>
          <h3 className={s.title}>📋 Decide-for-Me Plan</h3>
          {plan && (
            <span className={s.meta}>
              Generated {new Date(plan.createdAt).toLocaleDateString()}
              {plan.isCached && <span className={s.badge}>Cached</span>}
            </span>
          )}
        </div>
        {isSubscribed && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={`${s.btn} ${s.btnPrimary}`}
          >
            {generating ? "Generating..." : plan ? "Regenerate" : "Generate Plan"}
          </button>
        )}
      </div>

      {!isSubscribed && (
        <div className={s.locked}>
          <p>🔒 Subscribe to unlock AI-powered content plans</p>
          <a href="/api/integrations/stripe/checkout" className={`${s.btn} ${s.btnSuccess}`}>
            Subscribe Now
          </a>
        </div>
      )}

      {isSubscribed && !plan && (
        <div className={s.empty}>
          <p>No plan generated yet. Click "Generate Plan" to get AI-powered recommendations for your next video.</p>
        </div>
      )}

      {plan && (
        <div className={s.content}>
          <div className={expanded ? s.expanded : s.collapsed}>
            <div className={s.markdown} dangerouslySetInnerHTML={{ __html: formatMarkdown(plan.outputMarkdown) }} />
          </div>
          <button onClick={() => setExpanded(!expanded)} className={s.toggleBtn}>
            {expanded ? "Show Less" : "Show More"}
          </button>
        </div>
      )}
    </div>
  );
}

function formatMarkdown(md: string): string {
  // Simple markdown to HTML conversion
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.+?)\*\*/gm, '<strong>$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="todo">☐ $1</li>')
    .replace(/^- \[x\] (.+)$/gm, '<li class="todo done">☑ $1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    .replace(/<p><h/g, '<h')
    .replace(/<\/h(\d)><\/p>/g, '</h$1>')
    .replace(/<p><li/g, '<li')
    .replace(/<\/li><\/p>/g, '</li>');
}

