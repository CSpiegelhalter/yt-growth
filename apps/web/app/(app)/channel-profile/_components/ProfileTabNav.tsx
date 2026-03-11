"use client";

import type { ProfileTabId } from "@/lib/features/channels/types";
import { PROFILE_TABS } from "@/lib/features/channels/types";

import s from "./ProfileTabNav.module.css";

type Props = {
  activeTab: ProfileTabId;
  onTabChange: (tabId: ProfileTabId) => void;
};

export function ProfileTabNav({ activeTab, onTabChange }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = (index + 1) % PROFILE_TABS.length;
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = (index - 1 + PROFILE_TABS.length) % PROFILE_TABS.length;
    } else {
      return;
    }
    onTabChange(PROFILE_TABS[nextIndex].id);
  };

  return (
    <div className={s.nav} role="tablist" aria-label="Profile sections">
      {PROFILE_TABS.map((tab, index) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={activeTab === tab.id}
          className={`${s.tab} ${activeTab === tab.id ? s.tabActive : ""}`}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          tabIndex={activeTab === tab.id ? 0 : -1}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
