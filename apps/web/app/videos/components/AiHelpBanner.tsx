"use client";

import s from "./idea-editor-panel.module.css";

export function AiHelpBanner() {
  return (
    <div className={s.aiHelpBanner}>
      <span className={s.aiHelpIcon}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
        </svg>
      </span>
      <span className={s.aiHelpText}>
        <span className={s.aiHelpTitle}>Create faster with help</span>
        <span className={s.aiHelpDesc}>
          Use the Suggest buttons to generate content for each field based on your channel data.
        </span>
      </span>
    </div>
  );
}
