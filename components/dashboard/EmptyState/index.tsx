"use client";

import s from "./style.module.css";

type Props = {
  onConnect: () => void;
  canAdd: boolean;
};

/**
 * Empty state for when user has no connected channels
 */
export default function EmptyState({ onConnect, canAdd }: Props) {
  return (
    <div className={s.container}>
      <div className={s.iconWrap}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </div>
      <h3 className={s.title}>Connect Your Channel</h3>
      <p className={s.description}>
        Link your YouTube channel to unlock growth insights, retention analysis, and personalized content ideas.
      </p>
      <div className={s.features}>
        <div className={s.feature}>
          <span>Video analysis</span>
        </div>
        <div className={s.feature}>
          <span>Content recommendations</span>
        </div>
        <div className={s.feature}>
          <span>Subscriber driver insights</span>
        </div>
      </div>
      <button
        onClick={onConnect}
        className={s.btn}
        disabled={!canAdd}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        Connect YouTube
      </button>
      {!canAdd && (
        <p className={s.limitNote}>
          Upgrade your plan to connect more channels
        </p>
      )}
    </div>
  );
}
