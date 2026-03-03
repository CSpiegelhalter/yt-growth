"use client";

import type { Status } from "../saved-ideas-types";
import { FILTER_TABS } from "../saved-ideas-types";
import s from "../style.module.css";

type IdeaFiltersProps = {
  filter: Status | "all";
  onFilterChange: (key: Status | "all") => void;
  counts: Record<string, number>;
};

export function IdeaFilters({ filter, onFilterChange, counts }: IdeaFiltersProps) {
  return (
    <div className={s.filters}>
      {FILTER_TABS.map((tab) => (
        <button
          key={tab.key}
          className={`${s.filterBtn} ${filter === tab.key ? s.active : ""}`}
          onClick={() => onFilterChange(tab.key)}
        >
          {tab.label}
          {counts[tab.key] > 0 && (
            <span className={s.filterCount}>{counts[tab.key]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
