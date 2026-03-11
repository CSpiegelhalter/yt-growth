"use client";

import s from "./tab-toggle.module.css";

export type VideoTab = "published" | "planned";

type TabToggleProps = {
  activeTab: VideoTab;
  onTabChange: (tab: VideoTab) => void;
};

export function TabToggle({ activeTab, onTabChange }: TabToggleProps) {
  return (
    <div className={s.container}>
      <button
        type="button"
        className={`${s.tab} ${activeTab === "published" ? s.tabActive : ""}`}
        onClick={() => onTabChange("published")}
      >
        Published
      </button>
      <button
        type="button"
        className={`${s.tab} ${activeTab === "planned" ? s.tabActive : ""}`}
        onClick={() => onTabChange("planned")}
      >
        Planned
      </button>
    </div>
  );
}
