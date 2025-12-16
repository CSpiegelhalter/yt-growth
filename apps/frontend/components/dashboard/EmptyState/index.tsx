"use client";

import s from "./style.module.css";

export default function EmptyState({
  onConnect,
  canAdd,
}: {
  onConnect: () => void;
  canAdd: boolean;
}) {
  return (
    <div className={s.empty}>
      <div>
        <h3 className={s.h3}>No channels linked yet</h3>
        <p className={s.subtle}>
          Link your YouTube channel to run audits, keyword research, and title
          tests.
        </p>
        <button
          onClick={onConnect}
          className={`${s.btn} ${s.btnPrimary}`}
          disabled={!canAdd}
        >
          Connect YouTube
        </button>
      </div>
    </div>
  );
}
